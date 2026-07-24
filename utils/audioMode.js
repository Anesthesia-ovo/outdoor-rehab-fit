import { Platform } from "react-native";
import { setAudioModeAsync } from "expo-audio";

let configured = false;

/**
 * Ensure audio plays even when the iPhone silent switch is on.
 * Call once at app start and again before playback/TTS.
 */
export async function ensurePlaybackAudioMode() {
	try {
		if (Platform.OS === "ios") {
			await setAudioModeAsync({
				playsInSilentMode: true,
				shouldPlayInBackground: false,
				interruptionMode: "mixWithOthers",
				allowsRecording: false,
			});
		} else {
			await setAudioModeAsync({
				shouldPlayInBackground: false,
				interruptionMode: "duckOthers",
			});
		}
		configured = true;
	} catch (error) {
		console.warn("Failed to configure audio mode", error);
	}
}

export function isAudioModeConfigured() {
	return configured;
}
