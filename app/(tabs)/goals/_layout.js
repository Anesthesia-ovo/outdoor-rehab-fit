import React, { useContext } from "react";
import { Stack } from "expo-router";
import { LocaleContext } from "../../../contexts/LocaleContext";
import HeaderBackButton from "../../../components/HeaderBackButton";

const stackScreenOptions = {
	headerShown: true,
	gestureEnabled: true,
	fullScreenGestureEnabled: true,
	animation: "slide_from_right",
	headerBackTitleVisible: false,
};

export default function GoalsLayout() {
	const { i18n } = useContext(LocaleContext);

	return (
		<Stack screenOptions={stackScreenOptions}>
			<Stack.Screen
				name="index"
				options={{
					title: i18n.t("goalHubTitle"),
					headerLeft: () => <HeaderBackButton />,
					gestureEnabled: false,
					fullScreenGestureEnabled: false,
				}}
			/>
			<Stack.Screen name="edit-preset" options={{ title: i18n.t("goalEditTargetTitle") }} />
			<Stack.Screen name="smart" options={{ title: i18n.t("goalSmartTitle") }} />
		</Stack>
	);
}
