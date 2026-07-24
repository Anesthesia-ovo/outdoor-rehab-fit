// Per-user bookmarks for outdoor equipment
import { getUserJson, setUserJson } from "./userStorage";

const LEAF = "bookmarkedItems";
const LEGACY_KEY = "bookmarkedItems";

export const getBookmarks = async () => {
	const data = await getUserJson(LEAF, {}, LEGACY_KEY);
	return data && typeof data === "object" ? data : {};
};

export const saveBookmarks = async (bookmarks) => {
	await setUserJson(LEAF, bookmarks);
};
