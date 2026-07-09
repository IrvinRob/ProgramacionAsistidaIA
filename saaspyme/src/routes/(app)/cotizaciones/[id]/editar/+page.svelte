<script>
	import { resolve } from '$app/paths';

	let { data, form } = $props();

	const initialValues = $derived(form?.values ?? data.cotizacion);
	let conceptos = $state([]);

	$effect(() => {
		const source = form?.values?.conceptos?.length
			? form.values.conceptos
			: data.cotizacion.conceptos;
		conceptos = source.map((concepto) => {
			const guardado = data.conceptosGuardados.find(
				(item) => item.descripcion === concepto.descripcion
			);

			return {
				tipo: guardado ? 'guardado' : 'nuevo',
				descripcion: concepto.descripcion,
				cantidad: Number(concepto.cantidad || 1),
				precioUnitario: Number(concepto.precioUnitario || 0)
			};
		});
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
</script>

<svelte:head>
	<title>Editar cotizacion | GestorPyme</title>
</svelte:head>

<section class="space-y-6">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-semibold tracking-normal text-slate-950">
				Editar {data.cotizacion.numero}
			</h1>
			<p class="mt-1 text-sm text-slate-500">
				{data.cotizacion.estado === 'BORRADOR'
					? 'Al guardar, la cotizacion se enviara al cliente.'
					: 'Al guardar, la cotizacion se reenviara al cliente.'}
			</p>
		</div>
		<a
			href={resolve('/cotizaciones')}
			class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium"
		>
			Volver
		</a>
	</div>

	{#if form?.errors?.general}
		<p class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
			{form.errors.general}
		</p>
	{/if}

	<form method="POST" action="?/guardar" class="space-y-6">
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
						<option value={cliente.id} selected={initialValues.clienteId === cliente.id}>
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
					value={initialValues.fecha}
					class="w-full rounded-md border border-slate-300 px-3 py-2"
					required
				/>
			</label>
			<label class="space-y-1 text-sm">
				<span class="font-medium text-slate-700">Vencimiento</span>
				<input
					name="vencimiento"
					type="date"
					value={initialValues.vencimiento ?? ''}
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
							<input
								name="descripcion"
								bind:value={concepto.descripcion}
								placeholder="Descripcion del servicio"
								class="rounded-md border border-slate-300 px-3 py-2 text-sm"
								required
							/>
						{:else if concepto.tipo === 'guardado'}
							<input
								name="descripcion"
								value={concepto.descripcion}
								readonly
								class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
							/>
						{:else}
							<input type="hidden" name="descripcion" value="" />
							<div class="hidden md:block"></div>
						{/if}
						<input
							name="cantidad"
							type="number"
							step="0.01"
							min="0.01"
							bind:value={concepto.cantidad}
							class="rounded-md border border-slate-300 px-3 py-2 text-sm"
							required
						/>
						<input
							name="precioUnitario"
							type="number"
							step="0.01"
							min="0"
							bind:value={concepto.precioUnitario}
							readonly={concepto.tipo !== 'nuevo'}
							class={[
								'rounded-md border px-3 py-2 text-sm',
								concepto.tipo === 'nuevo'
									? 'border-slate-300'
									: 'border-slate-200 bg-slate-50 text-slate-600'
							]}
							required
						/>
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
					>{initialValues.notas ?? ''}</textarea
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
				<button class="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">
					{data.cotizacion.estado === 'BORRADOR' ? 'Guardar y enviar' : 'Guardar y reenviar'}
				</button>
			</div>
		</div>
	</form>
</section>
