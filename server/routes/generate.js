// server/routes/generate.js
import express from 'express';
import puppeteer from 'puppeteer';
import { supabase } from '../lib/supabase.js';
import { validateActivePlan } from '../lib/validatePlan.js';

const router = express.Router();

const uploadGeneratedFile = async (user_id, buffer, fileName) => {
  const fullPath = `${user_id}/${fileName}`;
  const { error: uploadError } = await supabase.storage
    .from('user_files')
    .upload(fullPath, buffer, {
      contentType: fileName.endsWith('.pdf') ? 'application/pdf' : 'application/epub+zip',
      upsert: true,
    });

  if (uploadError) throw new Error(uploadError.message);

  const { data: signedData, error: urlError } = await supabase.storage
    .from('user_files')
    .createSignedUrl(fullPath, 60 * 60 * 24 * 7); // 7 days

  if (urlError) throw new Error(urlError.message);
  return signedData.signedUrl;
};

// ✅ PDF or EPUB from raw HTML
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
    return res.status(403).json({ error: planCheck.reason });
  }

  try {
    let fileBuffer, fileName;

    if (output_format === "epub") {
      // Still dummy logic for now
      fileBuffer = Buffer.from(html);
      fileName = `generated-${Date.now()}.epub`;
    } else {
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
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
    console.error("❌ Generate Error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
