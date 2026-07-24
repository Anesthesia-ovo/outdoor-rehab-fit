// Date helpers shared by goals / sessions / usage tracking

// Returns "YYYY-MM-DD" in local time
export const toDateKey = (date = new Date()) => {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
};

// Monday 00:00 of the week containing `date`
export const getWeekStart = (date = new Date()) => {
	const d = new Date(date);
	const day = d.getDay(); // 0 = Sunday
	const diff = day === 0 ? -6 : 1 - day;
	d.setDate(d.getDate() + diff);
	d.setHours(0, 0, 0, 0);
	return d;
};

// Stable key for a week, e.g. "2026-07-20" (the Monday date)
export const getWeekKey = (date = new Date()) => toDateKey(getWeekStart(date));

// Array of 7 Date objects, Monday..Sunday of current week
export const getWeekDates = (date = new Date()) => {
	const start = getWeekStart(date);
	return Array.from({ length: 7 }, (_, i) => {
		const d = new Date(start);
		d.setDate(start.getDate() + i);
		return d;
	});
};

export const formatDuration = (totalSeconds) => {
	const m = Math.floor(totalSeconds / 60);
	const s = totalSeconds % 60;
	return `${m}:${String(s).padStart(2, "0")}`;
};

export const formatDateTime = (isoString, locale = "zh") => {
	const d = new Date(isoString);
	return d.toLocaleString(locale === "zh" ? "zh-HK" : "en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};
