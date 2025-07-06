// server.js
import express from 'express';
import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config(); // Load .env variables

const app = express();
app.use(express.json());

// ✅ Supabase Client (use service role only on backend)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ PDF generation + email route
app.post('/generate-pdf', async (req, res) => {
  const { html, user_id, email } = req.body;

  if (!html || !user_id || !email) {
    return res.status(400).json({ error: "Missing html, user_id, or email" });
  }

  try {
    // 🧾 Launch Puppeteer and render the HTML to PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    // 🗂️ Upload PDF to Supabase Storage
    const filePath = `${user_id}-latest.pdf`;
    const { error: uploadErr } = await supabase
      .storage
      .from('generated-pdfs')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadErr) return res.status(500).json({ error: uploadErr.message });

    const { data: { publicUrl } } = supabase
      .storage
      .from('generated-pdfs')
      .getPublicUrl(filePath);

    // 📩 Send email with download link
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
        <p><a href="${publicUrl}" target="_blank">📥 Download Your eBook</a></p>
        <p>Thanks for using Leostarearn!</p>
      `
    });

    return res.json({ success: true, url: publicUrl });

  } catch (err) {
    console.error("❌ Error generating or sending PDF:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ✅ Render-compatible port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
