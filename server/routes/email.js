const express = require('express');
const nodemailer = require('nodemailer');
const { validateActivePlan } = require('../lib/plan');
const { supabase } = require('../lib/supabase');

const router = express.Router();

// ✅ Reusable credit + log helper
const logAndDeductCredits = async (user_id, action, credits) => {
  await supabase.from('user_usage_logs').insert([
    {
      user_id,
      action,
      credits_used: credits,
      created_at: new Date().toISOString()
    }
  ]);

  const { error: deductError } = await supabase.rpc('increment_credits_used', {
    p_user_id: user_id,
    p_increment: credits
  });

  if (deductError) throw new Error('Credit deduction failed');
};

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

    // ✅ Log + deduct 30 credits
    await logAndDeductCredits(user_id, 'send-ebook-email', 30);

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Email send error:", err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
