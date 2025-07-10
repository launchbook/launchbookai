import express from 'express';
import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();
const app = express();
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Upload any file (PDF or EPUB)
const uploadGeneratedPDF = async (user_id, buffer, fileName) => {
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

// ✅ Validate plan (shared)
export async function validateActivePlan(userId) {
  const { data, error } = await supabase
    .from("users_plan")
    .select("is_active, plan_type, start_date, end_date")
    .eq("user_id", userId)
    .single();

  if (error || !data) return { allowed: false, reason: "Plan not found or error." };
  if (data.plan_type === "lifetime") return { allowed: true };

  const now = new Date();
  const start = data.start_date ? new Date(data.start_date) : null;
  const end = data.end_date ? new Date(data.end_date) : null;

  if (!data.is_active || !start || !end || now > end) {
    return { allowed: false, reason: "Your plan has expired. Please renew or upgrade." };
  }

  return { allowed: true };
}

// ✅ Main generation (PDF or EPUB)
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
      // Placeholder EPUB generation logic
      fileBuffer = Buffer.from(html); // Replace with real EPUB logic later
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

    const signedUrl = await uploadGeneratedPDF(user_id, fileBuffer, fileName);

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

// ✅ From URL (PDF or EPUB)
app.post('/generate-from-url', async (req, res) => {
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
      const dummyHTML = `<html><head><title>eBook</title></head><body><h1>Content from ${url}</h1><p>This is a placeholder EPUB.</p></body></html>`;
      fileBuffer = Buffer.from(dummyHTML);
      fileName = `url-generated-${Date.now()}.epub`;
    } else {
      const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle0' });
      fileBuffer = await page.pdf({ format: 'A4', printBackground: true });
      await browser.close();
      fileName = `url-generated-${Date.now()}.pdf`;
    }

    const signedUrl = await uploadGeneratedPDF(user_id, fileBuffer, fileName);

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

// ✅ PDF Regeneration
app.post('/regenerate-pdf', async (req, res) => {
  const { html, user_id } = req.body;

  if (!user_id || !html) {
    return res.status(400).json({ error: 'Missing user_id or html' });
  }

  const planCheck = await validateActivePlan(user_id);
  if (!planCheck.allowed) {
    return res.status(403).json({ error: planCheck.reason });
  }

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const fileBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    const fileName = `regenerated-${Date.now()}.pdf`;
    const signedUrl = await uploadGeneratedPDF(user_id, fileBuffer, fileName);

    return res.json({ success: true, url: signedUrl });

  } catch (err) {
    console.error('❌ Regeneration error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ✅ Cover Regeneration
app.post('/regenerate-cover-image', async (req, res) => {
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
    const filename = `cover_${Date.now()}.png`;
    const path = `ai_generated_covers/${user_id}/${filename}`;

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
    console.error('❌ Cover error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ✅ Email Sending
app.post('/send-ebook-email', async (req, res) => {
  const { email, user_id, download_url, title } = req.body;

  if (!email || !user_id || !download_url || !title) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const planCheck = await validateActivePlan(user_id);
  if (!planCheck.allowed) {
    return res.status(403).json({ error: planCheck.reason });
  }

  try {
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
        <p>Your eBook titled <b>${title}</b> is ready. Click below to download it:</p>
        <p><a href="${download_url}" target="_blank">📥 Download Now</a></p>
        <p>Thanks for using Leostarearn!</p>
      `
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Email error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ✅ Server start (Render-compatible)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Example route to handle image upload from AI
app.post('/upload-ai-cover', async (req, res) => {
  const { user_id, base64Image } = req.body;
  if (!user_id || !base64Image) return res.status(400).send({ error: 'Missing fields' });

  const buffer = Buffer.from(base64Image.replace(/^data:image\/png;base64,/, ''), 'base64');
  const filename = `ai_cover_${Date.now()}.png`;
  const filePath = `ai_generated_covers/${user_id}/${filename}`;

  const { error } = await supabase.storage
    .from('user_files')
    .upload(filePath, buffer, {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) return res.status(500).send({ error: 'Upload failed' });

  const { data: urlData } = await supabase.storage.from('user_files').getPublicUrl(filePath);
  return res.json({ url: urlData.publicUrl, path: filePath });
});
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function validateActivePlan(userId) {
  const { data, error } = await supabase
    .from("users_plan")
    .select("is_active, plan_type, start_date, end_date")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return { allowed: false, reason: "Plan not found or error." };
  }

  if (data.plan_type === "lifetime") return { allowed: true };

  const now = new Date();
  const start = data.start_date ? new Date(data.start_date) : null;
  const end = data.end_date ? new Date(data.end_date) : null;

  if (!data.is_active || !start || !end || now > end) {
    return { allowed: false, reason: "Your plan has expired. Please renew or upgrade." };
  }

  return { allowed: true };
}

