// App Upgrade #4: display of the recorded app usage data
import React, { useCallback, useContext, useState } from "react";
import { StyleSheet, View, Text, ScrollView } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { LocaleContext } from "../../../contexts/LocaleContext";
import { getUsageStats } from "../../../utils/usage";

const UsageStats = () => {
	const { i18n } = useContext(LocaleContext);
	const [stats, setStats] = useState(null);

	useFocusEffect(
		useCallback(() => {
			getUsageStats().then(setStats);
		}, [])
	);

	if (!stats) return null;

	const rows = [
		{ icon: "calendar", labelKey: "usageDaysUsed", value: stats.usageDays.length, unitKey: "days", color: "#2E8B57" },
		{ icon: "log-in", labelKey: "usageLoginEvents", value: stats.loginEvents, unitKey: "times", color: "#007BFF" },
		{ icon: "book", labelKey: "usageIntroLoads", value: stats.introLoads, unitKey: "times", color: "#E9A23B" },
		{ icon: "volume-high", labelKey: "usageAudioPlays", value: stats.audioPlays, unitKey: "times", color: "#9B59B6" },
		{ icon: "trophy", labelKey: "usageGoalsAchieved", value: stats.goalsAchieved, unitKey: "times", color: "#840B1C" },
		{ icon: "leaf", labelKey: "usageOutdoorSessions", value: stats.outdoorSessions, unitKey: "times", color: "#27AE60" },
		{ icon: "home", labelKey: "usageHomeSessions", value: stats.homeSessions, unitKey: "times", color: "#3498DB" },
		{ icon: "chatbubble-ellipses", labelKey: "usageTtsPlays", value: stats.ttsPlays, unitKey: "times", color: "#E67E22" },
	];

	return (
		<ScrollView style={styles.container} contentContainerStyle={{ padding: wp("5%"), paddingBottom: hp("15%") }}>
			{rows.map((row) => (
				<View key={row.labelKey} style={styles.card}>
					<View style={[styles.iconCircle, { backgroundColor: row.color }]}>
						<Ionicons name={row.icon} size={RFValue(22)} color="#fff" />
					</View>
					<Text style={styles.label}>{i18n.t(row.labelKey)}</Text>
					<View style={styles.valueBox}>
						<Text style={[styles.value, { color: row.color }]}>{row.value}</Text>
						<Text style={styles.unit}>{i18n.t(row.unitKey)}</Text>
					</View>
				</View>
			))}
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	card: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#f8f9fa",
		borderRadius: 14,
		padding: 16,
		marginBottom: 12,
	},
	iconCircle: {
		width: RFValue(44),
		height: RFValue(44),
		borderRadius: RFValue(22),
		justifyContent: "center",
		alignItems: "center",
	},
	label: {
		flex: 1,
		fontSize: RFValue(14),
		color: "#333",
		marginLeft: 12,
		marginRight: 8,
	},
	valueBox: {
		alignItems: "center",
	},
	value: {
		fontSize: RFValue(22),
		fontWeight: "bold",
	},
	unit: {
		fontSize: RFValue(11),
		color: "#888",
	},
});

export default UsageStats;
