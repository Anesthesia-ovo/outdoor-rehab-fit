import React, { useContext } from "react";
import { Stack } from "expo-router";
import { LocaleContext } from "../../../contexts/LocaleContext";

const stackScreenOptions = {
	headerShown: true,
	gestureEnabled: true,
	fullScreenGestureEnabled: true,
	animation: "slide_from_right",
	headerBackTitleVisible: false,
};

export default function SettingLayout() {
	const { i18n } = useContext(LocaleContext);

	return (
		<Stack screenOptions={stackScreenOptions}>
			<Stack.Screen
				name="index"
				options={{
					headerShown: false,
					title: i18n.t("setting"),
				}}
			/>
			<Stack.Screen name="about" options={{ title: i18n.t("aboutApp") }} />
			<Stack.Screen name="disclaimer" options={{ title: i18n.t("settingDisclaimer") }} />
			<Stack.Screen name="info" options={{ title: i18n.t("aboutTeam") }} />
		</Stack>
	);
}
