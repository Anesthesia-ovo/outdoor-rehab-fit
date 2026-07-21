import React, { useContext, useEffect } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { LocaleContext } from "../../../contexts/LocaleContext";
import { useAuth } from "../../../contexts/AuthContext";
import { showGuestRestrictionAlert } from "../../../utils/accessControl";

const TAB_BAR_HEIGHT = 100;

export default function SessionHubScreen() {
	const { i18n } = useContext(LocaleContext);
	const { isGuest } = useAuth();
	const navigation = useNavigation();
	const insets = useSafeAreaInsets();
	const bottomInset =
		Platform.OS === "ios" ? TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) : Math.max(insets.bottom, 16);

	useEffect(() => {
		navigation.setOptions({ headerTitle: i18n.t("sessionHubTitle") });
	}, [navigation, i18n]);

	useEffect(() => {
		if (isGuest) {
			showGuestRestrictionAlert(i18n);
			router.replace("/(tabs)");
		}
	}, [isGuest, i18n]);

	const options = [
		{
			key: "record",
			title: i18n.t("sessionRecord"),
			subtitle: i18n.t("sessionRecordHint"),
			icon: "play-circle",
			color: "#840B1C",
			route: "/session/timer",
		},
		{
			key: "log",
			title: i18n.t("sessionLog"),
			subtitle: i18n.t("sessionLogHint"),
			icon: "list",
			color: "#5C7AEA",
			route: "/session/log",
		},
	];

	return (
		<View style={[styles.container, { paddingBottom: bottomInset }]}>
			<Text style={styles.subtitle}>{i18n.t("sessionHubSubtitle")}</Text>
			{options.map((option) => (
				<TouchableOpacity
					key={option.key}
					style={styles.card}
					activeOpacity={0.85}
					onPress={() => router.push(option.route)}
				>
					<View style={[styles.iconWrap, { backgroundColor: option.color }]}>
						<Ionicons name={option.icon} size={RFValue(32)} color="#fff" />
					</View>
					<View style={styles.cardText}>
						<Text style={styles.cardTitle}>{option.title}</Text>
						<Text style={styles.cardSubtitle}>{option.subtitle}</Text>
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
		padding: 18,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: "#eee",
		shadowColor: "#000",
		shadowOpacity: 0.08,
		shadowRadius: 6,
		shadowOffset: { width: 0, height: 2 },
		elevation: 3,
	},
	iconWrap: {
		width: wp("16%"),
		height: wp("16%"),
		borderRadius: wp("8%"),
		justifyContent: "center",
		alignItems: "center",
		marginRight: 14,
	},
	cardText: {
		flex: 1,
	},
	cardTitle: {
		fontSize: RFValue(17),
		fontWeight: "bold",
		color: "#333",
	},
	cardSubtitle: {
		marginTop: 4,
		fontSize: RFValue(13),
		color: "#777",
		lineHeight: RFValue(18),
	},
});
