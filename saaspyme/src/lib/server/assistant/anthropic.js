import { env } from '$env/dynamic/private';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-6';

/**
 * @param {{ system: string, messages: Array<{ role: 'user' | 'assistant', content: string }>, model?: string }} params
 */
export async function createAssistantMessage({ system, messages, model = DEFAULT_MODEL }) {
	const apiKey = env.ANTHROPIC_API_KEY;

	if (!apiKey) {
		throw new Error('Falta ANTHROPIC_API_KEY en las variables de entorno');
	}

	const response = await fetch(ANTHROPIC_API_URL, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			'x-api-key': apiKey,
			'anthropic-version': '2023-06-01'
		},
		body: JSON.stringify({
			model,
			max_tokens: 1024,
			system,
			messages
		})
	});

	if (!response.ok) {
		const errorBody = await response.text();
		console.error('[assistant] Error de Anthropic', { status: response.status, errorBody });
		throw new Error('El servicio de asistente no está disponible');
	}

	const data = await response.json();
	const textBlock = data.content?.find((block) => block.type === 'text');

	return textBlock?.text?.trim() ?? '';
}
