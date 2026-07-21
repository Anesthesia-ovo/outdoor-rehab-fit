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

export default function SessionLayout() {
	const { i18n } = useContext(LocaleContext);

	return (
		<Stack screenOptions={stackScreenOptions}>
			<Stack.Screen
				name="index"
				options={{
					title: i18n.t("sessionHubTitle"),
					headerLeft: () => <HeaderBackButton />,
					// Root of this stack: disable swipe so it won't pop out to Start cover
					gestureEnabled: false,
					fullScreenGestureEnabled: false,
				}}
			/>
			<Stack.Screen name="timer" options={{ title: i18n.t("sessionTimerTitle") }} />
			<Stack.Screen name="summary" options={{ title: i18n.t("sessionSummaryTitle") }} />
			<Stack.Screen name="log" options={{ title: i18n.t("sessionLog") }} />
			<Stack.Screen name="detail" options={{ title: i18n.t("sessionDetailTitle") }} />
		</Stack>
	);
}
