import React, { useCallback, useContext, useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LocaleContext } from "../../contexts/LocaleContext";
import { AuthContext } from "../../contexts/AuthContext";
import { FEATURES } from "../../constants/permissions";
import { canAccess } from "../../constants/permissions";
import { guardGuestAccess } from "../../utils/accessControl";
import { RFValue } from "react-native-responsive-fontsize";
import WeatherComponent from "../../components/WeatherComponent";
import GoalProgressBars from "../../components/GoalProgressBars";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { trackUsageDay } from "../../utils/usage";
import { getWeeklyProgress, getGoalState, getCurrentWeekSmartGoals } from "../../utils/goals";
import { getSessions } from "../../utils/sessions";
import { getWeekDates, toDateKey } from "../../utils/dates";

export default function HomeScreen() {
	const { i18n, locale } = useContext(LocaleContext);
	const { user, isGuest } = useContext(AuthContext);
	const [weekly, setWeekly] = useState(null);
	const [smartGoals, setSmartGoals] = useState([]);
	const [activeDays, setActiveDays] = useState({});

	useFocusEffect(
		useCallback(() => {
			trackUsageDay();
			if (isGuest) {
				setWeekly(null);
				setSmartGoals([]);
				setActiveDays({});
				return;
			}
			(async () => {
				const [weeklyData, goalState, sessions] = await Promise.all([
					getWeeklyProgress(),
					getGoalState(),
					getSessions(),
				]);
				setWeekly(weeklyData);
				setSmartGoals(getCurrentWeekSmartGoals(goalState));
				const days = {};
				sessions.forEach((s) => {
					days[toDateKey(new Date(s.date))] = true;
				});
				setActiveDays(days);
			})();
		}, [isGuest])
	);

	const buttons = [
		{
			color: "#F0E4C2",
			text: i18n.t("outdoor"),
			icon: require("@/assets/icons/outdoor.png"),
			route: "outdoor",
			feature: FEATURES.OUTDOOR_EQUIPMENT,
		},
		{
			color: "#E8CCB0",
			text: i18n.t("risk"),
			icon: require("@/assets/icons/risks.png"),
			route: "(tabs)/risk",
			feature: FEATURES.RISK,
		},
		{
			color: "#F2CCC0",
			text: i18n.t("location"),
			icon: require("@/assets/icons/map.png"),
			route: "(tabs)/location",
			feature: FEATURES.LOCATION,
		},
		{
			color: "#ECDD93",
			text: i18n.t("research"),
			icon: require("@/assets/icons/school.png"),
			route: "research",
			feature: FEATURES.RESEARCH,
		},
	];

	const featureButtons = [
		{ color: "#D9E8D0", text: i18n.t("goalSetting"), iconName: "bullseye-arrow", route: "goals", feature: FEATURES.GOAL_SETTING },
		{ color: "#CFE3F0", text: i18n.t("sessionLog"), iconName: "clipboard-text-clock", route: "sessionlog", feature: FEATURES.SESSION_LOG },
		{ color: "#EAD8F0", text: i18n.t("groupChat"), iconName: "message-text", route: "chat", feature: FEATURES.GROUP_CHAT },
		{ color: "#F0DDCC", text: i18n.t("equipmentMap"), iconName: "map-search", route: "equipmentmap", feature: FEATURES.EQUIPMENT_MAP },
		{ color: "#D8F0EC", text: i18n.t("statistics"), iconName: "chart-bar", route: "stats", feature: FEATURES.USAGE_STATS },
	];

	const getGreeting = () => {
		const currentHour = new Date().getHours();
		if (currentHour < 12) {
			return i18n.t("morning");
		} else if (currentHour < 18) {
			return i18n.t("afternoon");
		} else {
			return i18n.t("evening");
		}
	};

	const handlePress = (route, feature) => {
		guardGuestAccess(feature, isGuest, i18n, () => {
			router.push(`/${route}`);
		});
	};

	const weekDates = getWeekDates();
	const todayKey = toDateKey();
	const dayLabels = locale === "zh" ? ["一", "二", "三", "四", "五", "六", "日"] : ["M", "T", "W", "T", "F", "S", "S"];

	return (
		<ScrollView contentContainerStyle={styles.contentContainer}>
			<View style={styles.imageContainer}>
				<Image source={require("@/assets/images/hk.jpg")} style={styles.photo} />
				<Text style={styles.greeting}>
					{getGreeting()}
					{user ? `, ${isGuest || user.name === "guest" ? i18n.t("guestUser") : user.name || user.username}` : ","}
				</Text>
				<View style={styles.weatherComponentContainer}>
					<WeatherComponent style={styles.weatherComponent} i18n={i18n} />
				</View>
			</View>

			<View style={styles.mainContent}>
				{isGuest && (
					<TouchableOpacity style={styles.guestBanner} onPress={() => router.push({ pathname: "/login", params: { from: "settings" } })}>
						<Ionicons name="lock-closed" size={RFValue(16)} color="#840B1C" />
						<Text style={styles.guestBannerText}>{i18n.t("guestModeBanner")}</Text>
					</TouchableOpacity>
				)}

				{/* Session record — locked for guests */}
				<TouchableOpacity
					style={[styles.sessionButton, isGuest && styles.lockedSessionButton]}
					onPress={() => handlePress("session", FEATURES.SESSION_RECORD)}
				>
					<Ionicons name={isGuest ? "lock-closed" : "stopwatch"} size={RFValue(28)} color="#fff" />
					<Text style={styles.sessionButtonText}>{i18n.t("sessionRecord")}</Text>
				</TouchableOpacity>

				{!isGuest && (
					<>
						<View style={styles.weekCard}>
							<Text style={styles.weekTitle}>{i18n.t("weeklyCalendar")}</Text>
							<View style={styles.weekRow}>
								{weekDates.map((d, idx) => {
									const key = toDateKey(d);
									const isToday = key === todayKey;
									const hasSession = activeDays[key];
									return (
										<View key={key} style={[styles.dayCell, isToday && styles.dayCellToday]}>
											<Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>{dayLabels[idx]}</Text>
											<Text style={[styles.dayNum, isToday && styles.dayLabelToday]}>{d.getDate()}</Text>
											{hasSession ? (
												<Ionicons name="checkmark-circle" size={RFValue(16)} color="#2E8B57" />
											) : (
												<View style={styles.dayDot} />
											)}
										</View>
									);
								})}
							</View>
							{weekly && (
								<View style={{ marginTop: hp("1.5%") }}>
									<GoalProgressBars i18n={i18n} progress={weekly.progress} targets={weekly.targets} />
								</View>
							)}
						</View>

						<TouchableOpacity style={styles.smartCard} onPress={() => handlePress("goals/smart", FEATURES.GOAL_SETTING)}>
							<View style={styles.smartHeader}>
								<MaterialCommunityIcons name="bullseye-arrow" size={RFValue(18)} color="#840B1C" />
								<Text style={styles.smartTitle}>{i18n.t("smartGoals")}</Text>
								<Ionicons name="chevron-forward" size={RFValue(16)} color="#999" style={{ marginLeft: "auto" }} />
							</View>
							{smartGoals.length === 0 ? (
								<Text style={styles.smartEmpty}>{i18n.t("noSmartGoals")}</Text>
							) : (
								smartGoals.slice(0, 3).map((goal) => (
									<View key={goal.id} style={styles.smartRow}>
										<Ionicons
											name={goal.done ? "checkmark-circle" : "ellipse-outline"}
											size={RFValue(16)}
											color={goal.done ? "#2E8B57" : "#bbb"}
										/>
										<Text style={[styles.smartText, goal.done && styles.smartDone]} numberOfLines={1}>
											{goal.text}
										</Text>
									</View>
								))
							)}
						</TouchableOpacity>
					</>
				)}

				<View style={styles.featureRow}>
					{featureButtons.map((button, index) => {
						const locked = isGuest && !canAccess(button.feature, isGuest);
						return (
							<TouchableOpacity
								key={index}
								style={styles.featureButton}
								onPress={() => handlePress(button.route, button.feature)}
							>
								<View style={[styles.featureIconCircle, { backgroundColor: button.color }, locked && styles.lockedCircle]}>
									<MaterialCommunityIcons
										name={locked ? "lock" : button.iconName}
										size={RFValue(24)}
										color={locked ? "#840B1C" : "#555"}
									/>
								</View>
								<Text style={styles.featureText} numberOfLines={2}>
									{button.text}
								</Text>
								{locked && <Text style={styles.lockedLabel}>{i18n.t("guestLocked")}</Text>}
							</TouchableOpacity>
						);
					})}
				</View>

				<View style={styles.buttonsContainer}>
					{buttons.map((button, index) => {
						const locked = isGuest && !canAccess(button.feature, isGuest);
						return (
							<View key={index} style={styles.buttonWrapper}>
								<TouchableOpacity
									onPress={() => handlePress(button.route, button.feature)}
									style={[styles.button, { backgroundColor: button.color }, locked && styles.lockedButton]}
								>
									<Image source={button.icon} style={[styles.icon, locked && styles.lockedIcon]} />
									{locked && (
										<View style={styles.lockBadge}>
											<Ionicons name="lock-closed" size={RFValue(14)} color="#fff" />
										</View>
									)}
								</TouchableOpacity>
								<Text style={styles.buttonText}>{button.text}</Text>
								{locked && <Text style={styles.lockedLabel}>{i18n.t("guestLocked")}</Text>}
							</View>
						);
					})}
				</View>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	contentContainer: {
		flexGrow: 1,
		backgroundColor: "#fff",
		paddingBottom: hp("12%"),
	},
	imageContainer: {
		position: "relative",
	},
	photo: {
		width: wp("100%"),
		height: hp("30%"),
		resizeMode: "cover",
		filter: "brightness(0.8)",
	},
	greeting: {
		position: "absolute",
		top: hp("6%"),
		left: wp("5%"),
		fontSize: RFValue(22),
		fontWeight: "bold",
		color: "#fff",
		borderRadius: 5,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
	},
	weatherComponentContainer: {
		position: "absolute",
		bottom: hp("4%"),
		alignSelf: "center",
	},
	mainContent: {
		backgroundColor: "#fff",
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		marginTop: hp("-3%"),
		paddingTop: hp("2%"),
		paddingHorizontal: wp("5%"),
	},
	guestBanner: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FBEAEA",
		borderRadius: 12,
		padding: 12,
		marginBottom: hp("1.5%"),
		gap: 8,
	},
	guestBannerText: {
		flex: 1,
		fontSize: RFValue(11),
		color: "#840B1C",
		marginLeft: 6,
		lineHeight: RFValue(16),
	},
	sessionButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#840B1C",
		borderRadius: 50,
		paddingVertical: hp("2%"),
		marginBottom: hp("2%"),
		gap: 10,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
		elevation: 5,
	},
	lockedSessionButton: {
		backgroundColor: "#A07078",
	},
	sessionButtonText: {
		color: "#fff",
		fontSize: RFValue(18),
		fontWeight: "bold",
		marginLeft: 8,
	},
	weekCard: {
		backgroundColor: "#FAF7F2",
		borderRadius: 16,
		padding: 16,
		marginBottom: hp("1.5%"),
	},
	weekTitle: {
		fontSize: RFValue(15),
		fontWeight: "bold",
		color: "#333",
		marginBottom: 10,
	},
	weekRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 6,
	},
	dayCell: {
		alignItems: "center",
		width: wp("10%"),
		paddingVertical: 6,
		borderRadius: 10,
	},
	dayCellToday: {
		backgroundColor: "#840B1C",
	},
	dayLabel: {
		fontSize: RFValue(11),
		color: "#888",
	},
	dayNum: {
		fontSize: RFValue(14),
		fontWeight: "bold",
		color: "#333",
		marginVertical: 2,
	},
	dayLabelToday: {
		color: "#fff",
	},
	dayDot: {
		width: RFValue(16),
		height: RFValue(16),
		borderRadius: RFValue(8),
		backgroundColor: "transparent",
	},
	smartCard: {
		backgroundColor: "#FFF7E6",
		borderRadius: 16,
		padding: 14,
		marginBottom: hp("2%"),
		borderWidth: 1,
		borderColor: "#F0E4C2",
	},
	smartHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 8,
	},
	smartTitle: {
		fontSize: RFValue(14),
		fontWeight: "bold",
		color: "#333",
		marginLeft: 6,
	},
	smartEmpty: {
		fontSize: RFValue(12),
		color: "#999",
	},
	smartRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 3,
	},
	smartText: {
		flex: 1,
		fontSize: RFValue(13),
		color: "#444",
		marginLeft: 8,
	},
	smartDone: {
		textDecorationLine: "line-through",
		color: "#999",
	},
	featureRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		marginBottom: hp("1%"),
	},
	featureButton: {
		width: "18%",
		alignItems: "center",
		marginBottom: hp("1.5%"),
	},
	featureIconCircle: {
		width: wp("14%"),
		height: wp("14%"),
		borderRadius: wp("7%"),
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 3,
		elevation: 3,
	},
	featureText: {
		fontSize: RFValue(9),
		color: "#333",
		textAlign: "center",
		marginTop: 4,
		fontWeight: "600",
	},
	buttonsContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		paddingHorizontal: wp("2%"),
	},
	buttonWrapper: {
		width: "45%",
		alignItems: "center",
		marginVertical: hp("1%"),
	},
	button: {
		width: wp("36%"),
		height: wp("36%"),
		borderRadius: wp("18%"),
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
		elevation: 5,
	},
	buttonText: {
		color: "#000",
		fontSize: RFValue(13),
		textAlign: "center",
		marginTop: hp("1%"),
		fontWeight: "bold",
	},
	icon: {
		width: wp("14%"),
		height: wp("14%"),
		resizeMode: "contain",
	},
	lockedButton: {
		opacity: 0.55,
	},
	lockedIcon: {
		opacity: 0.45,
	},
	lockedCircle: {
		opacity: 0.7,
		borderWidth: 1,
		borderColor: "#840B1C",
	},
	lockBadge: {
		position: "absolute",
		right: 10,
		top: 10,
		backgroundColor: "#840B1C",
		borderRadius: 12,
		padding: 4,
	},
	lockedLabel: {
		fontSize: RFValue(9),
		color: "#840B1C",
		fontWeight: "600",
		marginTop: 2,
	},
});
