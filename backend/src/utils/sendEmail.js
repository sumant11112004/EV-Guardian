const nodemailer = require('nodemailer');

/**
 * Robust utility to send emails using nodemailer
 * Supports custom SMTP hosts/ports and falls back to standard Gmail service if needed.
 */
const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.warn('[Email System] SMTP credentials not configured in .env. Skipping email.');
    return false;
  }

  // 1. Try sending using custom SMTP settings (supports TLS fallback & custom ports)
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: parseInt(process.env.SMTP_PORT || '587') === 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false // bypass SSL verification issues in dev/production environments
      }
    });

    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'EV Guardian'}" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email System] Email sent successfully to ${to}. MessageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[Email System] Custom SMTP transport failed for ${to}:`, error.message);

    // 2. Fallback to Gmail service configuration
    try {
      console.log('[Email System] Retrying with Gmail service fallback...');
      const fallbackTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_EMAIL,
          pass: process.env.SMTP_PASSWORD
        }
      });

      const fallbackOptions = {
        from: `"${process.env.FROM_NAME || 'EV Guardian'}" <${process.env.SMTP_EMAIL}>`,
        to,
        subject,
        html
      };

      const info = await fallbackTransporter.sendMail(fallbackOptions);
      console.log(`[Email System] Fallback email sent successfully to ${to}. MessageId: ${info.messageId}`);
      return true;
    } catch (fallbackError) {
      console.error(`[Email System] Gmail service fallback failed to send email to ${to}:`, fallbackError.message);
      return false;
    }
  }
};

module.exports = sendEmail;
