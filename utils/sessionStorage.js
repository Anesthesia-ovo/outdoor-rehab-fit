import AsyncStorage from "@react-native-async-storage/async-storage";

export const SESSIONS_STORAGE_KEY = "exerciseSessions";

export function formatDuration(totalSeconds) {
	const safe = Math.max(0, Math.floor(totalSeconds || 0));
	const minutes = Math.floor(safe / 60);
	const seconds = safe % 60;
	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatDateTime(isoString, locale = "zh") {
	if (!isoString) {
		return "-";
	}
	const date = new Date(isoString);
	return date.toLocaleString(locale === "en" ? "en-HK" : "zh-HK", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export async function getAllSessions() {
	const raw = await AsyncStorage.getItem(SESSIONS_STORAGE_KEY);
	const sessions = raw ? JSON.parse(raw) : [];
	return sessions.sort((a, b) => new Date(b.endedAt) - new Date(a.endedAt));
}

export async function getSessionsForUser(ownerKey) {
	const sessions = await getAllSessions();
	if (!ownerKey) {
		return sessions;
	}
	return sessions.filter((session) => session.ownerKey === ownerKey);
}

export async function getSessionById(id) {
	const sessions = await getAllSessions();
	return sessions.find((session) => session.id === id) || null;
}

export async function saveSession(session) {
	const sessions = await getAllSessions();
	const next = [session, ...sessions.filter((item) => item.id !== session.id)];
	await AsyncStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(next));
	return session;
}

export async function deleteSession(id) {
	const sessions = await getAllSessions();
	const next = sessions.filter((session) => session.id !== id);
	await AsyncStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(next));
}

export function createSessionId() {
	return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getOwnerKey(user) {
	if (!user || user.role === "guest") {
		return null;
	}
	return user.phone || user.email || user.name || "user";
}
