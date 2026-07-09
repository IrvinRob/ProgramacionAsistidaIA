const calendarFormatter = new Intl.DateTimeFormat('es-MX', {
	year: 'numeric',
	month: 'short',
	day: '2-digit',
	timeZone: 'UTC'
});
const DEFAULT_TIME_ZONE = 'America/Mexico_City';

function pad(value) {
	return String(value).padStart(2, '0');
}

export function toCalendarDate(value) {
	if (!value) return '';

	if (value instanceof Date) {
		return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`;
	}

	const raw = String(value);
	const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);

	return match ? `${match[1]}-${match[2]}-${match[3]}` : '';
}

export function formatCalendarDate(value, fallback = '') {
	const calendarDate = toCalendarDate(value);
	if (!calendarDate) return fallback;

	return calendarFormatter.format(new Date(`${calendarDate}T00:00:00.000Z`));
}

export function calendarMonthKey(value) {
	const calendarDate = toCalendarDate(value);
	return calendarDate ? calendarDate.slice(0, 7) : '';
}

export function todayCalendarDate(date = new Date()) {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function currentTimeParts(date, timeZone) {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		hour12: false,
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	}).formatToParts(date);
	const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
	const hour = Number(byType.hour);

	return {
		hour: hour === 24 ? 0 : hour,
		minute: Number(byType.minute),
		second: Number(byType.second),
		millisecond: date.getMilliseconds()
	};
}

function currentDateTimeParts(date, timeZone) {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		hour12: false,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	}).formatToParts(date);
	const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
	const hour = Number(byType.hour);

	return {
		year: Number(byType.year),
		month: Number(byType.month),
		day: Number(byType.day),
		hour: hour === 24 ? 0 : hour,
		minute: Number(byType.minute),
		second: Number(byType.second),
		millisecond: date.getMilliseconds()
	};
}

export function calendarDateWithCurrentTime(
	value,
	date = new Date(),
	timeZone = DEFAULT_TIME_ZONE
) {
	const calendarDate = toCalendarDate(value);
	if (!calendarDate) return null;

	const [year, month, day] = calendarDate.split('-').map(Number);
	const time = currentTimeParts(date, timeZone);

	return new Date(
		Date.UTC(year, month - 1, day, time.hour, time.minute, time.second, time.millisecond)
	);
}

export function currentDateTimeInDefaultTimeZone(date = new Date(), timeZone = DEFAULT_TIME_ZONE) {
	const parts = currentDateTimeParts(date, timeZone);

	return new Date(
		Date.UTC(
			parts.year,
			parts.month - 1,
			parts.day,
			parts.hour,
			parts.minute,
			parts.second,
			parts.millisecond
		)
	);
}
