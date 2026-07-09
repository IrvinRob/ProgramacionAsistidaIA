<script>
	import { todayCalendarDate } from '$lib/dates.js';

	let { data, form } = $props();

	const today = todayCalendarDate();
	const selectedClienteId = $derived(form?.values?.clienteId ?? data.selectedClienteId ?? '');
	let conceptos = $state([{ tipo: '', descripcion: '', cantidad: 1, precioUnitario: 0 }]);
	let isSubmitting = $state(false);

	$effect(() => {
		if (form?.values?.conceptos?.length) {
			conceptos = form.values.conceptos.map((concepto) => ({ tipo: 'nuevo', ...concepto }));
		}
	});

	const subtotal = $derived(
		conceptos.reduce((sum, concepto) => {
			return sum + Number(concepto.cantidad || 0) * Number(concepto.precioUnitario || 0);
		}, 0)
	);
	const iva = $derived(subtotal * 0.16);
	const total = $derived(subtotal + iva);
	const formatMXN = (value) =>
		new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value ?? 0);

	function agregarConcepto() {
		conceptos = [...conceptos, { tipo: '', descripcion: '', cantidad: 1, precioUnitario: 0 }];
	}

	function quitarConcepto(index) {
		if (conceptos.length === 1) return;
		conceptos = conceptos.filter((_, currentIndex) => currentIndex !== index);
	}

	function seleccionarConcepto(index, value) {
		if (!value) {
			conceptos[index].tipo = '';
			conceptos[index].descripcion = '';
			conceptos[index].precioUnitario = 0;
			return;
		}

		if (value === 'nuevo') {
			conceptos[index].tipo = 'nuevo';
			conceptos[index].descripcion = '';
			conceptos[index].precioUnitario = 0;
			return;
		}

		const conceptoGuardado = data.conceptosGuardados.find(
			(concepto) => concepto.descripcion === value
		);

		if (conceptoGuardado) {
			conceptos[index].tipo = 'guardado';
			conceptos[index].descripcion = conceptoGuardado.descripcion;
			conceptos[index].precioUnitario = conceptoGuardado.precioUnitario;
		}
	}

	function bloquearDobleEnvio(event) {
		if (isSubmitting) {
			event.preventDefault();
			return;
		}

		isSubmitting = true;
	}
</script>

<svelte:head>
	<title>Nueva cotizacion | GestorPyme</title>
</svelte:head>

