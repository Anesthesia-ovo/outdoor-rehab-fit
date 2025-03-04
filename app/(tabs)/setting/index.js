import React, { useContext } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { FontAwesome } from "@expo/vector-icons"; // Make sure to install this package
import { LocaleContext } from "../../../contexts/LocaleContext";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";

const Setting = () => {
	const { i18n, changeLanguage } = useContext(LocaleContext);
	return (
		<View style={styles.container}>
			<TouchableOpacity style={styles.button} onPress={changeLanguage}>
				<FontAwesome name="language" size={RFValue(30)} color="white" />
				<Text style={styles.buttonText}>{i18n.t("changeLanguage")}</Text>
			</TouchableOpacity>
			<TouchableOpacity
				style={styles.button}
				onPress={() => {
					router.push(`/setting/about`);
				}}
			>
				<FontAwesome name="info-circle" size={RFValue(30)} color="white" />
				<Text style={styles.buttonText}>{i18n.t("aboutApp")}</Text>
			</TouchableOpacity>
			<TouchableOpacity
				style={styles.button}
				onPress={() => {
					router.push(`/setting/info`);
				}}
			>
				<FontAwesome name="users" size={RFValue(30)} color="white" />
				<Text style={styles.buttonText}>{i18n.t("aboutTeam")}</Text>
			</TouchableOpacity>
			<TouchableOpacity
				style={styles.button}
				onPress={() => {
					router.push(`/setting/disclaimer`);
				}}
			>
				<FontAwesome name="exclamation-triangle" size={RFValue(30)} color="white" />
				<Text style={styles.buttonText}>{i18n.t("settingDisclaimer")}</Text>
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
	},
	button: {
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#007BFF",
		borderRadius: 10,
		padding: 20,
		margin: 10,
		width: wp("80%"),
		height: hp("15%"),
	},
	buttonText: {
		color: "white",
		marginTop: hp("1%"),
		fontSize: RFValue(18),
		fontWeight: "bold",
	},
});

export default Setting;
