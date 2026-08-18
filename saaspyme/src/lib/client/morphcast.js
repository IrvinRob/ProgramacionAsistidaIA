import { browser } from '$app/environment';
import { dominantEmotionFromScores, interpretEmotion } from '$lib/shared/emotions.js';

const SDK_URL = 'https://ai-sdk.morphcast.com/v1.16/ai-sdk.js';

function moduleRef(CY, name) {
	const modules = typeof CY.modules === 'function' ? CY.modules() : CY.modules;
	return modules?.[name] ?? null;
}

export async function loadMorphCastSdk() {
	if (!browser) return null;
	if (window.CY) return window.CY;

	await new Promise((resolve, reject) => {
		const existing = document.querySelector(`script[src="${SDK_URL}"]`);
		if (existing && window.CY) {
			resolve();
			return;
		}

		const script = existing ?? document.createElement('script');
		script.src = SDK_URL;
		script.async = true;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error('No se pudo cargar el SDK de MorphCast'));
		if (!existing) document.head.appendChild(script);
	});

	if (!window.CY) {
		throw new Error('MorphCast no inicializo CY en el navegador');
	}

	return window.CY;
}

export async function attachCameraPreview(videoEl) {
	if (!navigator.mediaDevices?.getUserMedia) {
		throw new Error('Este navegador no permite acceso a la camara');
	}

	const stream = await navigator.mediaDevices.getUserMedia({
		video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
		audio: false
	});

	videoEl.srcObject = stream;
	videoEl.muted = true;
	videoEl.playsInline = true;
	await videoEl.play();

	return () => {
		stream.getTracks().forEach((track) => track.stop());
		videoEl.srcObject = null;
	};
}

function readEmotionPayload(detail) {
	const output = detail?.output ?? detail ?? {};
	const scores = output.emotion ?? output.emotions ?? {};
	const dominant = output.dominantEmotion ?? dominantEmotionFromScores(scores);
	return { scores, dominant };
}

function readAttention(detail) {
	const output = detail?.output ?? detail ?? {};
	const value = output.attention ?? output.Attention;
	return typeof value === 'number' ? value : null;
}

function createCameraSource(CY, videoEl) {
	if (CY.createSource?.fromCamera) {
		return CY.createSource.fromCamera({
			constraints: {
				audio: false,
				video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
			},
			video: videoEl,
			flip: 0
		});
	}

	if (CY.createSource?.fromVideoElement && videoEl) {
		return CY.createSource.fromVideoElement(videoEl);
	}

	return null;
}

/**
 * Inicia MorphCast usando el <video> de vista previa.
 * @param {{ licenseKey: string, videoEl: HTMLVideoElement, onSample: (sample: object) => void }} params
 */
export async function startEmotionTracking({ licenseKey, videoEl, onSample }) {
	if (!licenseKey) {
		throw new Error('Falta PUBLIC_MORPHCAST_LICENSE_KEY');
	}

	const CY = await loadMorphCastSdk();
	const emotionModule = moduleRef(CY, 'FACE_EMOTION');
	const attentionModule = moduleRef(CY, 'FACE_ATTENTION');

	if (!emotionModule?.name) {
		throw new Error('El SDK de MorphCast no expone FACE_EMOTION');
	}

	let lastAttention = null;
	let stopPreview = null;

	const handleEmotion = (event) => {
		const { scores, dominant } = readEmotionPayload(event.detail);
		onSample({
			emocionDominante: dominant,
			emociones: scores,
			atencion: lastAttention,
			interpretation: interpretEmotion(scores, lastAttention)
		});
	};

	const handleAttention = (event) => {
		lastAttention = readAttention(event.detail);
	};

	if (emotionModule.eventName) {
		window.addEventListener(emotionModule.eventName, handleEmotion);
	}
	if (attentionModule?.eventName) {
		window.addEventListener(attentionModule.eventName, handleAttention);
	}

	const cameraSource = createCameraSource(CY, videoEl);
	if (!cameraSource) {
		stopPreview = await attachCameraPreview(videoEl);
	}

	let loader = CY.loader().licenseKey(licenseKey);
	if (cameraSource) {
		loader = loader.source(cameraSource);
	} else if (CY.createSource?.fromVideoElement) {
		loader = loader.source(CY.createSource.fromVideoElement(videoEl));
	}

	loader = loader.addModule(emotionModule.name, { smoothness: 0.4 });
	if (attentionModule?.name) {
		loader = loader.addModule(attentionModule.name);
	}

	const instance = await loader.load();
	instance.start();

	return () => {
		if (emotionModule.eventName) {
			window.removeEventListener(emotionModule.eventName, handleEmotion);
		}
		if (attentionModule?.eventName) {
			window.removeEventListener(attentionModule.eventName, handleAttention);
		}
		try {
			instance.stop();
		} catch (cause) {
			console.warn('[morphcast] No se pudo detener el SDK', cause);
		}
		if (stopPreview) stopPreview();
	};
}
