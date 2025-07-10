const express = require('express');
const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
const { supabase, uploadGeneratedFile } = require('../lib/supabase');
const { validateActivePlan } = require('../lib/plan');
const { generateEpubBuffer } = require('../lib/epub');
const { estimateCreditCost, estimateURLConversionCost } = require('../lib/credits');


const router = express.Router();

// ✅ Reusable credit + log helper
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

// ✅ POST /generate-pdf or EPUB
router.post('/generate-pdf', async (req, res) => {
  const {
    html,
    user_id,
    email,

    title,
    topic,
    description,
    author_name,

    audience,
    tone,
    purpose,
    language,

    with_images,
    imageCount,
    include_affiliate_links,
    cover_image,
    cover_title,

    total_pages,
    font_size,
    headline_size,
    subheadline_size,
    line_spacing,
    paragraph_spacing,

    margin_top,
    margin_bottom,
    margin_left,
    margin_right,

    text_alignment,
    font_type,
    page_size,

    save_formatting_preset,
    output_format = 'pdf',
    cover_url = null
  } = req.body;

  if (!html || !user_id || !email) {
    return res.status(400).json({ error: 'Missing html, user_id, or email' });
  }

  const planCheck = await validateActivePlan(user_id);
  if (!planCheck.allowed) {
    return res.status(403).json({ success: false, error: planCheck.reason });
  }

  // ✅ Calculate dynamic credit estimate
  const parsedImageCount = parseInt(imageCount || 0, 10);
  const parsedTotalPages = parseInt(total_pages || 20, 10);
  const hasCover = cover_image === true || cover_image === 'true';

  const estimatedWordCount = parsedTotalPages * 300;

  const estimated_credits = estimateCreditCost({
    wordCount: estimatedWordCount,
    imageCount: parsedImageCount,
    withCover: hasCover,
    isRegeneration: false
  });

  console.log('🔢 Credits Estimated:', estimated_credits);

  try {
    const safeTitle = (title || 'Untitled').trim();
    let fileBuffer, fileName;

    if (output_format === 'epub') {
      fileBuffer = await generateEpubBuffer({ html, title: safeTitle, author: user_id });
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

    await supabase.from('generated_files').insert([{
      user_id,
      title: safeTitle,
      topic,
      language,
      audience,
      tone,
      purpose,
      format: output_format,
      download_url: signedUrl,
      image_count: parsedImageCount,
      cover_url,
      file_size: fileBuffer.length,
      created_at: new Date().toISOString()
    }]);

    await logAndDeductCredits(user_id, 'generate-pdf', estimated_credits);

    // ✅ Send email notification
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
      from: `"LaunchBook AI" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your eBook "${safeTitle}" is ready!`,
      html: `<p>Hello,</p>
             <p>Your eBook titled <strong>${safeTitle}</strong> has been generated successfully.</p>
             <p><a href="${signedUrl}" target="_blank">Click here to download</a></p>
             <p>Thanks,<br/>LaunchBook AI Team</p>`
    });

    return res.json({ success: true, url: signedUrl });

  } catch (err) {
    console.error('❌ Generation error:', err);
    return res.status(500).json({ error: err.message });
  }
});


// ✅ POST /generate-from-url
router.post('/generate-from-url', async (req, res) => {
  const {
    url,
    user_id,
    email,
    output_format = 'pdf',
  } = req.body;

  if (!url || !user_id || !email) {
    return res.status(400).json({ error: 'Missing url, user_id or email' });
  }

  const planCheck = await validateActivePlan(user_id);
  if (!planCheck.allowed) {
    return res.status(403).json({ error: planCheck.reason });
  }

  try {
    const fallbackTitle = 'Generated from URL';

    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });

    // ✅ Extract clean text and image count from loaded page
   const { extractedText, imageCount } = await page.evaluate(() => {
  const text = document.body.innerText || '';
  const images = Array.from(document.images || []);
  return {
    extractedText: text,
    imageCount: images.length
  };
});

 const estimatedWordCount = extractedText.trim().split(/\s+/).length;

 const estimated_credits = estimateURLConversionCost({
  wordCount: estimatedWordCount,
  imageCount
});


    let fileBuffer, fileName;

    if (output_format === 'epub') {
      const dummyHTML = `<h1>Content from ${url}</h1><p>This is a placeholder EPUB.</p>`;
      fileBuffer = await generateEpubBuffer({ html: dummyHTML, title: fallbackTitle, author: user_id });
      fileName = `url-generated-${Date.now()}.epub`;
    } else {
      fileBuffer = await page.pdf({ format: 'A4', printBackground: true });
      fileName = `url-generated-${Date.now()}.pdf`;
    }

    await browser.close();

    const signedUrl = await uploadGeneratedFile(user_id, fileBuffer, fileName);

    await supabase.from('generated_files').insert([{
      user_id,
      title: fallbackTitle,
      topic: url,
      language: null,
      audience: null,
      tone: null,
      purpose: null,
      format: output_format,
      download_url: signedUrl,
      image_count: 0,
      cover_url: null,
      file_size: fileBuffer.length,
      created_at: new Date().toISOString()
    }]);

    await logAndDeductCredits(user_id, 'generate-from-url', estimated_credits);

    // ✅ Send email notification
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
      from: `"LaunchBook AI" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your eBook "${fallbackTitle}" is ready!`,
      html: `<p>Hello,</p>
             <p>Your eBook titled <strong>${fallbackTitle}</strong> has been generated successfully from the URL you provided.</p>
             <p><a href="${signedUrl}" target="_blank">Click here to download</a></p>
             <p>Thanks,<br/>LaunchBook AI Team</p>`
    });

    return res.json({ success: true, url: signedUrl });

  } catch (err) {
    console.error('❌ URL Generation error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
