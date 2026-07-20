export const FEATURES = {
	OUTDOOR_EQUIPMENT: "outdoor_equipment",
	OUTDOOR_AUDIO_VIDEO: "outdoor_audio_video",
	OUTDOOR_FULL_DETAIL: "outdoor_full_detail",
	RISK: "risk",
	LOCATION: "location",
	RESEARCH: "research",
	FAVORITE: "favorite",
	BOOKMARK: "bookmark",
};

const GUEST_FEATURES = new Set([FEATURES.OUTDOOR_EQUIPMENT, FEATURES.OUTDOOR_AUDIO_VIDEO]);

export function canAccess(feature, isGuest) {
	if (!isGuest) {
		return true;
	}
	return GUEST_FEATURES.has(feature);
}
