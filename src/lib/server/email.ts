import nodemailer from 'nodemailer';

export async function sendLeadNotification(lead: {
  source: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  data?: string | null;
}) {
  if (!process.env.SMTP_HOST) {
    console.log('[EMAIL] Lead notification (SMTP not configured):', lead);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const lines = [
    `Source: ${lead.source}`,
    lead.name ? `Name: ${lead.name}` : null,
    lead.email ? `Email: ${lead.email}` : null,
    lead.phone ? `Phone: ${lead.phone}` : null,
    lead.data ? `Data: ${lead.data}` : null,
  ].filter(Boolean).join('\n');

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? 'noreply@develta.cy',
    to: process.env.ADMIN_EMAIL ?? 'admin@develta.cy',
    subject: `New Lead: ${lead.source}`,
    text: lines,
  });
}
