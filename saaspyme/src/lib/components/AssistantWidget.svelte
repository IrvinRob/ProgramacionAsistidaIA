<script>
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onDestroy, tick } from 'svelte';
	import { attachCameraPreview, startEmotionTracking } from '$lib/client/morphcast.js';
	import {
		EMOTION_LABELS,
		INTERPRETATION_LABELS,
		detectProactiveReaction
	} from '$lib/shared/emotions.js';

	let { usuario, morphcastLicenseKey = '' } = $props();

	let open = $state(false);
	let input = $state('');
	let loading = $state(false);
	let error = $state('');
	let messages = $state([]);
	let cameraStatus = $state('idle');
	let latestSample = $state(null);
	let sessionId = $state(null);
	let proactiveCount = $state(0);
	let previewVideo = $state(null);
	let cameraMessage = $state('');
	let messagesContainer = $state(null);

	let stopTracking = null;
	let stopPreview = null;
	let watchingAfterResponse = false;
	let recentSamples = [];
	let lastProactiveAt = 0;
	let lastMilestoneEmotion = null;
	let lastMilestoneAt = 0;
	let sampleWaiters = [];
	let postResponseWatchTimer = null;

	const POST_RESPONSE_READ_DELAY_MS = 4000;
	const POST_RESPONSE_WATCH_MS = 10000;

	const suggestions = [
		'¿Cómo creo una cotización?',
		'¿Dónde registro un pago?',
		'¿Qué significan los estados de cotización?'
	];

	const emotionLabel = $derived(
		latestSample?.emocionDominante
			? (EMOTION_LABELS[latestSample.emocionDominante] ?? latestSample.emocionDominante)
			: 'Sin lectura'
	);
	const interpretationLabel = $derived(
		latestSample?.interpretation
			? (INTERPRETATION_LABELS[latestSample.interpretation] ?? latestSample.interpretation)
			: ''
	);

	async function scrollChatToBottom() {
		await tick();
		requestAnimationFrame(() => {
			if (!messagesContainer) return;
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		});
	}

	$effect(() => {
		messages.length;
		loading;
		error;
		void scrollChatToBottom();
	});

	function clearPostResponseWatch() {
		if (postResponseWatchTimer) {
			clearTimeout(postResponseWatchTimer);
			postResponseWatchTimer = null;
		}
		watchingAfterResponse = false;
		recentSamples = [];
	}

	function schedulePostResponseWatch() {
		clearPostResponseWatch();

		postResponseWatchTimer = setTimeout(() => {
			postResponseWatchTimer = null;
			if (loading) return;

			watchingAfterResponse = true;
			recentSamples = [];

			postResponseWatchTimer = setTimeout(() => {
				postResponseWatchTimer = null;
				watchingAfterResponse = false;
			}, POST_RESPONSE_WATCH_MS);
		}, POST_RESPONSE_READ_DELAY_MS);
	}

	function notifySample(sample) {
		latestSample = sample;
		for (const resolveWait of sampleWaiters) resolveWait(sample);
		sampleWaiters = [];

		if (watchingAfterResponse) {
			recentSamples = [...recentSamples.slice(-19), sample];
			maybeOfferHelp();
		}

		const now = Date.now();
		if (
			sessionId &&
			sample.emocionDominante &&
			sample.emocionDominante !== lastMilestoneEmotion &&
			now - lastMilestoneAt > 12000
		) {
			lastMilestoneEmotion = sample.emocionDominante;
			lastMilestoneAt = now;
			persistLectura('MILESTONE', sample);
		}
	}

	function waitForSample(timeoutMs = 4000) {
		if (latestSample) return Promise.resolve(latestSample);

		return new Promise((resolveWait) => {
			const timer = setTimeout(() => {
				sampleWaiters = sampleWaiters.filter((waiter) => waiter !== resolveWait);
				resolveWait(latestSample);
			}, timeoutMs);

			sampleWaiters.push((sample) => {
				clearTimeout(timer);
				resolveWait(sample);
			});
		});
	}

	async function persist(url, payload, method = 'POST') {
		try {
			await fetch(resolve(url), {
				method,
				headers: { 'content-type': 'application/json' },
				body: payload ? JSON.stringify(payload) : undefined
			});
		} catch (cause) {
			console.warn('[engagement] No se pudo persistir', cause);
		}
	}

	function persistLectura(motivo, sample = latestSample) {
		if (!sessionId || !sample) return;
		return persist('/api/engagement/lecturas', {
			sesionId: sessionId,
			emocionDominante: sample.emocionDominante,
			emociones: sample.emociones ?? {},
			atencion: sample.atencion,
			ruta: page.url.pathname,
			motivo
		});
	}

	function persistIntervencion(tipo, reply, sample = latestSample) {
		if (!sessionId || !reply) return;
		return persist('/api/engagement/intervenciones', {
			sesionId: sessionId,
			tipo,
			emocionDisparadora: sample?.emocionDominante ?? null,
			respuestaClaude: reply
		});
	}

	function emotionPayload(trigger) {
		if (!latestSample) return { trigger };
		return {
			trigger,
			dominantEmotion: latestSample.emocionDominante,
			interpretation: latestSample.interpretation,
			attention: latestSample.atencion,
			scores: latestSample.emociones
		};
	}

	async function askAssistant({
		userText,
		trigger = 'consulta',
		hidden = false,
		interventionType = null
	}) {
		if (loading) return;
		error = '';
		if (userText && !hidden) {
			messages = [...messages, { role: 'user', content: userText }];
			input = '';
			await scrollChatToBottom();
		}

		loading = true;
		clearPostResponseWatch();

		try {
			const response = await fetch(resolve('/api/assistant'), {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					messages,
					pagePath: page.url.pathname,
					emotionContext: emotionPayload(trigger)
				})
			});

			const data = await response.json();
			if (!response.ok || !data.ok) {
				throw new Error(data.error ?? 'No se pudo obtener respuesta');
			}

			if (data.skipped || !data.reply) {
				return;
			}

			messages = [...messages, { role: 'assistant', content: data.reply }];

			if (interventionType) {
				await persistIntervencion(interventionType, data.reply);
			}

			if (trigger === 'consulta' && !hidden) {
				schedulePostResponseWatch();
			}
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'Error al contactar al asistente';
		} finally {
			loading = false;
		}
	}

	function maybeOfferHelp() {
		const now = Date.now();
		if (loading || !watchingAfterResponse) return;
		if (!messages.some((item) => item.role === 'user')) return;
		if (proactiveCount >= 3) return;
		if (now - lastProactiveAt < 12000) return;

		const reaction = detectProactiveReaction(recentSamples, 4);
		if (!reaction) return;

		watchingAfterResponse = false;
		lastProactiveAt = now;
		proactiveCount += 1;
		persistLectura('POST_RESPONSE');

		if (reaction === 'positivo') {
			askAssistant({
				trigger: 'post_response_positive',
				hidden: true,
				interventionType: 'ACLARACION'
			});
			return;
		}

		if (reaction === 'enojo') {
			askAssistant({
				trigger: 'post_response_angry',
				hidden: true,
				interventionType: 'OFERTA_AYUDA'
			});
			return;
		}

		askAssistant({
			trigger: reaction === 'frustracion' ? 'post_response_negative' : 'post_response_doubt',
			hidden: true,
			interventionType: 'OFERTA_AYUDA'
		});
	}

	async function startCameraSession() {
		if (stopTracking || stopPreview) return;

		cameraStatus = 'requesting';
		cameraMessage = 'Solicitando acceso a la camara...';
		latestSample = null;
		await tick();

		try {
			if (!previewVideo) {
				throw new Error('No se pudo crear la vista previa de camara');
			}

			if (!morphcastLicenseKey) {
				stopPreview = await attachCameraPreview(previewVideo);
				cameraStatus = 'preview';
				cameraMessage =
					'Camara activa, pero falta PUBLIC_MORPHCAST_LICENSE_KEY en .env. MorphCast no esta analizando emociones.';
				return;
			}

			stopTracking = await startEmotionTracking({
				licenseKey: morphcastLicenseKey,
				videoEl: previewVideo,
				onSample: notifySample
			});
			cameraStatus = 'active';
			cameraMessage = 'MorphCast activo. Si te ves aqui, la camara es la correcta.';

			const sessionResponse = await fetch(resolve('/api/engagement/sessions'), {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					rutaInicio: page.url.pathname,
					camaraActiva: true
				})
			});
			const sessionData = await sessionResponse.json();
			if (sessionResponse.ok && sessionData.ok) {
				sessionId = sessionData.sessionId;
			}

			const sample = await waitForSample();
			if (sample) await persistLectura('SESSION_START', sample);

			if (messages.length === 0) {
				await askAssistant({
					trigger: 'saludo_inicial',
					hidden: true,
					interventionType: 'SALUDO_INICIAL'
				});
			}
		} catch (cause) {
			cameraStatus = 'denied';
			cameraMessage =
				cause instanceof Error
					? cause.message
					: 'No se pudo iniciar la camara. Revisa el permiso del navegador.';
			console.warn('[morphcast] No se pudo iniciar la camara', cause);
		}
	}

	async function stopCameraSession() {
		clearPostResponseWatch();
		sampleWaiters = [];

		if (sessionId) {
			await persistLectura('SESSION_END');
			await persist(`/api/engagement/sessions/${sessionId}`, {}, 'PATCH');
		}

		if (stopTracking) {
			stopTracking();
			stopTracking = null;
		}
		if (stopPreview) {
			stopPreview();
			stopPreview = null;
		}

		sessionId = null;
		latestSample = null;
		cameraStatus = 'idle';
		cameraMessage = '';
		proactiveCount = 0;
	}

	async function togglePanel() {
		open = !open;
		error = '';

		if (open) {
			await startCameraSession();
		} else {
			await stopCameraSession();
		}
	}

	function sendMessage(text) {
		const content = text.trim();
		if (!content || loading) return;
		askAssistant({ userText: content, trigger: 'consulta' });
	}

	function handleSubmit(event) {
		event.preventDefault();
		sendMessage(input);
	}

	onDestroy(() => {
		clearPostResponseWatch();
		if (stopTracking) {
			stopTracking();
			stopTracking = null;
		}
		if (stopPreview) {
			stopPreview();
			stopPreview = null;
		}
	});
