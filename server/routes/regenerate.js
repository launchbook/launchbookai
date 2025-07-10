// server/routes/regenerate.js
const express = require('express');
const puppeteer = require('puppeteer');
const { supabase } = require('../lib/supabase');
const { validateActivePlan } = require('../lib/plan');

const router = express.Router();

// ✅ Upload helper
const uploadToSupabase = async (user_id, buffer, fileName) => {
  const fullPath = `${user_id}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('user_files')
    .upload(fullPath, buffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadError) throw new Error(uploadError.message);

  const { data: signedData, error: urlError } = await supabase.storage
    .from('user_files')
    .createSignedUrl(fullPath, 60 * 60 * 24 * 7); // 7-day URL

  if (urlError) throw new Error(urlError.message);

  return signedData.signedUrl;
};

// ✅ POST /regenerate-pdf
router.post('/regenerate-pdf', async (req, res) => {
  const { html, user_id } = req.body;

  if (!html || !user_id) {
    return res.status(400).json({ error: 'Missing html or user_id' });
  }

  const planCheck = await validateActivePlan(user_id);
  if (!planCheck.allowed) {
    return res.status(403).json({ error: planCheck.reason });
  }

  try {
    // 🧠 Generate PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const fileBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    const fileName = `regenerated-${Date.now()}.pdf`;
    const signedUrl = await uploadToSupabase(user_id, fileBuffer, fileName);

    // ✅ Backend Credit Log (Required for abuse prevention)
    const { error: logError } = await supabase.from('user_usage_logs').insert([
      {
        user_id,
        action: 'regenerate-pdf',
        credits_used: 100,
        created_at: new Date().toISOString()
      }
    ]);

    // ✅ Deduct Credits on Supabase (same as frontend)
    const { error: deductError } = await supabase.rpc('increment_credits_used', {
      p_user_id: user_id,
      p_increment: 100
    });

    if (logError || deductError) {
      console.error('❌ Usage log or credit deduction failed', { logError, deductError });
      return res.status(500).json({ error: 'Failed to record usage or deduct credits' });
    }

    return res.json({ success: true, url: signedUrl });

  } catch (err) {
    console.error('❌ PDF Regeneration error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
