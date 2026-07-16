import React, { useContext } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { router } from "expo-router";
import { LocaleContext } from "../../contexts/LocaleContext";
import { RFValue } from "react-native-responsive-fontsize";
import WeatherComponent from "../../components/WeatherComponent";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
export default function HomeScreen() {
	const { i18n } = useContext(LocaleContext);
	const buttons = [
		{
			color: "#F0E4C2",
			text: i18n.t("outdoor"),
			icon: require("@/assets/icons/outdoor.png"),
			route: "outdoor",
		},
		{ color: "#E8CCB0", text: i18n.t("risk"), icon: require("@/assets/icons/risks.png"), route: "(tabs)/risk" },
		{
			color: "#F2CCC0",
			text: i18n.t("location"),
			icon: require("@/assets/icons/map.png"),
			route: "(tabs)/location",
		},
		{ color: "#ECDD93", text: i18n.t("research"), icon: require("@/assets/icons/school.png"), route: "research" },
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

	return (
		<ScrollView contentContainerStyle={styles.contentContainer}>
			<View style={styles.imageContainer}>
				<Image source={require("@/assets/images/hk.jpg")} style={styles.photo} />
				<Text style={styles.greeting}>{getGreeting()},</Text>
				<View style={styles.weatherComponentContainer}>
					<WeatherComponent style={styles.weatherComponent} i18n={i18n} />
				</View>
			</View>
			<View style={styles.buttonsContainer}>
				{buttons.map((button, index) => (
					<View key={index} style={styles.buttonWrapper}>
						<TouchableOpacity
							onPress={() => {
								router.push(`/${button.route}`);
							}}
							style={[styles.button, { backgroundColor: button.color }]}
						>
							<Image source={button.icon} style={styles.icon} />
						</TouchableOpacity>
						<Text style={styles.buttonText}>{button.text}</Text>
					</View>
				))}
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
	buttonsContainer: {
		backgroundColor: "#fff",
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		marginTop: hp("-3%"), // Added negative margin to overlap with the image
		paddingTop: hp("2%"), // Added padding to control spacing
		paddingHorizontal: wp("7%"), // Added padding to control spacing
		paddingBottom: hp("5%"), // Added padding to control spacing
		marginBottom: hp("10%"), // Added margin to control spacing
	},
	buttonWrapper: {
		width: "45%",
		alignItems: "center",
		marginVertical: hp("1%"), // Reduced horizontal margin
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
	buttonText: {
		color: "#000",
		fontSize: RFValue(14),
		textAlign: "center",
		marginTop: hp("1%"),
		fontWeight: "bold",
	},
	icon: {
		width: wp("15%"),
		height: wp("15%"),
		resizeMode: "contain",
	},
});
