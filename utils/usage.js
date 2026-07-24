// App Upgrade #4: App usage data tracking (per-user folder)
import { getUserJson, setUserJson } from "./userStorage";
import { toDateKey } from "./dates";

const LEAF = "usageStats";
const LEGACY_KEY = "usageStats";

const DEFAULT_STATS = {
	usageDays: [], // list of "YYYY-MM-DD" where the main page was loaded at least once
	loginEvents: 0, // number of log-in events
	introLoads: 0, // number of times an exercise introduction page is loaded
	audioPlays: 0, // number of times an audio recording is played
	goalsAchieved: 0, // number of times preset/WHO goals are achieved
	outdoorSessions: 0, // completed outdoor practical sessions
	homeSessions: 0, // completed home practical sessions
	ttsPlays: 0, // number of times text-to-speech is used
};

export const getUsageStats = async () => {
	const raw = await getUserJson(LEAF, null, LEGACY_KEY);
	return raw ? { ...DEFAULT_STATS, ...raw } : { ...DEFAULT_STATS };
};

const saveStats = async (stats) => {
	try {
		await setUserJson(LEAF, stats);
	} catch (e) {
		// non-fatal
	}
};

// Record that the app was used today (call when home page loads)
export const trackUsageDay = async () => {
	const stats = await getUsageStats();
	const today = toDateKey();
	if (!stats.usageDays.includes(today)) {
		stats.usageDays.push(today);
		await saveStats(stats);
	}
};

export const trackCounter = async (counterName, amount = 1) => {
	const stats = await getUsageStats();
	stats[counterName] = (stats[counterName] || 0) + amount;
	await saveStats(stats);
};

export const trackLoginEvent = () => trackCounter("loginEvents");
export const trackIntroLoad = () => trackCounter("introLoads");
export const trackAudioPlay = () => trackCounter("audioPlays");
export const trackGoalAchieved = (n = 1) => trackCounter("goalsAchieved", n);
export const trackSessionCompleted = (mode) => trackCounter(mode === "home" ? "homeSessions" : "outdoorSessions");
export const trackTtsPlay = () => trackCounter("ttsPlays");
