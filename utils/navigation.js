import { router } from "expo-router";

/**
 * Enter / return to the main tab app.
 */
export function enterMainApp(path = "/(tabs)") {
	router.replace(path);
}

/**
 * Always return to the home tab.
 * Never use router.back() here — that can pop out to the Start cover.
 */
export function goHome() {
	router.replace("/(tabs)");
}

/**
 * For module entry screens (session hub, outdoor, risk, ...).
 * Always go to home, never pop the root Start cover.
 */
export function goBackOrHome() {
	goHome();
}
