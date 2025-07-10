const express = require('express');
const router = express.Router();
const { supabase, uploadGeneratedFile } = require('../lib/supabase');
const { validateActivePlan } = require('../lib/plan');
const puppeteer = require('puppeteer');
const { generateEpubBuffer } = require('../lib/epub');

router.post('/generate-pdf', async (req, res) => {
  const {
    html,
    user_id,
    email,
    title,
    topic,
    language,
    audience,
    tone,
    purpose,
    output_format = "pdf"
  } = req.body;

  if (!html || !user_id || !email) {
    return res.status(400).json({ error: "Missing html, user_id, or email" });
  }

  const planCheck = await validateActivePlan(user_id);
  if (!planCheck.allowed) {
    return res.status(403).json({ success: false, error: planCheck.reason });
  }

  try {
    let fileBuffer, fileName;

    if (output_format === "epub") {
      fileBuffer = await generateEpubBuffer({ html, title, author: user_id });
      fileName = `generated-${Date.now()}.epub`;
    } else {
      const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      fileBuffer = await page.pdf({ format: 'A4', printBackground: true });
      await browser.close();
      fileName = `generated-${Date.now()}.pdf`;
    }

    const signedUrl = await uploadGeneratedFile(user_id, fileBuffer, fileName);

    await supabase.from("generated_files").insert([{
      user_id,
      title,
      topic,
      language,
      audience,
      tone,
      purpose,
      format: output_format,
      download_url: signedUrl,
      created_at: new Date().toISOString()
    }]);

    return res.json({ success: true, url: signedUrl });
  } catch (err) {
    console.error("❌ Generation error:", err);
    return res.status(500).json({ error: err.message });
  }
});

router.post('/generate-from-url', async (req, res) => {
  const { url, user_id, output_format = "pdf" } = req.body;

  if (!url || !user_id) {
    return res.status(400).json({ error: 'Missing url or user_id' });
  }

  const planCheck = await validateActivePlan(user_id);
  if (!planCheck.allowed) {
    return res.status(403).json({ error: planCheck.reason });
  }

  try {
    let fileBuffer, fileName;

    if (output_format === "epub") {
      const dummyHTML = `<h1>Content from ${url}</h1><p>This is a placeholder EPUB.</p>`;
      fileBuffer = await generateEpubBuffer({ html: dummyHTML, title: "Generated from URL", author: user_id });
      fileName = `url-generated-${Date.now()}.epub`;
    } else {
      const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle0' });
      fileBuffer = await page.pdf({ format: 'A4', printBackground: true });
      await browser.close();
      fileName = `url-generated-${Date.now()}.pdf`;
    }

    const signedUrl = await uploadGeneratedFile(user_id, fileBuffer, fileName);

    await supabase.from("generated_files").insert([{
      user_id,
      title: `Generated from URL`,
      topic: url,
      language: null,
      audience: null,
      tone: null,
      purpose: null,
      format: output_format,
      download_url: signedUrl,
      created_at: new Date().toISOString()
    }]);

    return res.json({ success: true, url: signedUrl });
  } catch (err) {
    console.error("❌ URL Generation error:", err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
