import { Alert } from "react-native";
import { router } from "expo-router";
import { canAccess } from "../constants/permissions";

export function showGuestRestrictionAlert(i18n) {
	Alert.alert(i18n.t("guestRestrictedTitle"), i18n.t("guestRestrictedMessage"), [
		{ text: i18n.t("cancel"), style: "cancel" },
		{
			text: i18n.t("loginNow"),
			onPress: () => router.push({ pathname: "/login", params: { from: "settings" } }),
		},
	]);
}

export function guardGuestAccess(feature, isGuest, i18n, onAllowed) {
	if (canAccess(feature, isGuest)) {
		onAllowed();
		return true;
	}

	showGuestRestrictionAlert(i18n);
	return false;
}
