import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { DATABASE_URL } from '$env/static/private';

const globalForPrisma = globalThis;
const adapter = new PrismaPg({ connectionString: DATABASE_URL });

export const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		adapter,
		log: ['error', 'warn']
	});

if (process.env.NODE_ENV !== 'production') {
	globalForPrisma.prisma = prisma;
}
