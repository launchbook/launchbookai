const express = require('express');
const { supabase } = require('../lib/supabase');
const { validateActivePlan } = require('../lib/plan');
const router = express.Router();

- const MAX_IMAGE_SIZE_MB = 2;
+ const MAX_IMAGE_SIZE_MB = 10;
const SUPPORTED_TYPES = ['png', 'jpg', 'jpeg', 'webp'];

// ✅ Helper: Extract extension and base64 buffer
function extractImageData(base64String) {
  const match = base64String.match(/^data:image\/(png|jpg|jpeg|webp);base64,(.+)$/i);
  if (!match) throw new Error('Unsupported image format');

  const ext = match[1].toLowerCase();
  const buffer = Buffer.from(match[2], 'base64');
  return { ext, buffer };
}

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
    const { ext, buffer } = extractImageData(base64Image);

    // ✅ Size check (2MB max)
    if (buffer.length > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      return res.status(400).json({ error: 'Image exceeds 2MB limit' });
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

    // ✅ Credit logging (deduct 100 credits)
    await supabase.from('user_usage_logs').insert([
      {
        user_id,
        action: 'upload-ai-image',
        credits_used: 100,
        created_at: new Date().toISOString()
      }
    ]);

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
