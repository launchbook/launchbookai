const express = require('express');
const { supabase } = require('../lib/supabase');
const { validateActivePlan } = require('../lib/plan');

const router = express.Router();
const MAX_IMAGE_SIZE_MB = 10;
const SUPPORTED_TYPES = ['png', 'jpg', 'jpeg', 'webp'];

// ✅ Helper: Extract extension + base64
function extractImageData(base64String) {
  const match = base64String.match(/^data:image\/(png|jpg|jpeg|webp);base64,(.+)$/i);
  if (!match) throw new Error('Unsupported image format');

  const ext = match[1].toLowerCase();
  const buffer = Buffer.from(match[2], 'base64');
  return { ext, buffer };
}

// ✅ Shared credit + log helper
async function logAndDeductCredits(user_id, action, credits) {
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
}

// ✅ POST /regenerate-cover-image (AI-generated)
router.post('/regenerate-cover-image', async (req, res) => {
  const { user_id, base64Image } = req.body;

  if (!user_id || !base64Image) {
    return res.status(400).json({ error: 'Missing user_id or base64Image' });
  }

  const planCheck = await validateActivePlan(user_id);
  if (!planCheck.allowed) {
    return res.status(403).json({ error: planCheck.reason });
  }

  try {
    const { ext, buffer } = extractImageData(base64Image);

    if (!SUPPORTED_TYPES.includes(ext)) {
      return res.status(400).json({ error: 'Unsupported image type' });
    }

    if (buffer.length > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      return res.status(400).json({ error: 'Image exceeds 10MB limit' });
    }

    const filename = `cover_${Date.now()}.${ext}`;
    const path = `ai_generated_covers/${user_id}/${filename}`;

    const { error } = await supabase.storage
      .from('user_files')
      .upload(path, buffer, {
        contentType: `image/${ext}`,
        upsert: true,
      });

    if (error) return res.status(500).json({ error: 'Upload failed' });

    const { data: urlData } = await supabase.storage.from('user_files').getPublicUrl(path);

    // ✅ Log + Deduct 100 credits
    await logAndDeductCredits(user_id, 'regenerate-cover-image', 100);

    return res.json({ success: true, url: urlData.publicUrl, filename, path });

  } catch (err) {
    console.error('❌ Cover upload error:', err);
    return res.status(500).json({ error: err.message });
  }
});
