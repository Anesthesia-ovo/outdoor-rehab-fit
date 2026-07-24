import React, { useContext } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import { LocaleContext } from "../../../contexts/LocaleContext";
import { TouchableOpacity } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";

const renderBackButton = () => (
	<TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 8 }}>
		<Ionicons name="chevron-back" size={RFValue(18)} color={"#000"} />
	</TouchableOpacity>
);

export default function SettingLayout() {
	const { i18n } = useContext(LocaleContext);

	return (
		<Stack
			screenOptions={{
				headerShown: false,
			}}
		>
			<Stack.Screen
				name="index"
				options={{
					title: i18n.t("setting"),
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="about"
				options={{
					title: i18n.t("aboutApp"),
					headerShown: true,
					headerLeft: renderBackButton,
				}}
			/>
			<Stack.Screen
				name="disclaimer"
				options={{
					title: i18n.t("settingDisclaimer"),
					headerShown: true,
					headerLeft: renderBackButton,
				}}
			/>
			<Stack.Screen
				name="info"
				options={{
					title: i18n.t("aboutTeam"),
					headerShown: true,
					headerLeft: renderBackButton,
				}}
			/>
		</Stack>
	);
}
