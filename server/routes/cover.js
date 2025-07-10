const express = require('express');
const { supabase } = require('../lib/supabase');
const { validateActivePlan } = require('../lib/plan');

const router = express.Router();

// ✅ 1. AI-generated cover upload (with credit log)
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
    const buffer = Buffer.from(base64Image.replace(/^data:image\/png;base64,/, ''), 'base64');

    const MAX_IMAGE_SIZE_MB = 10;
    if (buffer.length > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      return res.status(400).json({ error: 'Cover image exceeds 10MB limit' });
    }

    const filename = `cover_${Date.now()}.png`;
    const path = `ai_generated_covers/${user_id}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from('user_files')
      .upload(path, buffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) return res.status(500).json({ error: 'Upload failed' });

    const { data: urlData } = await supabase.storage.from('user_files').getPublicUrl(path);

    // ✅ Log credits used (100)
    await supabase.from('user_usage_logs').insert([
      {
        user_id,
        action: 'regenerate-cover-image',
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
    console.error('❌ Cover upload error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ✅ 2. Manual user-uploaded cover (no credits deducted)
router.post('/upload-cover-image', async (req, res) => {
  const { user_id, base64Image } = req.body;

  if (!user_id || !base64Image) {
    return res.status(400).send({ error: 'Missing fields' });
  }

  const buffer = Buffer.from(base64Image.replace(/^data:image\/png;base64,/, ''), 'base64');
  const filename = `manual_cover_${Date.now()}.png`;
  const filePath = `user_uploaded_covers/${user_id}/${filename}`;

  const { error } = await supabase.storage
    .from('user_files')
    .upload(filePath, buffer, {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) return res.status(500).send({ error: 'Upload failed' });

  const { data: urlData } = await supabase.storage.from('user_files').getPublicUrl(filePath);

  return res.json({
    url: urlData.publicUrl,
    path: filePath,
    filename
  });
});

module.exports = router;
