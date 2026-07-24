// App Upgrade #5: Exercise session records (per-user folder)
import { getUserJson, setUserJson } from "./userStorage";

const LEAF = "exerciseSessions";
const LEGACY_KEY = "exerciseSessions";

// Session shape:
// {
//   id, date (ISO string, completion time), durationSec,
//   mode: "outdoor" | "home",
//   emotion: 1-5, rpe: 0-10,
//   journal: string,
//   exercises: [{ name, reps }],
//   types: { aerobic: bool, balance: bool, muscle: bool },
// }

export const getSessions = async () => {
	const data = await getUserJson(LEAF, [], LEGACY_KEY);
	return Array.isArray(data) ? data : [];
};

export const saveSession = async (session) => {
	const sessions = await getSessions();
	sessions.unshift(session); // newest first
	await setUserJson(LEAF, sessions);
	return sessions;
};

export const deleteSession = async (id) => {
	const sessions = await getSessions();
	const next = sessions.filter((s) => s.id !== id);
	await setUserJson(LEAF, next);
	return next;
};

export const getSessionById = async (id) => {
	const sessions = await getSessions();
	return sessions.find((s) => s.id === id);
};
