import React, { useEffect, useRef } from "react";
import { router } from "expo-router";
import { StyleSheet, View, Animated, TouchableOpacity, Text, ImageBackground, Button } from "react-native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import * as Updates from "expo-updates";
import { RFValue } from "react-native-responsive-fontsize";

export default function HomeScreen() {
	const { currentlyRunning, isUpdateAvailable, isUpdatePending } = Updates.useUpdates();

	useEffect(() => {
		if (isUpdatePending) {
			// Update has successfully downloaded; apply it now
			Updates.reloadAsync();
		}
	}, [isUpdatePending]);

	const fadeAnim = useRef(new Animated.Value(0)).current; // Initial opacity value: 0
	const scaleAnim = useRef(new Animated.Value(0.5)).current; // Initial scale value: 0.5
	useEffect(() => {
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 1000,
				useNativeDriver: true,
			}),
			Animated.timing(scaleAnim, {
				toValue: 1,
				duration: 1000,
				useNativeDriver: true,
			}),
		]).start();
	}, [fadeAnim, scaleAnim]);

	return (
		<ImageBackground source={require("@/assets/images/background.png")} resizeMethod="cover" style={styles.background}>
			<View style={styles.container}>
				<Animated.Image
					source={require("@/assets/images/logo.png")}
					style={[
						styles.logo,
						{
							opacity: fadeAnim,
							transform: [{ scale: scaleAnim }],
						},
					]}
				/>
				<TouchableOpacity style={styles.button} onPress={() => router.push("/login")}>
					<Text style={styles.buttonText}>Start 開始</Text>
				</TouchableOpacity>
				<Text style={styles.appVersionText}>App version 1.0.0</Text>
			</View>
		</ImageBackground>
	);
}

const styles = StyleSheet.create({
	background: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	logo: {
		width: wp("80%"),
		resizeMode: "contain",
		marginTop: hp("10%"),
	},
	button: {
		marginTop: "auto",
		marginBottom: hp("2%"),
		paddingVertical: hp("2%"),
		paddingHorizontal: wp("35%"),
		backgroundColor: "#840B1C",
		borderRadius: 50,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 6,
		elevation: 3,
	},
	buttonText: {
		color: "white",
		width: "100%",
		fontSize: RFValue(14),
		alignSelf: "center",
	},
	appVersionText: {
		marginBottom: hp("10%"),
	},
});
