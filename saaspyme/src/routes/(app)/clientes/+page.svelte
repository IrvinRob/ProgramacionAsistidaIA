<script>
	let { data, form } = $props();

	const formatMXN = (value) =>
		new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value ?? 0);
</script>

<svelte:head>
	<title>Clientes | GestorPyme</title>
</svelte:head>

<section class="space-y-6">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-semibold tracking-normal text-slate-950">Clientes</h1>
			<p class="mt-1 text-sm text-slate-500">Alta, busqueda y seguimiento de clientes.</p>
		</div>
	</div>

	{#if form?.errors?.general}
		<p class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
			{form.errors.general}
		</p>
	{/if}

	<div class="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
		<form
			method="POST"
			action="?/crear"
			class="space-y-4 rounded-lg border border-slate-200 bg-white p-5"
		>
			<div>
				<h2 class="text-base font-semibold text-slate-950">Nuevo cliente</h2>
				<p class="mt-1 text-sm text-slate-500">Captura los datos fiscales y de contacto.</p>
			</div>

			<div class="grid gap-3 sm:grid-cols-2">
				<label class="space-y-1 text-sm">
					<span class="font-medium text-slate-700">Nombre</span>
					<input
						name="nombre"
						value={form?.values?.nombre ?? ''}
						class="w-full rounded-md border border-slate-300 px-3 py-2"
						required
					/>
					{#if form?.errors?.nombre}<span class="text-xs text-red-600">{form.errors.nombre}</span
						>{/if}
				</label>
				<label class="space-y-1 text-sm">
					<span class="font-medium text-slate-700">Empresa</span>
					<input
						name="empresa"
						value={form?.values?.empresa ?? ''}
						class="w-full rounded-md border border-slate-300 px-3 py-2"
					/>
				</label>
				<label class="space-y-1 text-sm">
					<span class="font-medium text-slate-700">RFC</span>
					<input
						name="rfc"
						value={form?.values?.rfc ?? ''}
						class="w-full rounded-md border border-slate-300 px-3 py-2 uppercase"
					/>
					{#if form?.errors?.rfc}<span class="text-xs text-red-600">{form.errors.rfc}</span>{/if}
				</label>
				<label class="space-y-1 text-sm">
					<span class="font-medium text-slate-700">Correo</span>
					<input
						name="correo"
						type="email"
						value={form?.values?.correo ?? ''}
						class="w-full rounded-md border border-slate-300 px-3 py-2"
						required
					/>
					{#if form?.errors?.correo}<span class="text-xs text-red-600">{form.errors.correo}</span
						>{/if}
				</label>
				<label class="space-y-1 text-sm sm:col-span-2">
					<span class="font-medium text-slate-700">Telefono</span>
					<input
						name="telefono"
						value={form?.values?.telefono ?? ''}
						class="w-full rounded-md border border-slate-300 px-3 py-2"
					/>
				</label>
				<label class="space-y-1 text-sm sm:col-span-2">
					<span class="font-medium text-slate-700">Direccion</span>
					<textarea
						name="direccion"
						rows="2"
						class="w-full rounded-md border border-slate-300 px-3 py-2"
						>{form?.values?.direccion ?? ''}</textarea
					>
				</label>
				<label class="space-y-1 text-sm sm:col-span-2">
					<span class="font-medium text-slate-700">Notas</span>
					<textarea
						name="notas"
						rows="3"
						class="w-full rounded-md border border-slate-300 px-3 py-2"
						>{form?.values?.notas ?? ''}</textarea
					>
				</label>
			</div>

			<button class="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">
				Guardar cliente
			</button>
		</form>

		<div class="space-y-4">
			<form method="GET" class="flex gap-2 rounded-lg border border-slate-200 bg-white p-4">
				<input
					name="q"
					value={data.q}
					placeholder="Buscar por nombre, empresa o RFC"
					class="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
				/>
				<button class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium">
					Buscar
				</button>
			</form>

			<div class="overflow-hidden rounded-lg border border-slate-200 bg-white">
				<table class="w-full text-left text-sm">
					<thead class="bg-slate-50 text-slate-500">
						<tr>
							<th class="px-4 py-3 font-medium">Cliente</th>
							<th class="px-4 py-3 font-medium">Contacto</th>
							<th class="px-4 py-3 text-right font-medium">Cotizaciones</th>
							<th class="px-4 py-3 text-right font-medium">Pendiente</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-200">
						{#each data.clientes as cliente (cliente.id)}
							<tr>
								<td class="px-4 py-3">
									<p class="font-medium text-slate-950">{cliente.nombre}</p>
									<p class="text-xs text-slate-500">
										{cliente.empresa || cliente.rfc || 'Sin empresa'}
									</p>
								</td>
								<td class="px-4 py-3">
									<p>{cliente.correo}</p>
									<p class="text-xs text-slate-500">{cliente.telefono || 'Sin telefono'}</p>
								</td>
								<td class="px-4 py-3 text-right">{cliente.cotizaciones}</td>
								<td class="px-4 py-3 text-right font-medium">{formatMXN(cliente.saldoPendiente)}</td
								>
							</tr>
						{:else}
							<tr>
								<td colspan="4" class="px-4 py-8 text-center text-slate-500">
									No hay clientes con esos filtros.
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<p class="text-sm text-slate-500">
				Mostrando {data.clientes.length} de {data.total} clientes activos.
			</p>
		</div>
	</div>
</section>