<section class="space-y-6">
	<div>
		<h1 class="text-2xl font-semibold tracking-normal text-slate-950">Nueva cotizacion</h1>
		<p class="mt-1 text-sm text-slate-500">Formulario dinamico de conceptos y totales.</p>
	</div>

	{#if form?.errors?.general}
		<p class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
			{form.errors.general}
		</p>
	{/if}

	<form method="POST" action="?/crear" class="space-y-6" onsubmit={bloquearDobleEnvio}>
		<div class="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 md:grid-cols-3">
			<label class="space-y-1 text-sm md:col-span-3">
				<span class="font-medium text-slate-700">Cliente</span>
				<select
					name="clienteId"
					class="w-full rounded-md border border-slate-300 px-3 py-2"
					required
				>
					<option value="">Selecciona un cliente activo</option>
					{#each data.clientes as cliente (cliente.id)}
						<option value={cliente.id} selected={selectedClienteId === cliente.id}>
							{cliente.nombre}{cliente.empresa ? ` - ${cliente.empresa}` : ''}
						</option>
					{/each}
				</select>
				{#if form?.errors?.clienteId}<span class="text-xs text-red-600"
						>{form.errors.clienteId}</span
					>{/if}
			</label>

			<label class="space-y-1 text-sm">
				<span class="font-medium text-slate-700">Fecha</span>
				<input
					name="fecha"
					type="date"
					value={form?.values?.fecha ?? today}
					class="w-full rounded-md border border-slate-300 px-3 py-2"
					required
				/>
			</label>
			<label class="space-y-1 text-sm">
				<span class="font-medium text-slate-700">Vencimiento</span>
				<input
					name="vencimiento"
					type="date"
					value={form?.values?.vencimiento ?? ''}
					class="w-full rounded-md border border-slate-300 px-3 py-2"
				/>
			</label>
			<label class="space-y-1 text-sm">
				<span class="font-medium text-slate-700">Moneda</span>
				<input
					value="MXN"
					readonly
					class="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500"
				/>
			</label>
		</div>

		<div class="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
			<div class="flex items-center justify-between gap-3">
				<h2 class="text-base font-semibold text-slate-950">Conceptos</h2>
				<button
					type="button"
					onclick={agregarConcepto}
					class="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium"
				>
					Agregar
				</button>
			</div>

			<div class="space-y-3">
				{#each conceptos as concepto, index (index)}
					<div
						class="grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-[220px_1fr_120px_160px_100px]"
					>
						<select
							value={concepto.tipo === 'nuevo' ? 'nuevo' : concepto.descripcion}
							onchange={(event) => seleccionarConcepto(index, event.currentTarget.value)}
							class="rounded-md border border-slate-300 px-3 py-2 text-sm"
							required
						>
							<option value="">Elija un concepto</option>
							{#each data.conceptosGuardados as conceptoGuardado (conceptoGuardado.descripcion)}
								<option value={conceptoGuardado.descripcion}>{conceptoGuardado.descripcion}</option>
							{/each}
							<option value="nuevo">Nuevo concepto</option>
						</select>
						{#if concepto.tipo === 'nuevo'}
							<label class="space-y-1 text-sm">
								<span class="font-medium text-slate-700">Descripcion</span>
								<input
									name="descripcion"
									bind:value={concepto.descripcion}
									placeholder="Descripcion del servicio"
									class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
									required
								/>
							</label>
						{:else if concepto.tipo === 'guardado'}
							<label class="space-y-1 text-sm">
								<span class="font-medium text-slate-700">Descripcion</span>
								<input
									name="descripcion"
									value={concepto.descripcion}
									readonly
									class="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
								/>
							</label>
						{:else}
							<input type="hidden" name="descripcion" value="" />
							<div class="hidden md:block"></div>
						{/if}
						<label class="space-y-1 text-sm">
							<span class="font-medium text-slate-700">Cantidad</span>
							<input
								name="cantidad"
								type="number"
								step="0.01"
								min="0.01"
								bind:value={concepto.cantidad}
								class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
								required
							/>
						</label>
						<label class="space-y-1 text-sm">
							<span class="font-medium text-slate-700">Precio</span>
							<input
								name="precioUnitario"
								type="number"
								step="0.01"
								min="0"
								bind:value={concepto.precioUnitario}
								readonly={concepto.tipo !== 'nuevo'}
								class={[
									'w-full rounded-md border px-3 py-2 text-sm',
									concepto.tipo === 'nuevo'
										? 'border-slate-300'
										: 'border-slate-200 bg-slate-50 text-slate-600'
								]}
								required
							/>
						</label>
						<button
							type="button"
							onclick={() => quitarConcepto(index)}
							class="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium"
						>
							Quitar
						</button>
					</div>
				{/each}
			</div>
		</div>

		<div class="grid gap-4 lg:grid-cols-[1fr_320px]">
			<label class="space-y-1 text-sm rounded-lg border border-slate-200 bg-white p-5">
				<span class="font-medium text-slate-700">Notas</span>
				<textarea name="notas" rows="5" class="w-full rounded-md border border-slate-300 px-3 py-2"
					>{form?.values?.notas ?? ''}</textarea
				>
			</label>

			<div class="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
				<div class="flex justify-between text-sm">
					<span class="text-slate-500">Subtotal</span>
					<span class="font-medium">{formatMXN(subtotal)}</span>
				</div>
				<div class="flex justify-between text-sm">
					<span class="text-slate-500">IVA 16%</span>
					<span class="font-medium">{formatMXN(iva)}</span>
				</div>
				<div class="flex justify-between border-t border-slate-200 pt-3 text-lg font-semibold">
					<span>Total</span>
					<span>{formatMXN(total)}</span>
				</div>
				<button
					name="intent"
					value="enviar"
					disabled={isSubmitting}
					aria-disabled={isSubmitting}
					class={[
						'w-full rounded-md px-4 py-2 text-sm font-medium text-white',
						isSubmitting ? 'cursor-not-allowed bg-slate-400' : 'bg-slate-900'
					]}
				>
					{isSubmitting ? 'Enviando...' : 'Crear cotizacion'}
				</button>
				<button
					name="intent"
					value="borrador"
					aria-disabled={isSubmitting}
					class={[
						'w-full rounded-md border px-4 py-2 text-sm font-medium',
						isSubmitting
							? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
							: 'border-slate-300'
					]}
				>
					Guardar borrador
				</button>
			</div>
		</div>
	</form>
</section>
