import express from 'express';
import puppeteer from 'puppeteer';
import { supabase } from '../lib/supabase.js';
import { validateActivePlan } from '../lib/validatePlan.js';
import Epub from 'epub-gen';
import fs from 'fs';
import os from 'os';
import path from 'path';

const router = express.Router();

router.post('/generate-pdf', async (req, res) => {
  const {
    html, user_id, email,
    title, topic, language,
    audience, tone, purpose,
    output_format = 'pdf'
  } = req.body;

  if (!html || !user_id || !email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const plan = await validateActivePlan(user_id);
  if (!plan.allowed) return res.status(403).json({ error: plan.reason });

  try {
    let fileBuffer, fileName;

    if (output_format === 'epub') {
      const tempPath = path.join(os.tmpdir(), `generated-${Date.now()}.epub`);
      await new Epub({
        title: title || "Untitled",
        author: "Leostarearn AI",
        content: [{
          title: topic || "AI Generated Content",
          data: html,
        }],
      }, tempPath).promise();

      fileBuffer = fs.readFileSync(tempPath);
      fileName = `generated-${Date.now()}.epub`;

    } else {
      const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      fileBuffer = await page.pdf({ format: 'A4', printBackground: true });
      await browser.close();
      fileName = `generated-${Date.now()}.pdf`;
    }

    // Upload + DB logic here (reuse from your current logic)
    // return res.json({ success: true, url: signedUrl });

  } catch (err) {
    console.error("❌ Generation error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
