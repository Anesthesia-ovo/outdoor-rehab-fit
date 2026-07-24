import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AUTH_STORAGE_KEY } from "../constants/auth";

/**
 * After login / register / guest:
 * - from settings: return to settings
 * - otherwise: enter main tabs (onboarding already completed before login in this app)
 */
export async function navigateAfterAuth(from) {
	if (from === "settings") {
		router.replace("/(tabs)/setting");
		return;
	}

	router.replace("/(tabs)");
}

/** Clear first-launch flags + auth session (for retesting Start / disclaimer). */
export async function clearOnboardingFlags() {
	await AsyncStorage.multiRemove(["userAgreed", "safetyResponse", AUTH_STORAGE_KEY]);
}
