// Shared progress bars for the three preset weekly goals (App Upgrade #6)
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";

const BAR_CONFIG = [
	{ key: "aerobic", labelKey: "aerobicGoal", color: "#E9B44C" },
	{ key: "balance", labelKey: "balanceGoal", color: "#EB9481" },
	{ key: "muscle", labelKey: "muscleGoal", color: "#9B2226" },
];

const GoalProgressBars = ({ i18n, progress, targets }) => {
	return (
		<View style={styles.container}>
			{BAR_CONFIG.map(({ key, labelKey, color }) => {
				const target = targets?.[key] || 1;
				const value = progress?.[key] || 0;
				const pct = Math.min(1, value / target);
				const achieved = value >= target;
				return (
					<View key={key} style={styles.row}>
						<View style={styles.labelRow}>
							<Text style={styles.label}>{i18n.t(labelKey)}</Text>
							<Text style={[styles.value, achieved && styles.achieved]}>
								{value} / {target} {i18n.t("days")} {achieved ? "✓" : ""}
							</Text>
						</View>
						<View style={styles.track}>
							<View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
						</View>
					</View>
				);
			})}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		width: "100%",
	},
	row: {
		marginBottom: 12,
	},
	labelRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 4,
	},
	label: {
		fontSize: RFValue(13),
		color: "#444",
		fontWeight: "600",
	},
	value: {
		fontSize: RFValue(13),
		color: "#666",
	},
	achieved: {
		color: "#2E8B57",
		fontWeight: "bold",
	},
	track: {
		height: RFValue(12),
		backgroundColor: "#eee",
		borderRadius: RFValue(6),
		overflow: "hidden",
	},
	fill: {
		height: "100%",
		borderRadius: RFValue(6),
	},
});

export default GoalProgressBars;
