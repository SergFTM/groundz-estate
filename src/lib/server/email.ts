import nodemailer from 'nodemailer';

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function send(opts: { to: string; subject: string; text: string; html?: string }) {
  if (!process.env.SMTP_HOST) {
    console.log('[EMAIL] (SMTP not configured):', opts.subject);
    return;
  }
  try {
    await createTransport().sendMail({
      from: process.env.SMTP_FROM ?? 'noreply@groundz.estate',
      ...opts,
    });
  } catch (err) {
    console.error('[EMAIL] Failed to send:', opts.subject, err);
  }
}

export async function sendLeadNotification(lead: {
  source: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  data?: string | null;
}) {
  const lines = [
    `Source: ${lead.source}`,
    lead.name  ? `Name: ${lead.name}`   : null,
    lead.email ? `Email: ${lead.email}` : null,
    lead.phone ? `Phone: ${lead.phone}` : null,
    lead.data  ? `Data: ${lead.data}`   : null,
  ].filter(Boolean).join('\n');

  await send({
    to: process.env.ADMIN_EMAIL ?? 'admin@groundz.estate',
    subject: `New Lead: ${lead.source}`,
    text: lines,
  });
}

export async function sendInvestorApplicationNotification(app: {
  name: string;
  email: string;
  phone: string;
  nationality: string;
  investorType: string;
  ticketSize: string;
  dealTypeInterest: string;
  timeHorizon: string;
  message?: string | null;
}) {
  const text = [
    `New investor application received on Groundz.`,
    ``,
    `Name:         ${app.name}`,
    `Email:        ${app.email}`,
    `Phone:        ${app.phone}`,
    `Nationality:  ${app.nationality}`,
    `Investor Type: ${app.investorType.replace('_', ' ')}`,
    `Ticket Size:  ${app.ticketSize.replace(/_/g, ' ')}`,
    `Deal Types:   ${app.dealTypeInterest}`,
    `Time Horizon: ${app.timeHorizon}`,
    app.message ? `\nMessage:\n${app.message}` : '',
    ``,
    `Review at: ${process.env.SITE_URL ?? 'https://groundz.estate'}/admin/leads`,
  ].join('\n');

  // Notification to admin
  await send({
    to: process.env.ADMIN_EMAIL ?? 'admin@groundz.estate',
    subject: `Investor Application: ${app.name} (${app.ticketSize.replace(/_/g, ' ')})`,
    text,
  });

  // Confirmation to applicant
  await send({
    to: app.email,
    subject: `Your Groundz investor application has been received`,
    text: [
      `Dear ${app.name},`,
      ``,
      `Thank you for submitting your investor application to Groundz.`,
      ``,
      `Our investment team will review your profile and reach out within 1 business day`,
      `to discuss current pool opportunities and next steps.`,
      ``,
      `In the meantime, you can browse available pools at:`,
      `${process.env.SITE_URL ?? 'https://groundz.estate'}/pools`,
      ``,
      `Best regards,`,
      `Groundz Investment Team`,
    ].join('\n'),
  });
}

export async function sendPasswordResetEmail(opts: {
  email: string;
  resetUrl: string;
}) {
  await send({
    to: opts.email,
    subject: `Reset your Groundz password`,
    text: [
      `You requested a password reset for your Groundz account.`,
      ``,
      `Click the link below to set a new password (valid for 1 hour):`,
      opts.resetUrl,
      ``,
      `If you did not request this, you can ignore this email — your password will not change.`,
      ``,
      `Best regards,`,
      `Groundz Security Team`,
    ].join('\n'),
  });
}

export async function sendKycStatusEmail(investor: {
  email: string;
  name: string | null;
  status: 'approved' | 'action_required';
  documentName: string;
}) {
  const isApproved = investor.status === 'approved';
  await send({
    to: investor.email,
    subject: isApproved
      ? `KYC document approved — ${investor.documentName}`
      : `Action required: KYC document — ${investor.documentName}`,
    text: [
      `Dear ${investor.name ?? 'Investor'},`,
      ``,
      isApproved
        ? `Your document "${investor.documentName}" has been reviewed and approved.`
        : `Your document "${investor.documentName}" requires attention. Please log in to your investor portal to review and resubmit.`,
      ``,
      `Login at: ${process.env.SITE_URL ?? 'https://groundz.estate'}/auth/login`,
      ``,
      `Best regards,`,
      `Groundz Compliance Team`,
    ].join('\n'),
  });
}
