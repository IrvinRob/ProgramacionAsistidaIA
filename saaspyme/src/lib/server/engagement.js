import { prisma } from '$lib/server/prisma.js';

export async function getOwnedSession(sesionId, usuarioId) {
	if (!sesionId) return null;

	return prisma.sesionEngagement.findFirst({
		where: { id: sesionId, usuarioId }
	});
}

export async function createEngagementSession({ usuarioId, rutaInicio, camaraActiva = true }) {
	return prisma.sesionEngagement.create({
		data: {
			usuarioId,
			rutaInicio: rutaInicio || '/',
			camaraActiva
		}
	});
}

export async function closeEngagementSession(sesionId, usuarioId) {
	const session = await getOwnedSession(sesionId, usuarioId);
	if (!session) return null;

	return prisma.sesionEngagement.update({
		where: { id: session.id },
		data: { finEn: new Date() }
	});
}

export async function saveEmotionReading({
	sesionId,
	usuarioId,
	emocionDominante,
	emociones,
	atencion,
	ruta,
	motivo
}) {
	const session = await getOwnedSession(sesionId, usuarioId);
	if (!session) return null;

	return prisma.lecturaEmocion.create({
		data: {
			sesionId: session.id,
			emocionDominante: emocionDominante || null,
			emociones: emociones ?? {},
			atencion: typeof atencion === 'number' ? atencion : null,
			ruta: ruta || '/',
			motivo
		}
	});
}

export async function saveAssistantIntervention({
	sesionId,
	usuarioId,
	tipo,
	emocionDisparadora,
	respuestaClaude
}) {
	const session = await getOwnedSession(sesionId, usuarioId);
	if (!session) return null;

	return prisma.intervencionAsistente.create({
		data: {
			sesionId: session.id,
			tipo,
			emocionDisparadora: emocionDisparadora || null,
			respuestaClaude
		}
	});
}
