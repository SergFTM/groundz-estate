export async function notifyManager(lead: {
	source: string;
	name?: string | null;
	email?: string | null;
	phone?: string | null;
}) {
	// TODO: Configure nodemailer with SMTP credentials from .env
	// When ready, uncomment and configure:
	//
	// import nodemailer from 'nodemailer';
	// const transporter = nodemailer.createTransport({
	//   host: SMTP_HOST, port: SMTP_PORT, auth: { user: SMTP_USER, pass: SMTP_PASS }
	// });
	// await transporter.sendMail({
	//   from: '"Develta Platform" <noreply@develta.cy>',
	//   to: MANAGER_EMAIL,
	//   subject: `New Lead: ${lead.source}`,
	//   text: `Name: ${lead.name}\nEmail: ${lead.email}\nPhone: ${lead.phone}`
	// });

	console.log(`[EMAIL STUB] New lead from ${lead.source}: ${lead.name || lead.email || lead.phone}`);
}
