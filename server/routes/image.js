const express = require('express');
const { supabase } = require('../lib/supabase');
const { validateActivePlan } = require('../lib/plan');
const { CREDIT_COSTS } = require('../lib/credits');

const router = express.Router();

const MAX_IMAGE_SIZE_MB = 10;
const SUPPORTED_TYPES = ['png', 'jpg', 'jpeg', 'webp'];

// ✅ Helper: Extract extension and base64 buffer
function extractImageData(base64String) {
  const match = base64String.match(/^data:image\/(png|jpg|jpeg|webp);base64,(.+)$/i);
  if (!match) throw new Error('Unsupported image format');

  const ext = match[1].toLowerCase();
  const buffer = Buffer.from(match[2], 'base64');
  return { ext, buffer };
}

// ✅ Shared log + credit helper
const logAndDeductCredits = async (user_id, action, credits) => {
  await supabase.from('user_usage_logs').insert([
    {
      user_id,
      action,
      credits_used: credits,
      created_at: new Date().toISOString()
    }
  ]);

  const { error: deductError } = await supabase.rpc('increment_credits_used', {
    p_user_id: user_id,
    p_increment: credits
  });

  if (deductError) throw new Error('Credit deduction failed');
};

// ✅ POST /upload-ai-image
router.post('/upload-ai-image', async (req, res) => {
  const { user_id, base64Image } = req.body;

  if (!user_id || !base64Image) {
    return res.status(400).json({ error: 'Missing user_id or base64Image' });
  }

  const planCheck = await validateActivePlan(user_id);
  if (!planCheck.allowed) {
    return res.status(403).json({ error: planCheck.reason });
  }

  try {
    const creditCost = CREDIT_COSTS.upload_image;

    // ✅ Check credit availability before proceeding
    const { data: planRow } = await supabase
      .from('users_plan')
      .select('credits_used, credits_limit')
      .eq('user_id', user_id)
      .single();

    if (!planRow || (planRow.credits_used + creditCost > planRow.credits_limit)) {
      return res.status(402).json({ error: 'Insufficient credits to upload image' });
    }

    // ✅ DAILY LIMIT CHECK: Max 20 uploads per user/day
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('user_usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .eq('action', 'upload-ai-image')
      .gte('created_at', today);

    if (count >= 20) {
      return res.status(429).json({
        error: 'Daily upload limit reached (20 images/day).'
      });
    }

    const { ext, buffer } = extractImageData(base64Image);

    // ✅ Size check (10MB max)
    if (buffer.length > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      return res.status(400).json({ error: 'Image exceeds 10MB limit' });
    }

    const filename = `ebook_image_${Date.now()}.${ext}`;
    const path = `ai_generated_images/${user_id}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from('user_files')
      .upload(path, buffer, {
        contentType: `image/${ext}`,
        upsert: true,
      });

    if (uploadError) {
      return res.status(500).json({ error: 'Upload failed' });
    }

    const { data: urlData } = await supabase.storage
      .from('user_files')
      .getPublicUrl(path);

    // ✅ Log and deduct credits
    await logAndDeductCredits(user_id, 'upload-ai-image', creditCost);

    return res.json({
      success: true,
      url: urlData.publicUrl,
      filename,
      path
    });

  } catch (err) {
    console.error('❌ AI image upload error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
