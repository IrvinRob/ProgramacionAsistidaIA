import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { DATABASE_URL } from '$env/static/private';

const globalForPrisma = globalThis;
const isLocalDatabase = DATABASE_URL?.includes('localhost') || DATABASE_URL?.includes('127.0.0.1');

function connectionStringWithoutSslMode(connectionString) {
	if (!connectionString) return connectionString;

	try {
		const url = new URL(connectionString);
		url.searchParams.delete('sslmode');
		return url.toString();
	} catch {
		return connectionString;
	}
}

const adapter = new PrismaPg({
	connectionString: connectionStringWithoutSslMode(DATABASE_URL),
	ssl: isLocalDatabase ? undefined : { rejectUnauthorized: false }
});

export const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		adapter,
		log: ['error', 'warn']
	});

if (process.env.NODE_ENV !== 'production') {
	globalForPrisma.prisma = prisma;
}
