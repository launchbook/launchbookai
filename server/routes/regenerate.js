const express = require('express');
const puppeteer = require('puppeteer');
const { supabase } = require('../lib/supabase');
const { validateActivePlan } = require('../lib/plan');
const { generateEpubBuffer } = require('../lib/epub');
const { CREDIT_COSTS } = require('../lib/credits');

const router = express.Router();

// ✅ Upload helper
const uploadToSupabase = async (user_id, buffer, fileName, contentType = 'application/pdf') => {
  const fullPath = `${user_id}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('user_files')
    .upload(fullPath, buffer, {
      contentType,
      upsert: true,
    });

  if (uploadError) throw new Error(uploadError.message);

  const { data: signedData, error: urlError } = await supabase.storage
    .from('user_files')
    .createSignedUrl(fullPath, 60 * 60 * 24 * 7); // 7-day URL

  if (urlError) throw new Error(urlError.message);

  return signedData.signedUrl;
};

// ✅ Reusable log + credit deduction
const logAndDeductCredits = async (user_id, action, credits) => {
  await supabase.from('user_usage_logs').insert([{
    user_id,
    action,
    credits_used: credits,
    created_at: new Date().toISOString()
  }]);

  const { error: deductError } = await supabase.rpc('increment_credits_used', {
    p_user_id: user_id,
    p_increment: credits
  });

  if (deductError) throw new Error('Credit deduction failed');
};

// ✅ POST /regenerate-pdf or EPUB
router.post('/regenerate-pdf', async (req, res) => {
  const { html, user_id, output_format = 'pdf' } = req.body;

  if (!html || !user_id) {
    return res.status(400).json({ error: 'Missing html or user_id' });
  }

  const planCheck = await validateActivePlan(user_id);
  if (!planCheck.allowed) {
    return res.status(403).json({ error: planCheck.reason });
  }

  try {
    const creditCost = CREDIT_COSTS.regen_pdf;

    // ✅ Check if user has enough credits BEFORE regenerating
    const { data: planRow } = await supabase
      .from('users_plan')
      .select('credits_used, credits_limit')
      .eq('user_id', user_id)
      .single();

    if (!planRow || (planRow.credits_used + creditCost > planRow.credits_limit)) {
      return res.status(402).json({ error: 'Insufficient credits to regenerate eBook' });
    }

    let fileBuffer, fileName, contentType;

    if (output_format === 'epub') {
      fileBuffer = await generateEpubBuffer({ html, title: 'Regenerated EPUB', author: user_id });
      fileName = `regenerated-${Date.now()}.epub`;
      contentType = 'application/epub+zip';
    } else {
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      fileBuffer = await page.pdf({ format: 'A4', printBackground: true });
      await browser.close();

      fileName = `regenerated-${Date.now()}.pdf`;
      contentType = 'application/pdf';
    }

    const signedUrl = await uploadToSupabase(user_id, fileBuffer, fileName, contentType);

    await logAndDeductCredits(user_id, 'regenerate-pdf', creditCost);

    return res.json({ success: true, url: signedUrl });

  } catch (err) {
    console.error('❌ Regeneration error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
