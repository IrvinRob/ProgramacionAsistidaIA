<script>
	let { data, form } = $props();

	const roles = [
		{ value: 'ADMIN', label: 'Admin' },
		{ value: 'SOCIO', label: 'Socio' },
		{ value: 'ASISTENTE', label: 'Asistente' }
	];
</script>

<svelte:head>
	<title>Usuarios | GestorPyme</title>
</svelte:head>

<section class="space-y-6">
	<div>
		<h1 class="text-2xl font-semibold tracking-normal text-slate-950">Usuarios</h1>
		<p class="mt-1 text-sm text-slate-500">
			Alta, baja y cambios de socios y asistentes con acceso al sistema.
		</p>
	</div>

	{#if form?.error}
		<p class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
			{form.error}
		</p>
	{/if}

	<form
		method="POST"
		action="?/crear"
		class="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 md:grid-cols-[1fr_1fr_180px_auto]"
	>
		<label class="space-y-1">
			<span class="text-sm font-medium text-slate-700">Nombre</span>
			<input
				name="nombre"
				class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
				placeholder="Nombre completo"
				required
			/>
		</label>
		<label class="space-y-1">
			<span class="text-sm font-medium text-slate-700">Correo</span>
			<input
				name="correo"
				type="email"
				class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
				placeholder="correo@empresa.com"
				required
			/>
		</label>
		<label class="space-y-1">
			<span class="text-sm font-medium text-slate-700">Rol</span>
			<select name="rol" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
				<option value="ASISTENTE">Asistente</option>
				<option value="SOCIO">Socio</option>
				<option value="ADMIN">Admin</option>
			</select>
		</label>
		<div class="flex items-end">
			<button class="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">
				Agregar
			</button>
		</div>
	</form>

	<div class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
		<table class="min-w-full divide-y divide-slate-200 text-sm">
			<thead
				class="bg-slate-50 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase"
			>
				<tr>
					<th class="px-4 py-3">Usuario</th>
					<th class="px-4 py-3">Correo</th>
					<th class="px-4 py-3">Rol</th>
					<th class="px-4 py-3">Estado</th>
					<th class="px-4 py-3 text-right">Acciones</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-slate-200">
				{#each data.usuarios as usuario (usuario.id)}
					<tr>
						<td class="px-4 py-3">
							<input
								form={`editar-${usuario.id}`}
								name="nombre"
								value={usuario.nombre}
								class="w-full rounded-md border border-slate-300 px-2 py-1"
								required
							/>
						</td>
						<td class="px-4 py-3">
							<input
								form={`editar-${usuario.id}`}
								name="correo"
								type="email"
								value={usuario.correo}
								class="w-full rounded-md border border-slate-300 px-2 py-1"
								required
							/>
						</td>
						<td class="px-4 py-3">
							<select
								form={`editar-${usuario.id}`}
								name="rol"
								class="w-full rounded-md border border-slate-300 px-2 py-1"
							>
								{#each roles as rol (rol.value)}
									<option value={rol.value} selected={usuario.rol === rol.value}>
										{rol.label}
									</option>
								{/each}
							</select>
						</td>
						<td class="px-4 py-3">
							<span
								class={[
									'inline-flex rounded-full px-2 py-1 text-xs font-medium',
									usuario.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
								]}
							>
								{usuario.activo ? 'Activo' : 'Inactivo'}
							</span>
						</td>
						<td class="px-4 py-3">
							<div class="flex justify-end gap-2">
								<form id={`editar-${usuario.id}`} method="POST" action="?/actualizar">
									<input type="hidden" name="id" value={usuario.id} />
									<button
										class="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
									>
										Guardar
									</button>
								</form>
								<form method="POST" action="?/cambiarEstado">
									<input type="hidden" name="id" value={usuario.id} />
									<input type="hidden" name="activo" value={String(!usuario.activo)} />
									<button
										class="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
										disabled={usuario.id === data.usuarioActualId && usuario.activo}
									>
										{usuario.activo ? 'Desactivar' : 'Activar'}
									</button>
								</form>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
