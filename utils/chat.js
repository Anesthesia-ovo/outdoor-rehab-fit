// App Upgrade #7: custom SMS/group chat storage + #8 chatbot (FAQ) logic
// Group messages are shared on-device (not per-user), matching a local group demo.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getWeekKey, getWeekStart } from "./dates";
import { FAQ_DATA } from "../constants/FaqData";

const KEY = "groupChatMessages";
const BOT_WEEK_KEY = "chatbotMondayWeek";
const PROGRAMME_START_KEY = "programmeStartWeek";
const LEGACY_AI_WEEK_KEY = "aiAssistantTipWeek";

// Message shape:
// { id, sender: "me" | "bot" | "staff", senderName, type: "text" | "image" | "session",
//   text, imageUri, reactions: { [emoji]: count }, timestamp }

export const getMessages = async () => {
	try {
		let raw = await AsyncStorage.getItem(KEY);
		if (raw == null) {
			const keys = await AsyncStorage.getAllKeys();
			const legacyKey =
				keys.find((k) => k === "aiAssistantMessages") ||
				keys.find((k) => k.endsWith("/aiAssistantMessages"));
			if (legacyKey) {
				raw = await AsyncStorage.getItem(legacyKey);
				if (raw != null) {
					await AsyncStorage.setItem(KEY, raw);
				}
			}
		}
		return raw ? JSON.parse(raw) : [];
	} catch (e) {
		return [];
	}
};

export const saveMessages = async (messages) => {
	await AsyncStorage.setItem(KEY, JSON.stringify(messages));
};

export const appendMessage = async (message) => {
	const messages = await getMessages();
	messages.push({
		reactions: {},
		...message,
		id: message.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
	});
	await saveMessages(messages);
	return messages;
};

export const addReaction = async (messageId, emoji) => {
	const messages = await getMessages();
	const msg = messages.find((m) => m.id === messageId);
	if (msg) {
		msg.reactions = msg.reactions || {};
		msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1;
	}
	await saveMessages(messages);
	return messages;
};

// #8 Group leader role: post the Monday-morning instruction once per week
export const ensureWeeklyBotMessage = async (i18n) => {
	const thisWeek = getWeekKey();
	let [sentWeek, startWeekRaw] = await Promise.all([
		AsyncStorage.getItem(BOT_WEEK_KEY),
		AsyncStorage.getItem(PROGRAMME_START_KEY),
	]);

	if (!sentWeek) {
		sentWeek = await AsyncStorage.getItem(LEGACY_AI_WEEK_KEY);
	}

	let startWeek = startWeekRaw;
	if (!startWeek) {
		startWeek = thisWeek;
		await AsyncStorage.setItem(PROGRAMME_START_KEY, startWeek);
	}

	if (sentWeek === thisWeek) return null;

	const weekDiff = Math.round((getWeekStart(new Date()) - new Date(startWeek)) / (7 * 24 * 60 * 60 * 1000)) + 1;
	const text = `${i18n.locale === "zh" ? `第${weekDiff}週` : `This is Week ${weekDiff}`}. ${i18n.t("mondayMessage")}`;

	await appendMessage({
		sender: "bot",
		senderName: i18n.t("chatbotName"),
		type: "text",
		text,
		timestamp: new Date().toISOString(),
	});
	await AsyncStorage.setItem(BOT_WEEK_KEY, thisWeek);
	return text;
};

// #8 Enquiry handler: keyword matching against the FAQ dataset
export const getBotReply = (userText, locale) => {
	const lower = userText.toLowerCase();
	let best = null;
	let bestScore = 0;
	FAQ_DATA.forEach((faq) => {
		const score = faq.keywords.reduce((acc, kw) => (lower.includes(kw.toLowerCase()) ? acc + 1 : acc), 0);
		if (score > bestScore) {
			bestScore = score;
			best = faq;
		}
	});
	if (best && bestScore > 0) {
		return locale === "zh" ? best.answerZh : best.answerEn;
	}
	return null;
};
