const express = require('express');
const nodemailer = require('nodemailer');
const { validateActivePlan } = require('../lib/plan');

const router = express.Router();

// ✅ POST /send-ebook-email
router.post('/send-ebook-email', async (req, res) => {
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
      from: `"LaunchBook AI" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '📘 Your eBook is Ready!',
      html: `
        <p>Hello,</p>
        <p>Your eBook titled <b>${title}</b> is ready. Click the button below to download:</p>
        <p><a href="${download_url}" target="_blank">📥 Download Now</a></p>
        <p>Thank you for using LaunchBook AI!</p>
      `
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Email send error:", err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
