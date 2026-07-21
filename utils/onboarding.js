import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { enterMainApp } from "./navigation";

/**
 * After login / register / guest:
 * always enter the disclaimer page first (except when upgrading from Settings).
 */
export async function navigateAfterAuth(from) {
	if (from === "settings") {
		enterMainApp("/(tabs)/setting");
		return;
	}

	router.replace("/firstdisclaimer");
}

export async function clearOnboardingFlags() {
	await AsyncStorage.multiRemove(["userAgreed", "safetyResponse"]);
}
