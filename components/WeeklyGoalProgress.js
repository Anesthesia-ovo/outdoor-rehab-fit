import React, { useContext, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import { LocaleContext } from "../contexts/LocaleContext";
import { GOAL_TYPES, toDateKey } from "../utils/goalStorage";

const WEEKDAY_KEYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY_KEYS_ZH = ["一", "二", "三", "四", "五", "六", "日"];

export default function WeeklyGoalProgress({
	progress,
	showCalendar = true,
	showSmartGoals = false,
	compact = false,
}) {
	const { i18n, locale } = useContext(LocaleContext);

	const labels = useMemo(
		() => ({
			[GOAL_TYPES.AEROBIC]: i18n.t("goalAerobic"),
			[GOAL_TYPES.BALANCE]: i18n.t("goalBalance"),
			[GOAL_TYPES.STRENGTH]: i18n.t("goalStrength"),
		}),
		[i18n]
	);

	if (!progress) {
		return null;
	}

	const todayKey = toDateKey(new Date());
	const activeSet = new Set(progress.activeDayKeys || []);
	const weekdays = locale === "en" ? WEEKDAY_KEYS_EN : WEEKDAY_KEYS_ZH;

	return (
		<View style={[styles.wrap, compact && styles.wrapCompact]}>
			{showCalendar && (
				<>
					<Text style={styles.sectionTitle}>{i18n.t("goalWeeklyCalendar")}</Text>
					<View style={styles.calendarRow}>
						{(progress.weekDates || []).map((date, index) => {
							const key = toDateKey(date);
							const isToday = key === todayKey;
							const isActive = activeSet.has(key);
							return (
								<View key={key} style={styles.dayCol}>
									<Text style={[styles.weekday, isToday && styles.todayText]}>{weekdays[index]}</Text>
									<View
										style={[
											styles.dayCircle,
											isToday && styles.dayCircleToday,
											isActive && styles.dayCircleActive,
										]}
									>
										<Text style={[styles.dayNumber, isActive && styles.dayNumberOnAccent]}>
											{date.getDate()}
										</Text>
									</View>
								</View>
							);
						})}
					</View>
				</>
			)}

			<Text style={[styles.sectionTitle, showCalendar && styles.sectionTitleSpaced]}>
				{i18n.t("goalProgressTitle")}
			</Text>
			{(progress.items || []).map((item) => {
				const ratio = item.targetDays > 0 ? Math.min(1, item.doneDays / item.targetDays) : 0;
				return (
					<View key={item.key} style={styles.progressItem}>
						<View style={styles.progressHeader}>
							<Text style={styles.progressLabel}>{labels[item.key]}</Text>
							<Text style={styles.progressMeta}>
								{i18n.t("goalProgressOf", { done: item.doneDays, target: item.targetDays })}
							</Text>
						</View>
						<View style={styles.track}>
							<View style={[styles.fill, { width: `${ratio * 100}%` }]} />
						</View>
					</View>
				);
			})}

			{showSmartGoals && (
				<View style={styles.smartBlock}>
					<Text style={styles.sectionTitle}>{i18n.t("goalHomeSmartTitle")}</Text>
					{(progress.smartGoals || []).length === 0 ? (
						<Text style={styles.smartEmpty}>{i18n.t("goalSmartEmpty")}</Text>
					) : (
						(progress.smartGoals || []).map((goal) => (
							<Text key={goal.id} style={styles.smartItem}>
								• {goal.text}
							</Text>
						))
					)}
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		backgroundColor: "#fff",
		borderRadius: 14,
		padding: 14,
		marginBottom: 14,
		borderWidth: 1,
		borderColor: "#eee",
	},
	wrapCompact: {
		padding: 12,
		marginBottom: 12,
	},
	sectionTitle: {
		fontSize: RFValue(14),
		fontWeight: "bold",
		color: "#333",
		marginBottom: 10,
	},
	sectionTitleSpaced: {
		marginTop: 14,
	},
	calendarRow: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
	dayCol: {
		alignItems: "center",
		width: wp("11%"),
	},
	weekday: {
		fontSize: RFValue(11),
		color: "#888",
		marginBottom: 6,
	},
	todayText: {
		color: "#840B1C",
		fontWeight: "bold",
	},
	dayCircle: {
		width: 30,
		height: 30,
		borderRadius: 15,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#f3f3f3",
	},
	dayCircleToday: {
		borderWidth: 1.5,
		borderColor: "#840B1C",
	},
	dayCircleActive: {
		backgroundColor: "#840B1C",
	},
	dayNumber: {
		fontSize: RFValue(12),
		color: "#333",
		fontWeight: "600",
	},
	dayNumberOnAccent: {
		color: "#fff",
	},
	progressItem: {
		marginBottom: 12,
	},
	progressHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 6,
		gap: 8,
	},
	progressLabel: {
		fontSize: RFValue(13),
		fontWeight: "600",
		color: "#444",
		flex: 1,
	},
	progressMeta: {
		fontSize: RFValue(12),
		color: "#840B1C",
		fontWeight: "600",
	},
	track: {
		height: 10,
		borderRadius: 6,
		backgroundColor: "#eee",
		overflow: "hidden",
	},
	fill: {
		height: "100%",
		borderRadius: 6,
		backgroundColor: "#E8CCB0",
	},
	smartBlock: {
		marginTop: 6,
		paddingTop: 10,
		borderTopWidth: 1,
		borderTopColor: "#f0f0f0",
	},
	smartEmpty: {
		fontSize: RFValue(12),
		color: "#999",
	},
	smartItem: {
		fontSize: RFValue(13),
		color: "#444",
		lineHeight: RFValue(20),
		marginBottom: 4,
	},
});
