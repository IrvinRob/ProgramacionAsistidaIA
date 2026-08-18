import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireUsuario } from '$lib/server/auth.js';
import { buildAppContext } from '$lib/server/assistant/app-context.js';
import { createAssistantMessage } from '$lib/server/assistant/anthropic.js';
import { buildEmotionPrompt, buildSystemPrompt } from '$lib/server/assistant/system-prompt.js';
import { EMOTION_LABELS, INTERPRETATION_LABELS } from '$lib/shared/emotions.js';

const messageSchema = z.object({
	role: z.enum(['user', 'assistant']),
	content: z.string().trim().min(1).max(4000)
});

const emotionContextSchema = z
	.object({
		trigger: z
			.enum([
				'saludo_inicial',
				'consulta',
				'post_response_doubt',
				'post_response_angry',
				'post_response_negative',
				'post_response_positive',
				'oferta_ayuda'
			])
			.optional(),
		dominantEmotion: z.string().trim().max(40).nullable().optional(),
		interpretation: z.string().trim().max(40).nullable().optional(),
		attention: z.number().min(0).max(1).nullable().optional(),
		scores: z.record(z.string(), z.number()).optional()
	})
	.optional();

const requestSchema = z.object({
	messages: z.array(messageSchema).max(20).default([]),
	pagePath: z.string().trim().max(200).optional(),
	emotionContext: emotionContextSchema
});

const POST_RESPONSE_TRIGGERS = new Set([
	'post_response_doubt',
	'post_response_angry',
	'post_response_negative',
	'post_response_positive',
	'oferta_ayuda'
]);

function hiddenUserPrompt(trigger) {
	if (trigger === 'saludo_inicial') {
		return 'El usuario acaba de abrir el asistente y todavia no ha preguntado nada. Saluda en una frase y pregunta en que le puedes echar la mano. No des tutoriales ni asumas que ya explicaste algo.';
	}
	if (trigger === 'post_response_doubt') {
		return 'El usuario ya hizo una pregunta y ahora parece inseguro con ESE tema. Continua la conversacion: aclara un punto concreto del ultimo mensaje del usuario y pregunta si quiere el siguiente paso. Sin emojis. Maximo 3 frases.';
	}
	if (trigger === 'post_response_angry') {
		return 'El usuario ya hizo una pregunta y ahora parece enojado con ESE tema. Baja la tension con calidez: un chiste corto de oficina o PyME (nada ofensivo), o invitalo a respirar hondo 2-3 veces antes de seguir. Luego retoma el mismo tema en un paso muy pequeno. Sin emojis. Maximo 4 frases. No digas "calmate" ni que notaste enojo.';
	}
	if (trigger === 'post_response_negative') {
		return 'El usuario ya hizo una pregunta y ahora parece frustrado con ESE tema. No digas que "lo que le compartiste no le sirvio". Reformula el mismo asunto de otra manera y pregunta que parte quiere ver primero. Sin emojis. Maximo 3 frases.';
	}
	if (trigger === 'post_response_positive') {
		return 'El usuario ya hizo una pregunta y reacciona bien. Sigue el hilo: una frase de "va, seguimos" y propone el siguiente paso de ESE tema. Sin emojis. Maximo 2 frases.';
	}
	if (trigger === 'oferta_ayuda') {
		return 'Haz una pregunta corta para continuar el ultimo tema del usuario. Sin emojis.';
	}
	return null;
}

function hasUserQuestion(messages) {
	return messages.some((item) => item.role === 'user');
}

/** Prefijo visible solo para pruebas: estado emocional usado al generar la respuesta. */
function debugStateLabel(emotionContext) {
	if (!emotionContext) return 'consulta';

	if (emotionContext.interpretation && INTERPRETATION_LABELS[emotionContext.interpretation]) {
		return INTERPRETATION_LABELS[emotionContext.interpretation].toLowerCase();
	}

	if (emotionContext.dominantEmotion && EMOTION_LABELS[emotionContext.dominantEmotion]) {
		return EMOTION_LABELS[emotionContext.dominantEmotion].toLowerCase();
	}

	const trigger = emotionContext.trigger ?? 'consulta';
	if (trigger === 'saludo_inicial') return 'saludo inicial';
	if (trigger === 'post_response_doubt') return 'duda';
	if (trigger === 'post_response_angry') return 'enojo';
	if (trigger === 'post_response_negative') return 'frustración';
	if (trigger === 'post_response_positive') return 'positivo';
	if (trigger === 'oferta_ayuda') return 'oferta de ayuda';
	return 'consulta';
}

function prependDebugState(reply, emotionContext) {
	const label = debugStateLabel(emotionContext);
	return `- ${label} - ${reply.trimStart()}`;
}

export async function POST(event) {
	const usuario = requireUsuario(event.locals);

	let body;
	try {
		body = await event.request.json();
	} catch {
		return json({ ok: false, error: 'Cuerpo de solicitud invalido' }, { status: 400 });
	}

	const parsed = requestSchema.safeParse(body);
	if (!parsed.success) {
		return json({ ok: false, error: 'Datos de conversacion invalidos' }, { status: 400 });
	}

	const { messages, pagePath, emotionContext } = parsed.data;
	const trigger = emotionContext?.trigger ?? 'consulta';

	if (POST_RESPONSE_TRIGGERS.has(trigger) && !hasUserQuestion(messages)) {
		return json({ ok: true, reply: null, skipped: true });
	}
	const promptOculto = hiddenUserPrompt(trigger);
	const conversation = [...messages];

	if (promptOculto && (conversation.length === 0 || trigger !== 'consulta')) {
		const last = conversation.at(-1);
		if (!last || last.role !== 'user' || last.content !== promptOculto) {
			conversation.push({ role: 'user', content: promptOculto });
		}
	}

	if (!conversation.length) {
		return json({ ok: false, error: 'Datos de conversacion invalidos' }, { status: 400 });
	}

	try {
		const appContext = await buildAppContext({
			usuario: { nombre: usuario.nombre, rol: usuario.rol },
			pagePath: pagePath ?? '/'
		});

		const system = buildSystemPrompt(appContext, buildEmotionPrompt(emotionContext));
		const rawReply = await createAssistantMessage({ system, messages: conversation });

		return json({ ok: true, reply: prependDebugState(rawReply, emotionContext) });
	} catch (cause) {
		const message = cause instanceof Error ? cause.message : 'Error desconocido';

		if (message.includes('ANTHROPIC_API_KEY')) {
			return json(
				{ ok: false, error: 'El asistente no esta configurado. Contacta al administrador.' },
				{ status: 503 }
			);
		}

		console.error('[api/assistant] Error al procesar mensaje', cause);
		return json(
			{ ok: false, error: 'No se pudo obtener respuesta del asistente' },
			{ status: 500 }
		);
	}
}
