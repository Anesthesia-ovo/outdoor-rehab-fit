import React, { useContext } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import { LocaleContext } from "../contexts/LocaleContext";

export default function GuestBanner() {
	const { i18n } = useContext(LocaleContext);

	return (
		<View style={styles.banner}>
			<Ionicons name="information-circle" size={RFValue(20)} color="#856404" />
			<Text style={styles.text}>{i18n.t("guestModeBanner")}</Text>
			<TouchableOpacity style={styles.button} onPress={() => router.push({ pathname: "/login", params: { from: "settings" } })}>
				<Text style={styles.buttonText}>{i18n.t("loginNow")}</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	banner: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFF3CD",
		borderColor: "#FFE69C",
		borderWidth: 1,
		borderRadius: 10,
		padding: 12,
		marginHorizontal: wp("4%"),
		marginVertical: 8,
		gap: 8,
	},
	text: {
		flex: 1,
		fontSize: RFValue(12),
		color: "#856404",
		lineHeight: RFValue(18),
	},
	button: {
		backgroundColor: "#840B1C",
		borderRadius: 16,
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
	buttonText: {
		color: "#fff",
		fontSize: RFValue(11),
		fontWeight: "bold",
	},
});
