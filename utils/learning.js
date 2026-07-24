// App Upgrade #10: Learning progress - whether the user read / watched / listened
// to the education materials of each equipment (shown in "My favorite")
// Stored in per-user folder.
import { getUserJson, setUserJson } from "./userStorage";

const LEAF = "learningProgress";
const LEGACY_KEY = "learningProgress";

// { [equipmentId]: { read: bool, watched: bool, listened: bool } }
export const getLearningProgress = async () => {
	const data = await getUserJson(LEAF, {}, LEGACY_KEY);
	return data && typeof data === "object" ? data : {};
};

export const markLearning = async (equipmentId, field) => {
	const progress = await getLearningProgress();
	const id = String(equipmentId);
	progress[id] = { read: false, watched: false, listened: false, ...progress[id], [field]: true };
	await setUserJson(LEAF, progress);
	return progress;
};

export const markRead = (id) => markLearning(id, "read");
export const markWatched = (id) => markLearning(id, "watched");
export const markListened = (id) => markLearning(id, "listened");
