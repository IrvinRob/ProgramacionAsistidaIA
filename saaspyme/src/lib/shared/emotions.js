export const EMOTION_KEYS = ['Angry', 'Disgust', 'Fear', 'Happy', 'Neutral', 'Sad', 'Surprise'];

export const EMOTION_LABELS = {
	Angry: 'Enojo',
	Disgust: 'Disgusto',
	Fear: 'Incertidumbre',
	Happy: 'Positivo',
	Neutral: 'Neutral',
	Sad: 'Frustración',
	Surprise: 'Sorpresa'
};

export const INTERPRETATION_LABELS = {
	duda: 'Posible duda',
	enojo: 'Enojo',
	frustracion: 'Frustración',
	positivo: 'Positivo',
	desatencion: 'Atención baja',
	neutral: 'Neutral'
};

/**
 * @param {Record<string, number> | null | undefined} scores
 * @param {number | null | undefined} attention
 */
export function interpretEmotion(scores, attention) {
	const surprise = Number(scores?.Surprise ?? 0);
	const fear = Number(scores?.Fear ?? 0);
	const sad = Number(scores?.Sad ?? 0);
	const happy = Number(scores?.Happy ?? 0);
	const disgust = Number(scores?.Disgust ?? 0);
	const angry = Number(scores?.Angry ?? 0);

	// Enojo: priorizar Angry cuando es la señal dominante
	if (angry >= 0.22 && angry >= Math.max(sad, disgust, fear, surprise)) return 'enojo';
	if (angry >= 0.3) return 'enojo';

	if (disgust >= 0.25 || sad >= 0.28) return 'frustracion';
	if (surprise >= 0.3 || fear >= 0.25) return 'duda';
	if (happy >= 0.32) return 'positivo';
	if (typeof attention === 'number' && attention < 0.35) return 'desatencion';
	return 'neutral';
}

/**
 * @param {Record<string, number> | null | undefined} scores
 */
export function dominantEmotionFromScores(scores) {
	if (!scores || typeof scores !== 'object') return null;

	let bestKey = null;
	let bestValue = -1;

	for (const key of EMOTION_KEYS) {
		const value = Number(scores[key] ?? 0);
		if (value > bestValue) {
			bestKey = key;
			bestValue = value;
		}
	}

	return bestKey;
}

/**
 * @param {Array<{ interpretation: string }>} samples
 * @returns {'enojo' | 'frustracion' | 'duda' | 'positivo' | null}
 */
export function detectProactiveReaction(samples, minCount = 4) {
	if (!samples.length) return null;

	const counts = samples.reduce((acc, sample) => {
		const key = sample.interpretation;
		acc[key] = (acc[key] ?? 0) + 1;
		return acc;
	}, {});

	if ((counts.enojo ?? 0) >= minCount) return 'enojo';
	if ((counts.frustracion ?? 0) >= minCount) return 'frustracion';
	if ((counts.duda ?? 0) >= minCount) return 'duda';
	if ((counts.positivo ?? 0) >= minCount) return 'positivo';
	return null;
}
