// App Upgrade #6: Goal setting and progress checking (per-user folder)
import { getUserJson, setUserJson } from "./userStorage";
import { getWeekKey, toDateKey } from "./dates";
import { getSessions } from "./sessions";

const LEAF = "goalSettings";
const LEGACY_KEY = "goalSettings";

// WHO-inspired defaults: days per week for each exercise type
export const DEFAULT_GOALS = {
	aerobic: 5,
	balance: 3,
	muscle: 2,
};

const DEFAULT_STATE = {
	targets: { ...DEFAULT_GOALS },
	smartGoals: [], // [{ id, text, weekKey, done }]
};

export const getGoalState = async () => {
	const raw = await getUserJson(LEAF, null, LEGACY_KEY);
	if (!raw) return { ...DEFAULT_STATE, targets: { ...DEFAULT_GOALS } };
	return { ...DEFAULT_STATE, ...raw, targets: { ...DEFAULT_GOALS, ...(raw.targets || {}) } };
};

export const saveGoalState = async (state) => {
	await setUserJson(LEAF, state);
};

export const setTarget = async (type, days) => {
	const state = await getGoalState();
	state.targets[type] = days;
	await saveGoalState(state);
	return state;
};

export const addSmartGoal = async (text) => {
	const state = await getGoalState();
	state.smartGoals.push({ id: Date.now().toString(), text, weekKey: getWeekKey(), done: false });
	await saveGoalState(state);
	return state;
};

export const toggleSmartGoal = async (id) => {
	const state = await getGoalState();
	const goal = state.smartGoals.find((g) => g.id === id);
	if (goal) goal.done = !goal.done;
	await saveGoalState(state);
	return state;
};

export const removeSmartGoal = async (id) => {
	const state = await getGoalState();
	state.smartGoals = state.smartGoals.filter((g) => g.id !== id);
	await saveGoalState(state);
	return state;
};

// Keep the same goals for the following week: re-tag last week's goals to this week
export const carryOverSmartGoals = async () => {
	const state = await getGoalState();
	const thisWeek = getWeekKey();
	state.smartGoals = state.smartGoals.map((g) => (g.weekKey !== thisWeek ? { ...g, weekKey: thisWeek, done: false } : g));
	await saveGoalState(state);
	return state;
};

export const getCurrentWeekSmartGoals = (state) => {
	const thisWeek = getWeekKey();
	return state.smartGoals.filter((g) => g.weekKey === thisWeek);
};

export const getPastWeekSmartGoals = (state) => {
	const thisWeek = getWeekKey();
	return state.smartGoals.filter((g) => g.weekKey !== thisWeek);
};

// Weekly progress: for each type, count distinct days this week with a session of that type
export const getWeeklyProgress = async () => {
	const [state, sessions] = await Promise.all([getGoalState(), getSessions()]);
	const thisWeek = getWeekKey();
	const daysByType = { aerobic: new Set(), balance: new Set(), muscle: new Set() };
	sessions.forEach((s) => {
		if (getWeekKey(new Date(s.date)) !== thisWeek) return;
		const day = toDateKey(new Date(s.date));
		["aerobic", "balance", "muscle"].forEach((type) => {
			if (s.types && s.types[type]) daysByType[type].add(day);
		});
	});
	return {
		targets: state.targets,
		progress: {
			aerobic: daysByType.aerobic.size,
			balance: daysByType.balance.size,
			muscle: daysByType.muscle.size,
		},
	};
};
