// App Upgrade #6: Goal setting - 3 preset weekly goals + SMART goal entry
import React, { useCallback, useContext, useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { LocaleContext } from "../../../contexts/LocaleContext";
import { getGoalState, setTarget, getWeeklyProgress, getCurrentWeekSmartGoals } from "../../../utils/goals";

const TYPES = [
	{ key: "aerobic", labelKey: "aerobicGoal", icon: "run", color: "#F0E4C2" },
	{ key: "balance", labelKey: "balanceGoal", icon: "scale-balance", color: "#F2CCC0" },
	{ key: "muscle", labelKey: "muscleGoal", icon: "arm-flex", color: "#E8CCB0" },
];

const GoalSetting = () => {
	const { i18n } = useContext(LocaleContext);
	const [targets, setTargets] = useState({ aerobic: 5, balance: 3, muscle: 2 });
	const [progress, setProgress] = useState({ aerobic: 0, balance: 0, muscle: 0 });
	const [smartCount, setSmartCount] = useState(0);
	const [expanded, setExpanded] = useState(null);

	const load = useCallback(async () => {
		const [state, weekly] = await Promise.all([getGoalState(), getWeeklyProgress()]);
		setTargets(state.targets);
		setProgress(weekly.progress);
		setSmartCount(getCurrentWeekSmartGoals(state).length);
	}, []);

	useFocusEffect(
		useCallback(() => {
			load();
		}, [load])
	);

	const adjust = async (type, delta) => {
		const next = Math.min(7, Math.max(1, targets[type] + delta));
		setTargets({ ...targets, [type]: next });
		await setTarget(type, next);
	};

	return (
		<ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: hp("15%") }}>
			<Text style={styles.sectionTitle}>{i18n.t("presetGoals")}</Text>
			<Text style={styles.hint}>{i18n.t("adjustTarget")}</Text>

			{TYPES.map((type) => {
				const isOpen = expanded === type.key;
				return (
					<View key={type.key} style={[styles.card, { backgroundColor: type.color }]}>
						<TouchableOpacity style={styles.cardHeader} onPress={() => setExpanded(isOpen ? null : type.key)}>
							<MaterialCommunityIcons name={type.icon} size={RFValue(28)} color="#333" />
							<View style={{ flex: 1, marginLeft: 12 }}>
								<Text style={styles.cardTitle}>{i18n.t(type.labelKey)}</Text>
								<Text style={styles.cardSub}>
									{targets[type.key]} {i18n.t("daysPerWeek")}
								</Text>
							</View>
							<Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={RFValue(20)} color="#333" />
						</TouchableOpacity>
						{isOpen && (
							<View style={styles.stepperRow}>
								<Text style={styles.stepperLabel}>{i18n.t("targetDays")}</Text>
								<View style={styles.stepper}>
									<TouchableOpacity style={styles.stepBtn} onPress={() => adjust(type.key, -1)}>
										<Ionicons name="remove" size={RFValue(22)} color="#fff" />
									</TouchableOpacity>
									<Text style={styles.stepValue}>{targets[type.key]}</Text>
									<TouchableOpacity style={styles.stepBtn} onPress={() => adjust(type.key, 1)}>
										<Ionicons name="add" size={RFValue(22)} color="#fff" />
									</TouchableOpacity>
								</View>
							</View>
						)}
					</View>
				);
			})}

			<TouchableOpacity style={[styles.card, styles.smartCard]} onPress={() => router.push("/goals/smart")}>
				<View style={styles.cardHeader}>
					<MaterialCommunityIcons name="bullseye-arrow" size={RFValue(28)} color="#fff" />
					<View style={{ flex: 1, marginLeft: 12 }}>
						<Text style={[styles.cardTitle, { color: "#fff" }]}>{i18n.t("smartGoal")}</Text>
						<Text style={[styles.cardSub, { color: "#f2f2f2" }]}>
							{smartCount > 0 ? i18n.t("smartGoals") : i18n.t("noSmartGoals")}
						</Text>
					</View>
					<Ionicons name="chevron-forward" size={RFValue(20)} color="#fff" />
				</View>
			</TouchableOpacity>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
		paddingHorizontal: wp("5%"),
	},
	sectionTitle: {
		fontSize: RFValue(20),
		fontWeight: "bold",
		marginTop: hp("2%"),
		color: "#333",
	},
	hint: {
		fontSize: RFValue(13),
		color: "#888",
		marginTop: 4,
		marginBottom: hp("1.5%"),
	},
	card: {
		borderRadius: 14,
		padding: 16,
		marginBottom: hp("1.5%"),
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 4,
		elevation: 3,
	},
	cardHeader: {
		flexDirection: "row",
		alignItems: "center",
	},
	cardTitle: {
		fontSize: RFValue(17),
		fontWeight: "bold",
		color: "#333",
	},
	cardSub: {
		fontSize: RFValue(13),
		color: "#555",
		marginTop: 2,
	},
	stepperRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginTop: 16,
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: "rgba(0,0,0,0.1)",
	},
	stepperLabel: {
		fontSize: RFValue(14),
		color: "#333",
		fontWeight: "600",
	},
	stepper: {
		flexDirection: "row",
		alignItems: "center",
	},
	stepBtn: {
		backgroundColor: "#840B1C",
		borderRadius: 20,
		width: RFValue(34),
		height: RFValue(34),
		justifyContent: "center",
		alignItems: "center",
	},
	stepValue: {
		fontSize: RFValue(20),
		fontWeight: "bold",
		marginHorizontal: 20,
		color: "#333",
		minWidth: RFValue(24),
		textAlign: "center",
	},
	smartCard: {
		backgroundColor: "#840B1C",
	},
});

export default GoalSetting;
