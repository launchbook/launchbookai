import express from 'express';
import puppeteer from 'puppeteer';
import { validateActivePlan } from '../lib/plan.js';
import { supabase } from '../lib/supabase.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const router = express.Router();

// ✅ Upload helper
const uploadToSupabase = async (user_id, buffer, fileName) => {
  const fullPath = `${user_id}/${fileName}`;
  const { error: uploadError } = await supabase.storage
    .from('user_files')
    .upload(fullPath, buffer, {
      contentType: fileName.endsWith('.pdf') ? 'application/pdf' : 'application/epub+zip',
      upsert: true
    });
  if (uploadError) throw new Error(uploadError.message);

  const { data: signedData, error: urlError } = await supabase.storage
    .from('user_files')
    .createSignedUrl(fullPath, 60 * 60 * 24 * 7);
  if (urlError) throw new Error(urlError.message);

  return signedData.signedUrl;
};

// ✅ POST /generate-pdf → PDF or EPUB from HTML
router.post('/generate-pdf', async (req, res) => {
  const {
    html, user_id, email,
    title, topic, language, audience, tone, purpose,
    output_format = 'pdf'
  } = req.body;

  if (!html || !user_id || !email) {
    return res.status(400).json({ error: 'Missing html, user_id, or email' });
  }

  const planCheck = await validateActivePlan(user_id);
  if (!planCheck.allowed) {
    return res.status(403).json({ success: false, error: planCheck.reason });
  }

  try {
    let fileBuffer, fileName;

    if (output_format === 'epub') {
      // 📌 Replace this with real EPUB logic later
      fileBuffer = Buffer.from(html);
      fileName = `generated-${Date.now()}.epub`;
    } else {
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      fileBuffer = await page.pdf({ format: 'A4', printBackground: true });
      await browser.close();
      fileName = `generated-${Date.now()}.pdf`;
    }

    const signedUrl = await uploadToSupabase(user_id, fileBuffer, fileName);

    // ✅ Save metadata
    await supabase.from('generated_files').insert([{
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
    console.error('❌ Error in /generate-pdf:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ✅ POST /generate-from-url → PDF or EPUB from external URL
router.post('/generate-from-url', async (req, res) => {
  const { url, user_id, output_format = 'pdf' } = req.body;

  if (!url || !user_id) {
    return res.status(400).json({ error: 'Missing url or user_id' });
  }

  const planCheck = await validateActivePlan(user_id);
  if (!planCheck.allowed) {
    return res.status(403).json({ error: planCheck.reason });
  }

  try {
    let fileBuffer, fileName;

    if (output_format === 'epub') {
      const dummyHTML = `<html><head><title>eBook</title></head><body><h1>Content from ${url}</h1><p>This is a placeholder EPUB.</p></body></html>`;
      fileBuffer = Buffer.from(dummyHTML); // 🔁 Replace with real EPUB later
      fileName = `url-generated-${Date.now()}.epub`;
    } else {
      const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle0' });
      fileBuffer = await page.pdf({ format: 'A4', printBackground: true });
      await browser.close();
      fileName = `url-generated-${Date.now()}.pdf`;
    }

    const signedUrl = await uploadToSupabase(user_id, fileBuffer, fileName);

    await supabase.from('generated_files').insert([{
      user_id,
      title: 'Generated from URL',
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
    console.error('❌ Error in /generate-from-url:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
