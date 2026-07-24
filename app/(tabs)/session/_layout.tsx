import React, { useContext } from "react";
import { Stack, router } from "expo-router";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { LocaleContext } from "../../../contexts/LocaleContext";

const renderBackButton = () => (
	<TouchableOpacity onPress={() => router.navigate("/(tabs)")}>
		<Ionicons name="chevron-back" size={RFValue(18)} color={"#000"} />
	</TouchableOpacity>
);

export default function SessionLayout() {
	const { i18n } = useContext(LocaleContext) as any;
	return (
		<Stack>
			<Stack.Screen name="index" options={{ headerShown: true, title: i18n.t("sessionRecord"), headerLeft: renderBackButton }} />
			<Stack.Screen name="summary" options={{ headerShown: true, title: i18n.t("sessionSummary"), headerBackVisible: false, gestureEnabled: false }} />
		</Stack>
	);
}
