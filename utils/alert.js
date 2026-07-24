// Cross-platform alert: React Native's Alert is a no-op on web,
// so use window.alert / window.confirm there to keep callbacks working.
import { Alert, Platform } from "react-native";

export const showAlert = (title, message, buttons) => {
	const btns = buttons && buttons.length ? buttons : [{ text: "OK" }];
	if (Platform.OS !== "web") {
		Alert.alert(title, message, btns);
		return;
	}
	const text = [title, message].filter(Boolean).join("\n");
	if (btns.length <= 1) {
		window.alert(text);
		btns[0]?.onPress?.();
		return;
	}
	const cancelBtn = btns.find((b) => b.style === "cancel");
	const confirmBtn = btns.find((b) => b !== cancelBtn) || btns[btns.length - 1];
	const ok = window.confirm(text);
	if (ok) {
		confirmBtn?.onPress?.();
	} else {
		cancelBtn?.onPress?.();
	}
};
