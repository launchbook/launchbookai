const express = require('express');
const { supabase } = require('../lib/supabase');
const { validateActivePlan } = require('../lib/plan');

const router = express.Router();

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
    const buffer = Buffer.from(base64Image.replace(/^data:image\/png;base64,/, ''), 'base64');
    const filename = `ebook_image_${Date.now()}.png`;
    const path = `ai_generated_images/${user_id}/${filename}`;

    const { error } = await supabase.storage
      .from('user_files')
      .upload(path, buffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (error) return res.status(500).json({ error: 'Upload failed' });

    const { data: urlData } = await supabase.storage.from('user_files').getPublicUrl(path);
    return res.json({ success: true, url: urlData.publicUrl });

  } catch (err) {
    console.error('❌ AI image upload error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
