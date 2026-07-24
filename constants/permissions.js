export const FEATURES = {
	OUTDOOR_EQUIPMENT: "outdoor_equipment",
	OUTDOOR_AUDIO_VIDEO: "outdoor_audio_video",
	RISK: "risk",
	LOCATION: "location",
	RESEARCH: "research",
	FAVORITE: "favorite",
	SESSION_RECORD: "session_record",
	SESSION_LOG: "session_log",
	GOAL_SETTING: "goal_setting",
	GROUP_CHAT: "group_chat",
	EQUIPMENT_MAP: "equipment_map",
	USAGE_STATS: "usage_stats",
};

// Guests may only browse outdoor equipment (with partial audio/video already limited elsewhere)
const GUEST_FEATURES = new Set([FEATURES.OUTDOOR_EQUIPMENT, FEATURES.OUTDOOR_AUDIO_VIDEO]);

export function canAccess(feature, isGuest) {
	if (!isGuest) {
		return true;
	}
	return GUEST_FEATURES.has(feature);
}
