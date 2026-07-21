import React, { useContext } from "react";
import { router } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, StyleSheet, View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { LocaleContext } from "../../../contexts/LocaleContext";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import { RFValue } from "react-native-responsive-fontsize";

const TAB_BAR_HEIGHT = 100;

export default function Outdoor() {
	const { i18n } = useContext(LocaleContext);
	const insets = useSafeAreaInsets();
	const bottomInset =
		Platform.OS === "ios" ? TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) : Math.max(insets.bottom, 16);

	const buttons = [
		{ icon: require("@/assets/icons/outdoor/list.png"), text: i18n.t("all"), category: "all" },
		{ icon: require("@/assets/icons/outdoor/muscle.png"), text: i18n.t("muscle"), category: "muscle" },
		{ icon: require("@/assets/icons/outdoor/flexibility.png"), text: i18n.t("mobility"), category: "mobility" },
		{ icon: require("@/assets/icons/outdoor/balance.png"), text: i18n.t("balance"), category: "balance" },
		{ icon: require("@/assets/icons/outdoor/aerobic.png"), text: i18n.t("aerobic"), category: "aerobic" },
		{ icon: require("@/assets/icons/outdoor/wheelchair.png"), text: i18n.t("wheelchair"), category: "wheelchair" },
		{ icon: require("@/assets/icons/outdoor/multi.png"), text: i18n.t("multifunctional"), category: "multifunctional" },
		{ icon: require("@/assets/icons/outdoor/relax.png"), text: i18n.t("relaxation"), category: "relaxation" },
		{ icon: require("@/assets/icons/outdoor/upper.png"), text: i18n.t("upper"), category: "upper" },
		{ icon: require("@/assets/icons/outdoor/lower.png"), text: i18n.t("lower"), category: "lower" },
	];

	return (
		<SafeAreaView style={styles.container} edges={["bottom"]}>
			<ScrollView contentContainerStyle={[styles.scrollViewContent, { paddingBottom: bottomInset }]}>
				<View style={styles.buttonsContainer}>
					{buttons.map((button, index) => (
						<View key={index} style={styles.buttonWrapper}>
							<TouchableOpacity
								onPress={() =>
									router.push({
										pathname: "/outdoor/list",
										params: { categoryName: button.text, categoryId: button.category },
									})
								}
								style={styles.button}
							>
								<Image source={button.icon} style={styles.icon} />
							</TouchableOpacity>
							<Text style={styles.buttonText}>{button.text}</Text>
						</View>
					))}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	scrollViewContent: {
		flexGrow: 1,
		alignItems: "center",
	},
	buttonsContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		paddingHorizontal: 25,
	},
	buttonWrapper: {
		width: wp("40%"), // Adjust width to fit two buttons per row
		alignItems: "center",
		marginVertical: 10,
	},
	button: {
		width: wp("30%"),
		height: wp("30%"),
		borderRadius: wp("15%"),
		borderWidth: wp("2%"),
		borderColor: "#EB9481",
		backgroundColor: "#FFF",
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
		elevation: 5,
	},
	icon: {
		width: wp("13%"),
		height: wp("13%"),
		resizeMode: "contain",
	},
	buttonText: {
		color: "#000",
		fontSize: RFValue(16),
		textAlign: "center",
		marginTop: 5,
		fontWeight: "bold",
	},
});
