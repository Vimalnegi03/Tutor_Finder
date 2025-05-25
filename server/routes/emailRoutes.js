import express from 'express';
import sendEmail from '../services/emailService.js';

const router = express.Router();

router.post('/send', async (req, res) => {
  const { name, email, subject, message } = req.body;
 
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const emailMessage = `
      <h3>New Contact Query</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `;

    await sendEmail(process.env.SMTP_FROM_EMAIL, subject || 'New Query', emailMessage);

    res.status(200).json({ success: 'Email sent successfully!' });
  } catch (error) {
    console.error('Error in sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

export default router;
