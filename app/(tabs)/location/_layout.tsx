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

export default function LocationLayout() {
	const { i18n } = useContext(LocaleContext);

	return (
		<Stack screenOptions={stackScreenOptions}>
			<Stack.Screen
				name="index"
				options={{
					title: i18n.t("location"),
					headerLeft: () => <HeaderBackButton />,
					gestureEnabled: false,
					fullScreenGestureEnabled: false,
				}}
			/>
		</Stack>
	);
}
