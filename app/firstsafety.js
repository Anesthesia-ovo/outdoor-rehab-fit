import React, { useContext, useEffect } from "react";
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, SafeAreaView, Alert } from "react-native";
import { LocaleContext } from "../contexts/LocaleContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { enterMainApp } from "../utils/navigation";

const FirstSafety = () => {
	const { i18n } = useContext(LocaleContext);

	useEffect(() => {
		const checkSafetyResponse = async () => {
			try {
				const safetyResponse = await AsyncStorage.getItem("safetyResponse");
				if (safetyResponse === "no") {
					enterMainApp("/(tabs)");
				}
			} catch (error) {
				console.error("Error checking safety response status", error);
			}
		};
		checkSafetyResponse();
	}, []);

	const handleNo = async () => {
		try {
			await AsyncStorage.setItem("safetyResponse", "no");
			Alert.alert("", i18n.t("agreeQuestionnaire"), [{ text: "OK", onPress: () => enterMainApp("/(tabs)") }]);
		} catch (error) {
			console.error("Error saving safety response status", error);
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<Text style={styles.title}>{i18n.t("sprm")}</Text>
			<ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
				<Text style={styles.text}>{i18n.t("safety")}</Text>
			</ScrollView>
			<View style={styles.buttonContainer}>
				<TouchableOpacity style={styles.button} onPress={handleNo}>
					<Text style={styles.buttonText}>{i18n.t("agreeSafety")}</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[styles.button, { backgroundColor: "#dc3545" }]}
					onPress={() => {
						Alert.alert(i18n.t("warning"), i18n.t("questionnaireYes"));
					}}
				>
					<Text style={styles.buttonText}>{i18n.t("disagreeSafety")}</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#007BFF",
		marginBottom: 16,
		padding: 20,
		textAlign: "center",
		backgroundColor: "#f8f9fa",
	},
	scrollView: {
		flex: 1,
		padding: 12,
		backgroundColor: "#f8f9fa",
	},
	scrollViewContent: {
		paddingBottom: 20,
	},
	text: {
		fontSize: 24,
		lineHeight: 32,
		color: "#333",
	},
	buttonContainer: {
		flexDirection: "column",
		justifyContent: "space-between",
		padding: 16,
	},
	button: {
		backgroundColor: "#007BFF",
		paddingVertical: 22,
		paddingHorizontal: 32,
		borderRadius: 8,
		marginVertical: 8,
		alignItems: "center",
	},
	buttonText: {
		color: "#fff",
		fontSize: 22,
		fontWeight: "bold",
	},
});

export default FirstSafety;
