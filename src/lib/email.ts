import nodemailer from 'nodemailer';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.error('[email] Faltam variáveis de ambiente SMTP_HOST, SMTP_PORT, SMTP_USER ou SMTP_PASS');
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10),
    secure: parseInt(SMTP_PORT, 10) === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"BolãoGB" <${SMTP_USER}>`,
      to,
      subject,
      html,
    });
    
    console.log(`[email] Mensagem enviada para ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('[email] Erro ao enviar e-mail:', error);
    return false;
  }
}
