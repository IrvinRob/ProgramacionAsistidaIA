<script>
	import { resolve } from '$app/paths';

	let { data, form } = $props();

	const formatMXN = (value) =>
		new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value ?? 0);

	function fieldValue(cliente, field) {
		if (form?.editId === cliente.id && form?.values?.[field] !== undefined) {
			return form.values[field] ?? '';
		}

		return cliente[field] ?? '';
	}
</script>

<svelte:head>
	<title>Clientes | GestorPyme</title>
</svelte:head>

{#snippet clienteCard(cliente)}
	<div class="rounded-lg border border-slate-200 bg-white p-4">
		<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
			<div class="min-w-0">
				<div class="flex flex-wrap items-center gap-2">
					<h3 class="font-semibold text-slate-950">{cliente.nombre}</h3>
					<span
						class={[
							'rounded-full px-2 py-1 text-xs font-medium',
							cliente.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
						]}
					>
						{cliente.activo ? 'Activo' : 'Inactivo'}
					</span>
				</div>
				<p class="mt-1 text-sm text-slate-500">{cliente.empresa || cliente.rfc || 'Sin empresa'}</p>
				<p class="mt-2 text-sm text-slate-700">{cliente.correo}</p>
				<p class="text-sm text-slate-500">{cliente.telefono || 'Sin telefono'}</p>
			</div>

			<div class="grid gap-3 text-sm sm:grid-cols-3 lg:min-w-[360px]">
				<div>
					<p class="text-slate-500">Cotizado</p>
					<p class="font-semibold text-slate-950">{formatMXN(cliente.totalCotizado)}</p>
				</div>
				<div>
					<p class="text-slate-500">Facturado</p>
					<p class="font-semibold text-slate-950">{formatMXN(cliente.totalFacturado)}</p>
				</div>
				<div>
					<p class="text-slate-500">Pendiente</p>
					<p class="font-semibold text-slate-950">{formatMXN(cliente.saldoPendiente)}</p>
				</div>
			</div>
		</div>

		<div class="mt-4 flex flex-wrap items-center gap-3">
			<details class="group">
				<summary
					class="cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-sm font-medium select-none"
				>
					Editar datos
				</summary>
				<form
					method="POST"
					action="?/editar"
					class="mt-3 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2"
				>
					<input type="hidden" name="id" value={cliente.id} />
					<label class="space-y-1 text-sm">
						<span class="font-medium text-slate-700">Nombre</span>
						<input
							name="nombre"
							value={fieldValue(cliente, 'nombre')}
							class="w-full rounded-md border border-slate-300 bg-white px-3 py-2"
							required
						/>
						{#if form?.editId === cliente.id && form?.errors?.nombre}
							<span class="text-xs text-red-600">{form.errors.nombre}</span>
						{/if}
					</label>
					<label class="space-y-1 text-sm">
						<span class="font-medium text-slate-700">Empresa</span>
						<input
							name="empresa"
							value={fieldValue(cliente, 'empresa')}
							class="w-full rounded-md border border-slate-300 bg-white px-3 py-2"
						/>
					</label>
					<label class="space-y-1 text-sm">
						<span class="font-medium text-slate-700">RFC</span>
						<input
							name="rfc"
							value={fieldValue(cliente, 'rfc')}
							class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 uppercase"
						/>
						{#if form?.editId === cliente.id && form?.errors?.rfc}
							<span class="text-xs text-red-600">{form.errors.rfc}</span>
						{/if}
					</label>
					<label class="space-y-1 text-sm">
						<span class="font-medium text-slate-700">Correo</span>
						<input
							name="correo"
							type="email"
							value={fieldValue(cliente, 'correo')}
							class="w-full rounded-md border border-slate-300 bg-white px-3 py-2"
							required
						/>
						{#if form?.editId === cliente.id && form?.errors?.correo}
							<span class="text-xs text-red-600">{form.errors.correo}</span>
						{/if}
					</label>
					<label class="space-y-1 text-sm sm:col-span-2">
						<span class="font-medium text-slate-700">Telefono</span>
						<input
							name="telefono"
							value={fieldValue(cliente, 'telefono')}
							class="w-full rounded-md border border-slate-300 bg-white px-3 py-2"
						/>
					</label>
					<label class="space-y-1 text-sm sm:col-span-2">
						<span class="font-medium text-slate-700">Direccion</span>
						<textarea
							name="direccion"
							rows="2"
							class="w-full rounded-md border border-slate-300 bg-white px-3 py-2"
							>{fieldValue(cliente, 'direccion')}</textarea
						>
					</label>
					<label class="space-y-1 text-sm sm:col-span-2">
						<span class="font-medium text-slate-700">Notas</span>
						<textarea
							name="notas"
							rows="3"
							class="w-full rounded-md border border-slate-300 bg-white px-3 py-2"
							>{fieldValue(cliente, 'notas')}</textarea
						>
					</label>
					<div class="sm:col-span-2">
						<button class="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">
							Guardar cambios
						</button>
					</div>
				</form>
			</details>

			<form method="POST" action="?/cambiarEstado">
				<input type="hidden" name="id" value={cliente.id} />
				<input type="hidden" name="activo" value={!cliente.activo} />
				<button
					class="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium"
					aria-label={cliente.activo ? 'Desactivar cliente' : 'Activar cliente'}
				>
					<span
						class={[
							'flex h-5 w-9 items-center rounded-full p-0.5 transition',
							cliente.activo ? 'bg-emerald-600' : 'bg-slate-300'
						]}
					>
						<span
							class={[
								'h-4 w-4 rounded-full bg-white transition',
								cliente.activo ? 'translate-x-4' : 'translate-x-0'
							]}
						></span>
					</span>
					{cliente.activo ? 'Desactivar' : 'Activar'}
				</button>
			</form>

			<a
				href={resolve(`/clientes/${cliente.id}/historial`)}
				class="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100"
			>
				Ver historial
			</a>
		</div>
	</div>
{/snippet}

<section class="space-y-6">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-semibold tracking-normal text-slate-950">Clientes</h1>
			<p class="mt-1 text-sm text-slate-500">Alta, busqueda y seguimiento de clientes.</p>
		</div>
	</div>

	{#if data.created}
		<p
			class="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
		>
			Cliente guardado en la base de datos.
		</p>
	{/if}
	{#if data.updated}
		<p
			class="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
		>
			Cliente actualizado.
		</p>
	{/if}
	{#if data.statusChanged}
		<p
			class="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
		>
			Estado del cliente actualizado.
		</p>
	{/if}
	{#if form?.errors?.general}
		<p class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
			{form.errors.general}
		</p>
	{/if}

	<div class="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
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
						value={!form?.editId ? (form?.values?.nombre ?? '') : ''}
						class="w-full rounded-md border border-slate-300 px-3 py-2"
						required
					/>
					{#if !form?.editId && form?.errors?.nombre}
						<span class="text-xs text-red-600">{form.errors.nombre}</span>
					{/if}
				</label>
				<label class="space-y-1 text-sm">
					<span class="font-medium text-slate-700">Empresa</span>
					<input
						name="empresa"
						value={!form?.editId ? (form?.values?.empresa ?? '') : ''}
						class="w-full rounded-md border border-slate-300 px-3 py-2"
					/>
				</label>
				<label class="space-y-1 text-sm">
					<span class="font-medium text-slate-700">RFC</span>
					<input
						name="rfc"
						value={!form?.editId ? (form?.values?.rfc ?? '') : ''}
						class="w-full rounded-md border border-slate-300 px-3 py-2 uppercase"
					/>
					{#if !form?.editId && form?.errors?.rfc}
						<span class="text-xs text-red-600">{form.errors.rfc}</span>
					{/if}
				</label>
				<label class="space-y-1 text-sm">
					<span class="font-medium text-slate-700">Correo</span>
					<input
						name="correo"
						type="email"
						value={!form?.editId ? (form?.values?.correo ?? '') : ''}
						class="w-full rounded-md border border-slate-300 px-3 py-2"
						required
					/>
					{#if !form?.editId && form?.errors?.correo}
						<span class="text-xs text-red-600">{form.errors.correo}</span>
					{/if}
				</label>
				<label class="space-y-1 text-sm sm:col-span-2">
					<span class="font-medium text-slate-700">Telefono</span>
					<input
						name="telefono"
						value={!form?.editId ? (form?.values?.telefono ?? '') : ''}
						class="w-full rounded-md border border-slate-300 px-3 py-2"
					/>
				</label>
				<label class="space-y-1 text-sm sm:col-span-2">
					<span class="font-medium text-slate-700">Direccion</span>
					<textarea
						name="direccion"
						rows="2"
						class="w-full rounded-md border border-slate-300 px-3 py-2"
						>{!form?.editId ? (form?.values?.direccion ?? '') : ''}</textarea
					>
				</label>
				<label class="space-y-1 text-sm sm:col-span-2">
					<span class="font-medium text-slate-700">Notas</span>
					<textarea
						name="notas"
						rows="3"
						class="w-full rounded-md border border-slate-300 px-3 py-2"
						>{!form?.editId ? (form?.values?.notas ?? '') : ''}</textarea
					>
				</label>
			</div>

			<button class="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">
				Guardar cliente
			</button>
		</form>

		<div class="space-y-5">
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

			<div class="rounded-lg border border-slate-200 bg-white p-4">
				<div class="mb-4 flex items-center justify-between gap-3">
					<div>
						<h2 class="text-base font-semibold text-slate-950">Clientes activos</h2>
						<p class="text-sm text-slate-500">
							Mostrando {data.clientes.length} de {data.total} clientes activos.
						</p>
					</div>
				</div>

				<div class="space-y-3">
					{#each data.clientes as cliente (cliente.id)}
						{@render clienteCard(cliente)}
					{:else}
						<p
							class="rounded-md border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500"
						>
							No hay clientes activos con esos filtros.
						</p>
					{/each}
				</div>
			</div>

			<div class="rounded-lg border border-slate-200 bg-white p-4">
				<div class="mb-4">
					<h2 class="text-base font-semibold text-slate-950">Clientes inactivos</h2>
					<p class="text-sm text-slate-500">
						{data.totalInactivos} clientes inactivos en la base.
					</p>
				</div>

				<div class="space-y-3">
					{#each data.clientesInactivos as cliente (cliente.id)}
						{@render clienteCard(cliente)}
					{:else}
						<p
							class="rounded-md border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500"
						>
							No hay clientes inactivos.
						</p>
					{/each}
				</div>
			</div>
		</div>
	</div>
</section>
