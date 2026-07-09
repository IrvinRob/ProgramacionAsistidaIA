import { Resend } from 'resend';
import { FROM_EMAIL, RESEND_API_KEY } from '$env/static/private';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export async function sendEmail({ to, subject, html, attachments = [] }) {
	if (!resend || !FROM_EMAIL) {
		return { ok: false, error: 'Resend no esta configurado' };
	}

	try {
		const { data, error } = await resend.emails.send({
			from: FROM_EMAIL,
			to: [to],
			subject,
			html,
			attachments
		});

		if (error) {
			return { ok: false, error: error.message ?? String(error) };
		}

		return { ok: true, id: data?.id };
	} catch (error) {
		return { ok: false, error: error.message };
	}
}
