import { prisma } from '$lib/server/prisma.js';

const EMOTION_ORDER = ['Surprise', 'Fear', 'Sad', 'Happy', 'Neutral', 'Angry', 'Disgust'];

function emptyEngagement(error = null) {
	return {
		kpis: {
			sesiones: 0,
			lecturas: 0,
			intervenciones: 0,
			dudasDetectadas: 0
		},
		porRuta: [],
		sesiones: [],
		intervenciones: [],
		error
	};
}

export async function load() {
	try {
		const [
			totalSesiones,
			totalLecturas,
			totalIntervenciones,
			dudasDetectadas,
			sesiones,
			lecturas,
			intervenciones
		] = await Promise.all([
			prisma.sesionEngagement.count(),
			prisma.lecturaEmocion.count(),
			prisma.intervencionAsistente.count(),
			prisma.lecturaEmocion.count({ where: { motivo: 'POST_RESPONSE' } }),
			prisma.sesionEngagement.findMany({
				take: 12,
				orderBy: { inicioEn: 'desc' },
				include: {
					usuario: { select: { nombre: true } },
					_count: { select: { lecturas: true, intervenciones: true } }
				}
			}),
			prisma.lecturaEmocion.findMany({
				orderBy: { creadoEn: 'desc' },
				take: 400,
				select: {
					emocionDominante: true,
					ruta: true,
					motivo: true,
					creadoEn: true
				}
			}),
			prisma.intervencionAsistente.findMany({
				take: 10,
				orderBy: { creadoEn: 'desc' },
				include: {
					sesion: {
						select: {
							rutaInicio: true,
							usuario: { select: { nombre: true } }
						}
					}
				}
			})
		]);

		const porRutaMap = new Map();
		for (const lectura of lecturas) {
			const ruta = lectura.ruta || '/';
			const current = porRutaMap.get(ruta) ?? { ruta, total: 0, emociones: {} };
			current.total += 1;
			if (lectura.emocionDominante) {
				current.emociones[lectura.emocionDominante] =
					(current.emociones[lectura.emocionDominante] ?? 0) + 1;
			}
			porRutaMap.set(ruta, current);
		}

		const porRuta = [...porRutaMap.values()]
			.sort((a, b) => b.total - a.total)
			.slice(0, 6)
			.map((item) => {
				const dominant =
					EMOTION_ORDER.find((key) => item.emociones[key]) ??
					Object.keys(item.emociones)[0] ??
					'Neutral';
				return {
					ruta: item.ruta,
					total: item.total,
					dominante: dominant,
					conteoDominante: item.emociones[dominant] ?? 0
				};
			});

		return {
			kpis: {
				sesiones: totalSesiones,
				lecturas: totalLecturas,
				intervenciones: totalIntervenciones,
				dudasDetectadas
			},
			porRuta,
			sesiones,
			intervenciones,
			error: null
		};
	} catch (cause) {
		console.error('[engagement] Error al cargar dashboard', cause);
		return emptyEngagement('No se pudieron cargar las sesiones de engagement.');
	}
}
