import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSessionsForUser } from "./sessionStorage";

export const GOALS_STORAGE_KEY = "exerciseGoals";

export const GOAL_TYPES = {
	AEROBIC: "aerobic",
	BALANCE: "balance",
	STRENGTH: "strength",
};

export const DEFAULT_TARGETS = {
	[GOAL_TYPES.AEROBIC]: 3,
	[GOAL_TYPES.BALANCE]: 3,
	[GOAL_TYPES.STRENGTH]: 3,
};

export const MIN_TARGET_DAYS = 1;
export const MAX_TARGET_DAYS = 7;

function pad(n) {
	return String(n).padStart(2, "0");
}

/** Local date key YYYY-MM-DD */
export function toDateKey(dateInput) {
	const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Monday-based ISO-like week key: YYYY-Www */
export function getWeekKey(dateInput = new Date()) {
	const date = dateInput instanceof Date ? new Date(dateInput) : new Date(dateInput);
	const day = (date.getDay() + 6) % 7; // Mon=0 ... Sun=6
	const thursday = new Date(date);
	thursday.setDate(date.getDate() - day + 3);
	const week1 = new Date(thursday.getFullYear(), 0, 4);
	const week1Day = (week1.getDay() + 6) % 7;
	const week1Thursday = new Date(week1);
	week1Thursday.setDate(week1.getDate() - week1Day + 3);
	const weekNo = 1 + Math.round((thursday - week1Thursday) / (7 * 24 * 60 * 60 * 1000));
	return `${thursday.getFullYear()}-W${pad(weekNo)}`;
}

/** Mon–Sun dates for the week containing `dateInput` */
export function getWeekDates(dateInput = new Date()) {
	const date = dateInput instanceof Date ? new Date(dateInput) : new Date(dateInput);
	const day = (date.getDay() + 6) % 7;
	const monday = new Date(date);
	monday.setHours(0, 0, 0, 0);
	monday.setDate(date.getDate() - day);
	return Array.from({ length: 7 }, (_, index) => {
		const d = new Date(monday);
		d.setDate(monday.getDate() + index);
		return d;
	});
}

export function createDefaultGoals(ownerKey) {
	const weekKey = getWeekKey();
	return {
		ownerKey,
		targets: { ...DEFAULT_TARGETS },
		smartGoals: [],
		activeWeekKey: weekKey,
		updatedAt: new Date().toISOString(),
	};
}

async function readAllGoals() {
	const raw = await AsyncStorage.getItem(GOALS_STORAGE_KEY);
	return raw ? JSON.parse(raw) : [];
}

async function writeAllGoals(list) {
	await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(list));
}

export async function getGoalsForUser(ownerKey) {
	if (!ownerKey) {
		return null;
	}
	const all = await readAllGoals();
	let goals = all.find((item) => item.ownerKey === ownerKey);
	if (!goals) {
		goals = createDefaultGoals(ownerKey);
		await writeAllGoals([goals, ...all]);
	}
	return goals;
}

export async function saveGoalsForUser(ownerKey, patch) {
	if (!ownerKey) {
		throw new Error("Missing owner key");
	}
	const all = await readAllGoals();
	const existing = all.find((item) => item.ownerKey === ownerKey) || createDefaultGoals(ownerKey);
	const next = {
		...existing,
		...patch,
		ownerKey,
		targets: {
			...DEFAULT_TARGETS,
			...(existing.targets || {}),
			...(patch.targets || {}),
		},
		updatedAt: new Date().toISOString(),
	};
	await writeAllGoals([next, ...all.filter((item) => item.ownerKey !== ownerKey)]);
	return next;
}

export async function setPresetTarget(ownerKey, type, days) {
	const clamped = Math.min(MAX_TARGET_DAYS, Math.max(MIN_TARGET_DAYS, Math.round(days)));
	const goals = await getGoalsForUser(ownerKey);
	return saveGoalsForUser(ownerKey, {
		targets: {
			...goals.targets,
			[type]: clamped,
		},
	});
}

export async function setSmartGoals(ownerKey, smartGoals) {
	return saveGoalsForUser(ownerKey, { smartGoals });
}

export async function confirmGoalsForCurrentWeek(ownerKey) {
	return saveGoalsForUser(ownerKey, { activeWeekKey: getWeekKey() });
}

export function needsWeekCarryPrompt(goals) {
	if (!goals) {
		return false;
	}
	return goals.activeWeekKey !== getWeekKey();
}

/**
 * Count unique days this week with each exercise flag from saved sessions.
 */
export async function getWeeklyProgress(ownerKey, referenceDate = new Date()) {
	const weekDates = getWeekDates(referenceDate);
	const start = weekDates[0];
	const end = new Date(weekDates[6]);
	end.setHours(23, 59, 59, 999);

	const sessions = ownerKey ? await getSessionsForUser(ownerKey) : [];
	const inWeek = sessions.filter((session) => {
		const ended = new Date(session.endedAt || session.createdAt);
		return ended >= start && ended <= end;
	});

	const aerobicDays = new Set();
	const balanceDays = new Set();
	const strengthDays = new Set();
	const activeDays = new Set();

	inWeek.forEach((session) => {
		const key = toDateKey(session.endedAt || session.createdAt);
		activeDays.add(key);
		if (session.doneAerobic) aerobicDays.add(key);
		if (session.doneBalance) balanceDays.add(key);
		if (session.doneStrength) strengthDays.add(key);
	});

	const goals = ownerKey ? await getGoalsForUser(ownerKey) : createDefaultGoals("preview");
	const targets = goals?.targets || DEFAULT_TARGETS;

	return {
		weekKey: getWeekKey(referenceDate),
		weekDates,
		activeDayKeys: Array.from(activeDays),
		targets,
		smartGoals: goals?.smartGoals || [],
		needsCarryPrompt: needsWeekCarryPrompt(goals),
		items: [
			{
				key: GOAL_TYPES.AEROBIC,
				doneDays: aerobicDays.size,
				targetDays: targets[GOAL_TYPES.AEROBIC],
			},
			{
				key: GOAL_TYPES.BALANCE,
				doneDays: balanceDays.size,
				targetDays: targets[GOAL_TYPES.BALANCE],
			},
			{
				key: GOAL_TYPES.STRENGTH,
				doneDays: strengthDays.size,
				targetDays: targets[GOAL_TYPES.STRENGTH],
			},
		],
	};
}

export function createSmartGoalId() {
	return `smart_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}
