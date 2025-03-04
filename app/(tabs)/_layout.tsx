import React, { useContext } from "react";
import { Platform, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";

import { RFValue } from "react-native-responsive-fontsize";

import { LocaleContext } from "../../contexts/LocaleContext";

import { Tabs, router } from "expo-router";

const renderBackButton = () => (
	<TouchableOpacity onPress={() => router.back()}>
		<Ionicons name="chevron-back" size={RFValue(18)} color={"#000"} />
	</TouchableOpacity>
);

export default function TabLayout() {
	const { i18n } = useContext(LocaleContext);
	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: Colors["light"].tint,
				headerShown: false,
				tabBarButton: HapticTab,
				tabBarBackground: TabBarBackground,
				tabBarStyle: Platform.select({
					ios: {
						// Use a transparent background on iOS to show the blur effect
						position: "absolute",
						height: 100,
					},
					default: {
						height: 100,
					},
				}),
				tabBarLabelStyle: {
					fontSize: 18, // Increase font size for better readability
					marginTop: 3, // Adjust margin to position the label
				},
				tabBarIconStyle: {
					marginTop: 12, // Adjust margin to position the icon
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: i18n.t("home"),
					tabBarIcon: ({ color }) => <IconSymbol size={32} name="house.fill" color={color} />,
				}}
			/>
			<Tabs.Screen
				name="favorite"
				options={{
					title: i18n.t("favorite"),
					headerShown: true,
					tabBarIcon: ({ color }) => <MaterialIcons size={32} name="favorite" color={color} />,
				}}
			/>
			<Tabs.Screen
				name="setting"
				options={{
					title: i18n.t("setting"),
					headerTitle: i18n.t("setting"),
					tabBarIcon: ({ color }) => <MaterialIcons size={32} name="settings" color={color} />,
					headerShown: true,
					headerLeft: renderBackButton,
				}}
			/>
			<Tabs.Screen name="risk" options={{ href: null }} />
			<Tabs.Screen name="outdoor" options={{ href: null }} />
			<Tabs.Screen name="location" options={{ href: null }} />
			<Tabs.Screen name="research" options={{ href: null }} />
		</Tabs>
	);
}
