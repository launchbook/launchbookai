const express = require('express');
const nodemailer = require('nodemailer');
const { validateActivePlan } = require('../lib/plan');
const { supabase } = require('../lib/supabase');

const router = express.Router();

// ✅ Email Templates per Language
function generateEmailHTML(title, download_url, lang = 'en') {
  switch (lang) {
    case 'hi':
      return `
        <p>नमस्ते,</p>
        <p>आपकी ईबुक <b>${title}</b> तैयार है। नीचे दिए गए बटन पर क्लिक करें:</p>
        <p><a href="${download_url}" target="_blank">📥 अभी डाउनलोड करें</a></p>
        <p>LaunchBook AI उपयोग करने के लिए धन्यवाद!</p>
      `;
    default:
      return `
        <p>Hello,</p>
        <p>Your eBook titled <b>${title}</b> is ready. Click below to download:</p>
        <p><a href="${download_url}" target="_blank">📥 Download Now</a></p>
        <p>Thank you for using LaunchBook AI!</p>
      `;
  }
}

// ✅ Helper: Send email with retry
async function sendEmailWithRetry(options, retries = 2) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.in',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await transporter.sendMail(options);
      return { success: true };
    } catch (err) {
      console.warn(`Retry attempt ${attempt} failed:`, err.message);
      if (attempt === retries) {
        throw err; // final fail
      }
    }
  }
}

// ✅ POST /send-ebook-email
router.post('/send-ebook-email', async (req, res) => {
  const { email, user_id, download_url, title, language = 'en' } = req.body;

  if (!email || !user_id || !download_url || !title) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const planCheck = await validateActivePlan(user_id);
  if (!planCheck.allowed) {
    return res.status(403).json({ error: planCheck.reason });
  }

  try {
    const mailOptions = {
      from: `"LaunchBook AI" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: language === 'hi' ? '📘 आपकी ईबुक तैयार है!' : '📘 Your eBook is Ready!',
      html: generateEmailHTML(title, download_url, language)
    };

    await sendEmailWithRetry(mailOptions);

    // ✅ Log credit usage (30 credits)
    await supabase.from('user_usage_logs').insert([
      {
        user_id,
        action: 'send-ebook-email',
        credits_used: 30,
        created_at: new Date().toISOString()
      }
    ]);

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Email send failed after retries:", err);
    return res.status(500).json({ error: 'Email delivery failed. Please try again.' });
  }
});

module.exports = router;
