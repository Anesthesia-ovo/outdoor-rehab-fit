import React, { useCallback, useContext, useState } from "react";
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router, useFocusEffect, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { LocaleContext } from "../../../contexts/LocaleContext";
import { useAuth } from "../../../contexts/AuthContext";
import { showGuestRestrictionAlert } from "../../../utils/accessControl";
import {
	GOAL_TYPES,
	confirmGoalsForCurrentWeek,
	getGoalsForUser,
	needsWeekCarryPrompt,
} from "../../../utils/goalStorage";
import { getOwnerKey } from "../../../utils/sessionStorage";

const TAB_BAR_HEIGHT = 100;

export default function GoalsHubScreen() {
	const { i18n } = useContext(LocaleContext);
	const { user, isGuest } = useAuth();
	const navigation = useNavigation();
	const insets = useSafeAreaInsets();
	const bottomInset =
		Platform.OS === "ios" ? TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) : Math.max(insets.bottom, 16);
	const [targets, setTargets] = useState(null);

	useFocusEffect(
		useCallback(() => {
			navigation.setOptions({ headerTitle: i18n.t("goalHubTitle") });

			if (isGuest) {
				showGuestRestrictionAlert(i18n);
				router.replace("/(tabs)");
				return;
			}

			const load = async () => {
				const ownerKey = getOwnerKey(user);
				const goals = await getGoalsForUser(ownerKey);
				setTargets(goals?.targets || null);

				if (needsWeekCarryPrompt(goals)) {
					Alert.alert(i18n.t("goalCarryTitle"), i18n.t("goalCarryMessage"), [
						{
							text: i18n.t("goalCarryEdit"),
							style: "cancel",
							onPress: () => confirmGoalsForCurrentWeek(ownerKey),
						},
						{
							text: i18n.t("goalCarryKeep"),
							onPress: () => confirmGoalsForCurrentWeek(ownerKey),
						},
					]);
				}
			};
			load();
		}, [i18n, isGuest, navigation, user])
	);

	const options = [
		{
			key: GOAL_TYPES.AEROBIC,
			title: i18n.t("goalAerobic"),
			subtitle: i18n.t("goalAerobicHint"),
			icon: "walk",
			color: "#840B1C",
			route: { pathname: "/goals/edit-preset", params: { type: GOAL_TYPES.AEROBIC } },
			meta: targets ? `${targets[GOAL_TYPES.AEROBIC]} ${i18n.t("goalDaysUnit")}` : "",
		},
		{
			key: GOAL_TYPES.BALANCE,
			title: i18n.t("goalBalance"),
			subtitle: i18n.t("goalBalanceHint"),
			icon: "body",
			color: "#5C7AEA",
			route: { pathname: "/goals/edit-preset", params: { type: GOAL_TYPES.BALANCE } },
			meta: targets ? `${targets[GOAL_TYPES.BALANCE]} ${i18n.t("goalDaysUnit")}` : "",
		},
		{
			key: GOAL_TYPES.STRENGTH,
			title: i18n.t("goalStrength"),
			subtitle: i18n.t("goalStrengthHint"),
			icon: "barbell",
			color: "#2A9D8F",
			route: { pathname: "/goals/edit-preset", params: { type: GOAL_TYPES.STRENGTH } },
			meta: targets ? `${targets[GOAL_TYPES.STRENGTH]} ${i18n.t("goalDaysUnit")}` : "",
		},
		{
			key: "smart",
			title: i18n.t("goalSmart"),
			subtitle: i18n.t("goalSmartHint"),
			icon: "bulb",
			color: "#E9C46A",
			route: "/goals/smart",
			meta: "",
		},
	];

	return (
		<View style={[styles.container, { paddingBottom: bottomInset }]}>
			<Text style={styles.subtitle}>{i18n.t("goalHubSubtitle")}</Text>
			{options.map((option) => (
				<TouchableOpacity
					key={option.key}
					style={styles.card}
					activeOpacity={0.85}
					onPress={() => router.push(option.route)}
				>
					<View style={[styles.iconWrap, { backgroundColor: option.color }]}>
						<Ionicons name={option.icon} size={RFValue(28)} color="#fff" />
					</View>
					<View style={styles.cardText}>
						<Text style={styles.cardTitle}>{option.title}</Text>
						<Text style={styles.cardSubtitle}>{option.subtitle}</Text>
						{!!option.meta && <Text style={styles.cardMeta}>{option.meta}</Text>}
					</View>
					<Ionicons name="chevron-forward" size={RFValue(20)} color="#999" />
				</TouchableOpacity>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
		paddingHorizontal: wp("6%"),
		paddingTop: hp("3%"),
	},
	subtitle: {
		fontSize: RFValue(14),
		color: "#666",
		lineHeight: RFValue(22),
		marginBottom: hp("3%"),
	},
	card: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#fff",
		borderRadius: 16,
		padding: 16,
		marginBottom: 14,
		borderWidth: 1,
		borderColor: "#eee",
		shadowColor: "#000",
		shadowOpacity: 0.08,
		shadowRadius: 6,
		shadowOffset: { width: 0, height: 2 },
		elevation: 3,
	},
	iconWrap: {
		width: wp("14%"),
		height: wp("14%"),
		borderRadius: wp("7%"),
		justifyContent: "center",
		alignItems: "center",
		marginRight: 14,
	},
	cardText: {
		flex: 1,
	},
	cardTitle: {
		fontSize: RFValue(16),
		fontWeight: "bold",
		color: "#333",
	},
	cardSubtitle: {
		marginTop: 4,
		fontSize: RFValue(12),
		color: "#777",
		lineHeight: RFValue(18),
	},
	cardMeta: {
		marginTop: 6,
		fontSize: RFValue(13),
		color: "#840B1C",
		fontWeight: "600",
	},
});
