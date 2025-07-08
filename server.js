// server.js
import express from 'express';
import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config(); // Load .env variables

const app = express();
app.use(express.json());

// ✅ Supabase Client (use service role only on backend)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ Helper: Upload PDF to Supabase and return signed URL
const uploadGeneratedPDF = async (user_id, pdfBuffer, fileName) => {
  const fullPath = `${user_id}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('user_files')
    .upload(fullPath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadError) throw new Error(uploadError.message);

  const { data: signedData, error: urlError } = await supabase.storage
    .from('user_files')
    .createSignedUrl(fullPath, 60 * 60 * 24 * 7); // valid 7 days

  if (urlError) throw new Error(urlError.message);

  return signedData.signedUrl;
};

// ✅ Main PDF generation route
app.post('/generate-pdf', async (req, res) => {
  const {
    html,
    user_id,
    email,
    title,
    topic,
    language,
    audience,
    tone,
    purpose
  } = req.body;

  if (!html || !user_id || !email) {
    return res.status(400).json({ error: "Missing html, user_id, or email" });
  }

  try {
    // 🧾 Render PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    // 🗂️ Upload PDF to Supabase Storage (user_files bucket)
    const fileName = `generated-${Date.now()}.pdf`;
    const signedUrl = await uploadGeneratedPDF(user_id, pdfBuffer, fileName);

    // 💾 Save metadata to Supabase table
    await supabase.from("generated_files").insert([{
      user_id,
      title,
      topic,
      language,
      audience,
      tone,
      purpose,
      download_url: signedUrl,
      created_at: new Date().toISOString()
    }]);

    // 📩 Optional: send email (currently commented)
    /*
    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.in',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Leostarearn eBooks" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '📘 Your eBook is Ready!',
      html: `
        <p>Hello,</p>
        <p>Your custom eBook is ready! Click below to download it:</p>
        <p><a href="${signedUrl}" target="_blank">📥 Download Your eBook</a></p>
        <p>Thanks for using Leostarearn!</p>
      `
    });
    */

    return res.json({ success: true, url: signedUrl });

  } catch (err) {
    console.error("❌ Error generating or uploading PDF:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ✅ Server start (Render-compatible)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
