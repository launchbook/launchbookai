const express = require('express');
const nodemailer = require('nodemailer');
const { validateActivePlan } = require('../lib/plan');
const { supabase } = require('../lib/supabase');
const { getEmailTemplate } = require('../lib/emailTemplates');
const { CREDIT_COSTS } = require('../lib/credits');

const router = express.Router();

// ✅ Reusable credit + log helper
const logAndDeductCredits = async (user_id, action, credits, details = {}) => {
  await supabase.from('user_usage_logs').insert([
    {
      user_id,
      action,
      credits_used: credits,
      details,
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
  const { email, user_id, download_url, title, language = 'English' } = req.body;

  if (!email || !user_id || !download_url || !title) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const planCheck = await validateActivePlan(user_id);
  if (!planCheck.allowed) {
    return res.status(403).json({ error: planCheck.reason });
  }

  try {
    const template = getEmailTemplate(language);

    // ✅ Fetch file size from Supabase
    const filePath = decodeURIComponent(new URL(download_url).pathname.split('/storage/v1/object/public/user_files/')[1]);
    const { data: fileMetadata, error: metadataError } = await supabase
      .storage
      .from('user_files')
      .list(filePath.split('/').slice(0, -1).join('/'), { search: filePath.split('/').pop() });

    let fileSizeInfo = '';
    if (!metadataError && fileMetadata?.length) {
      const sizeInMB = (fileMetadata[0].metadata?.size || 0) / (1024 * 1024);
      fileSizeInfo = ` (~${sizeInMB.toFixed(1)} MB)`;
    }

    const openTrackerPixel = `<img src="${process.env.BASE_URL || 'https://launchbook.in'}/track-open?user_id=${user_id}&email=${encodeURIComponent(email)}&language=${encodeURIComponent(language)}" width="1" height="1" style="display:none;" />`;

    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.in',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // ✅ Retry logic (3 tries max)
    let success = false;
    let lastError = null;

    for (let i = 0; i < 3; i++) {
      try {
        await transporter.sendMail({
          from: `"LaunchBook AI" <${process.env.EMAIL_USER}>`,
          to: email,
          bcc: 'founder@yourdomain.com',
          subject: template.subject,
          html: template.html(title + fileSizeInfo, download_url) + openTrackerPixel
        });
        success = true;
        break;
      } catch (err) {
        lastError = err;
        console.warn(`Retry ${i + 1} failed:`, err.message);
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    if (!success) throw lastError;

    // ✅ Log + deduct credits using global constant
    await logAndDeductCredits(user_id, 'send-ebook-email', CREDIT_COSTS.send_email, {
      email,
      status: 'success',
      title,
      language
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Email send error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ✅ Open Tracker Logging Route
router.get('/track-open', async (req, res) => {
  const { user_id, email, language = 'English' } = req.query;

  if (!user_id || !email) return res.status(400).end();

  try {
    await supabase.from('email_open_logs').insert([
      {
        user_id,
        email,
        opened_at: new Date().toISOString(),
        language
      }
    ]);
  } catch (e) {
    console.warn('📭 Failed to log open event:', e.message);
  }

  const imgBuffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64');
  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': imgBuffer.length
  });
  return res.end(imgBuffer);
});

module.exports = router;
