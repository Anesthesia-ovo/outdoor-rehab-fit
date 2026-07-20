import React, { useContext } from "react";
import { Platform, StyleSheet, View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LocaleContext } from "../../contexts/LocaleContext";
import { useAuth } from "../../contexts/AuthContext";
import { FEATURES } from "../../constants/permissions";
import { guardGuestAccess } from "../../utils/accessControl";
import { RFValue } from "react-native-responsive-fontsize";
import WeatherComponent from "../../components/WeatherComponent";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";

const TAB_BAR_HEIGHT = 100;

export default function HomeScreen() {
	const { i18n } = useContext(LocaleContext);
	const { isGuest } = useAuth();
	const insets = useSafeAreaInsets();
	const bottomInset =
		Platform.OS === "ios" ? TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) : Math.max(insets.bottom, 16);
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

	const handlePress = (button) => {
		guardGuestAccess(button.feature, isGuest, i18n, () => {
			router.push(`/${button.route}`);
		});
	};

	return (
		<ScrollView contentContainerStyle={[styles.contentContainer, { paddingBottom: bottomInset }]}>
			<View style={styles.imageContainer}>
				<Image source={require("@/assets/images/hk.jpg")} style={styles.photo} />
				<Text style={styles.greeting}>{getGreeting()},</Text>
				<View style={styles.weatherComponentContainer}>
					<WeatherComponent style={styles.weatherComponent} i18n={i18n} />
				</View>
			</View>
			<View style={styles.buttonsContainer}>
				{isGuest && (
					<View style={styles.guestNotice}>
						<Ionicons name="lock-closed" size={RFValue(18)} color="#840B1C" style={styles.guestNoticeIcon} />
						<Text style={styles.guestNoticeText}>{i18n.t("guestModeBanner")}</Text>
					</View>
				)}
				<View style={styles.buttonsGrid}>
					{buttons.map((button, index) => {
						const isLocked = isGuest && button.feature !== FEATURES.OUTDOOR_EQUIPMENT;
						return (
							<View key={index} style={styles.buttonWrapper}>
								<TouchableOpacity
									onPress={() => handlePress(button)}
									style={[styles.button, { backgroundColor: button.color }, isLocked && styles.lockedButton]}
								>
									<Image source={button.icon} style={[styles.icon, isLocked && styles.lockedIcon]} />
									{isLocked && (
										<View style={styles.lockBadge}>
											<Ionicons name="lock-closed" size={RFValue(14)} color="#fff" />
										</View>
									)}
								</TouchableOpacity>
								<Text style={styles.buttonText}>{button.text}</Text>
								{isLocked && <Text style={styles.lockedLabel}>{i18n.t("guestLocked")}</Text>}
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
	},
	imageContainer: {
		position: "relative",
	},
	photo: {
		width: wp("100%"),
		height: hp("35%"),
		resizeMode: "cover",
		filter: "brightness(0.8)",
	},
	greeting: {
		position: "absolute",
		top: hp("6%"),
		left: wp("5%"),
		fontSize: RFValue(24),
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
		width: wp("92%"),
	},
	guestNotice: {
		width: "100%",
		flexDirection: "row",
		alignItems: "flex-start",
		backgroundColor: "#FFF3CD",
		borderWidth: 1,
		borderColor: "#FFE69C",
		paddingVertical: 12,
		paddingHorizontal: 14,
		borderRadius: 12,
		marginBottom: hp("2%"),
	},
	guestNoticeIcon: {
		marginTop: 2,
		marginRight: 10,
	},
	guestNoticeText: {
		flex: 1,
		fontSize: RFValue(13),
		color: "#856404",
		lineHeight: RFValue(20),
	},
	buttonsContainer: {
		backgroundColor: "#fff",
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		marginTop: hp("-3%"),
		paddingTop: hp("2%"),
		paddingHorizontal: wp("7%"),
		paddingBottom: hp("2%"),
	},
	buttonsGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
	},
	buttonWrapper: {
		width: "45%",
		alignItems: "center",
		marginVertical: hp("1%"),
	},
	button: {
		width: wp("40%"),
		height: wp("40%"),
		borderRadius: wp("20%"),
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
		elevation: 5,
	},
	lockedButton: {
		opacity: 0.75,
	},
	icon: {
		width: wp("15%"),
		height: wp("15%"),
		resizeMode: "contain",
	},
	lockedIcon: {
		opacity: 0.6,
	},
	lockBadge: {
		position: "absolute",
		top: 10,
		right: 10,
		backgroundColor: "#840B1C",
		borderRadius: 12,
		width: 24,
		height: 24,
		justifyContent: "center",
		alignItems: "center",
	},
	buttonText: {
		color: "#000",
		fontSize: RFValue(14),
		textAlign: "center",
		marginTop: hp("1%"),
		fontWeight: "bold",
	},
	lockedLabel: {
		marginTop: 2,
		fontSize: RFValue(11),
		color: "#840B1C",
	},
});
