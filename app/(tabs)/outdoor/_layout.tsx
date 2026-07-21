import React, { useContext } from "react";
import { Stack } from "expo-router";
import { LocaleContext } from "../../../contexts/LocaleContext";
import HeaderBackButton from "../../../components/HeaderBackButton";

const stackScreenOptions = {
	gestureEnabled: true,
	fullScreenGestureEnabled: true,
	animation: "slide_from_right",
	headerBackTitleVisible: false,
};

export default function OutdoorLayout() {
	const { i18n } = useContext(LocaleContext);

	return (
		<Stack screenOptions={stackScreenOptions}>
			<Stack.Screen
				name="index"
				options={{
					headerShown: true,
					title: i18n.t("outdoor"),
					headerLeft: () => <HeaderBackButton />,
					gestureEnabled: false,
					fullScreenGestureEnabled: false,
				}}
			/>
			<Stack.Screen name="list" options={{ headerShown: true, title: i18n.t("outdoor") }} />
			<Stack.Screen name="detail" options={{ headerShown: true, title: i18n.t("outdoor") }} />
		</Stack>
	);
}
