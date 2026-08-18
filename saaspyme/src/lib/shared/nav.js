export const navItems = [
	{ href: '/dashboard', label: 'Dashboard' },
	{ href: '/clientes', label: 'Clientes' },
	{ href: '/cotizaciones', label: 'Cotizaciones' },
	{ href: '/cobranza', label: 'Cobranza' },
	{ href: '/engagement', label: 'Engagement' },
	{ href: '/usuarios', label: 'Usuarios', roles: ['ADMIN'] }
];

export function visibleNavItems(usuario) {
	return navItems.filter((item) => !item.roles || item.roles.includes(usuario?.rol));
}