</script>

<button
	type="button"
	onclick={togglePanel}
	class="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
	aria-label={open ? 'Cerrar asistente' : 'Abrir asistente'}
>
	{#if open}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-6 w-6"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
		</svg>
	{:else}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-6 w-6"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
			/>
		</svg>
	{/if}
</button>

{#if open}
	<div class="fixed right-4 bottom-24 left-4 z-[60] flex flex-col gap-3 sm:left-auto sm:w-96">
		<div
			class="overflow-hidden rounded-lg border border-slate-200 bg-slate-950 shadow-xl"
			aria-label="Vista previa de camara MorphCast"
		>
			<div class="relative">
				<video
					bind:this={previewVideo}
					class="h-40 w-full bg-slate-900 object-cover"
					style="transform: scaleX(-1)"
					autoplay
					muted
					playsinline
				></video>
				<div
					class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2"
				>
					<p class="text-[11px] font-medium text-white">
						{#if cameraStatus === 'active'}
							MorphCast · {emotionLabel}{interpretationLabel ? ` · ${interpretationLabel}` : ''}
						{:else if cameraStatus === 'preview'}
							Camara activa · MorphCast sin license key
						{:else if cameraStatus === 'requesting'}
							Solicitando camara...
						{:else if cameraStatus === 'denied'}
							Camara no disponible
						{:else}
							Vista previa de camara
						{/if}
					</p>
				</div>
			</div>
			{#if cameraMessage}
				<p
					class={[
						'px-3 py-2 text-[11px]',
						cameraStatus === 'denied' || cameraStatus === 'preview'
							? 'bg-amber-50 text-amber-800'
							: 'bg-slate-900 text-slate-300'
					]}
				>
					{cameraMessage}
				</p>
			{/if}
		</div>

		<div
			class="flex max-h-[55vh] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl"
			role="dialog"
			aria-label="Asistente GestorPyme"
		>
			<header class="border-b border-slate-200 bg-slate-50 px-4 py-3">
				<div class="flex items-start justify-between gap-3">
					<div>
						<h2 class="text-sm font-semibold text-slate-950">Asistente GestorPyme</h2>
						<p class="text-xs text-slate-500">Te ayudo a navegar y usar la aplicación</p>
					</div>
					{#if cameraStatus === 'active'}
						<span
							class="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700"
						>
							{emotionLabel}
						</span>
					{/if}
				</div>
			</header>

			<div bind:this={messagesContainer} class="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
				{#if messages.length === 0}
					<p class="text-sm text-slate-600">
						Hola{usuario?.nombre ? `, ${usuario.nombre.split(' ')[0]}` : ''}. Pregúntame sobre
						clientes, cotizaciones, cobranza o cómo encontrar algo en la app.
					</p>
					<div class="flex flex-wrap gap-2">
						{#each suggestions as suggestion (suggestion)}
							<button
								type="button"
								onclick={() => sendMessage(suggestion)}
								class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
							>
								{suggestion}
							</button>
						{/each}
					</div>
				{/if}

				{#each messages as message, index (index)}
					<div class={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
						<div
							class={[
								'max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap',
								message.role === 'user'
									? 'bg-slate-900 text-white'
									: 'border border-slate-200 bg-slate-50 text-slate-800'
							]}
						>
							{message.content}
						</div>
					</div>
				{/each}

				{#if loading}
					<div class="flex justify-start">
						<div
							class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
						>
							Escribiendo...
						</div>
					</div>
				{/if}

				{#if error}
					<p class="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
				{/if}
			</div>

			<form onsubmit={handleSubmit} class="border-t border-slate-200 p-3">
				<div class="flex gap-2">
					<input
						type="text"
						bind:value={input}
						disabled={loading}
						placeholder="Escribe tu pregunta..."
						class="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none disabled:bg-slate-50"
					/>
					<button
						type="submit"
						disabled={loading || !input.trim()}
						class="shrink-0 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Enviar
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
