// server.js
import express from 'express';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// ✅ Test endpoint
app.get('/', (req, res) => {
  res.send('Leostarearn API is running!');
});

// ✅ Send eBook Email route
app.post('/api/send-ebook-email', async (req, res) => {
  const { user_id, email } = req.body;

  if (!user_id || !email) {
    return res.status(400).json({ error: 'Missing user_id or email' });
  }

  const pdfUrl = `https://<your-supabase-id>.supabase.co/storage/v1/object/public/generated-pdfs/${user_id}-latest.pdf`;

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.zoho.in", // or smtp.gmail.com
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
      subject: "📘 Your eBook is Ready",
      html: `
        <p>Hello,</p>
        <p>Your custom eBook is ready. Click below to download:</p>
        <p><a href="${pdfUrl}" target="_blank">📥 Download Your eBook</a></p>
      `
    });

    return res.status(200).json({ success: true });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
