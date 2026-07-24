// App Upgrade #11: Text to Speech — Chinese content is read in Cantonese (粵語)
import React, { useEffect, useState } from "react";
import { TouchableOpacity, Text, StyleSheet, Platform } from "react-native";
import * as Speech from "expo-speech";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { trackTtsPlay } from "../utils/usage";
import { ensurePlaybackAudioMode } from "../utils/audioMode";

/** iOS / Android Cantonese voice name hints */
const CANTONESE_NAME_HINTS = [
	"sinji", // iOS 粵語女聲
	"meijia", // iOS 粵語女聲
	"cantonese",
	"yue",
	"hong kong",
	"hongkong",
	"粵",
	"广东",
	"廣東",
];

function isCantoneseVoice(voice) {
	const lang = (voice.language || "").toLowerCase();
	const name = `${voice.name || ""} ${voice.identifier || ""}`.toLowerCase();

	if (lang === "yue-hk" || lang === "zh-hk" || lang.startsWith("yue")) {
		return true;
	}
	// zh-HK is usually Cantonese on Apple devices
	if (lang.includes("hk") && lang.startsWith("zh")) {
		return true;
	}
	return CANTONESE_NAME_HINTS.some((hint) => name.includes(hint));
}

async function resolveSpeechOptions(locale) {
	// English UI → English TTS; Chinese UI → always prefer Cantonese
	if (locale !== "zh") {
		return resolveEnglishOptions();
	}

	try {
		const voices = (await Speech.getAvailableVoicesAsync()) || [];

		// 1) Explicit Cantonese voices first
		const cantonese = voices.find(isCantoneseVoice);
		if (cantonese) {
			return { language: cantonese.language || "zh-HK", voice: cantonese.identifier };
		}

		// 2) Language-code preference order for 粵語
		for (const lang of ["yue-HK", "yue", "zh-HK"]) {
			const match = voices.find((v) => (v.language || "").toLowerCase() === lang.toLowerCase());
			if (match) {
				return { language: match.language, voice: match.identifier };
			}
		}

		// 3) Any Hong Kong tagged voice
		const hk = voices.find((v) => /hk/i.test(v.language || "") || /hk/i.test(v.identifier || ""));
		if (hk) {
			return { language: hk.language, voice: hk.identifier };
		}
	} catch (e) {
		console.warn("getAvailableVoicesAsync failed", e);
	}

	// Force Cantonese locale even if no voice list is returned
	return { language: "zh-HK" };
}

async function resolveEnglishOptions() {
	const preferred = ["en-US", "en-GB", "en-AU", "en"];
	try {
		const voices = (await Speech.getAvailableVoicesAsync()) || [];
		for (const lang of preferred) {
			const match = voices.find((v) => (v.language || "").toLowerCase().startsWith(lang.toLowerCase()));
			if (match) {
				return { language: match.language, voice: match.identifier };
			}
		}
	} catch (e) {
		// ignore
	}
	return { language: "en-US" };
}

const TTSButton = ({ text, locale, i18n, onPlay }) => {
	const [speaking, setSpeaking] = useState(false);

	useEffect(() => {
		ensurePlaybackAudioMode();
		return () => {
			Speech.stop();
		};
	}, []);

	const handlePress = async () => {
		if (speaking) {
			await Speech.stop();
			setSpeaking(false);
			return;
		}

		const content = (text || "").trim();
		if (!content) return;

		try {
			await ensurePlaybackAudioMode();
			setSpeaking(true);
			trackTtsPlay();
			if (onPlay) onPlay();

			const options = await resolveSpeechOptions(locale);
			Speech.speak(content, {
				...options,
				// Slightly slower helps Cantonese clarity
				rate: Platform.OS === "ios" ? 0.88 : 0.92,
				pitch: 1.0,
				onStart: () => setSpeaking(true),
				onDone: () => setSpeaking(false),
				onStopped: () => setSpeaking(false),
				onError: (err) => {
					console.warn("Speech error", err);
					setSpeaking(false);
				},
			});
		} catch (error) {
			console.warn("TTS failed", error);
			setSpeaking(false);
		}
	};

	return (
		<TouchableOpacity style={[styles.button, speaking && styles.buttonActive]} onPress={handlePress}>
			<Ionicons name={speaking ? "stop-circle" : "volume-high"} size={RFValue(20)} color="#fff" />
			<Text style={styles.text}>{speaking ? i18n.t("stopReading") : i18n.t("readAloud")}</Text>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	button: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#2E8B57",
		borderRadius: 25,
		paddingVertical: 12,
		paddingHorizontal: 20,
		gap: 8,
	},
	buttonActive: {
		backgroundColor: "#B00020",
	},
	text: {
		color: "#fff",
		fontSize: RFValue(14),
		fontWeight: "bold",
		marginLeft: 6,
	},
});

export default TTSButton;
