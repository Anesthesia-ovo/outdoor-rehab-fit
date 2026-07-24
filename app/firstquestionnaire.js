import React, { useContext } from "react";
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, SafeAreaView, Alert } from "react-native";
import { LocaleContext } from "../contexts/LocaleContext";
import { router } from "expo-router";
import { showAlert } from "../utils/alert";

const FirstQuestionnaire = () => {
	const { i18n } = useContext(LocaleContext);
	return (
		<SafeAreaView style={styles.container}>
			<Text style={styles.title}>{i18n.t("parq")}</Text>
			<ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
				<Text style={styles.text}>{i18n.t("questionnaireInfo")}</Text>
			</ScrollView>
			<View style={styles.buttonContainer}>
				<TouchableOpacity
					style={styles.button}
					onPress={() => {
						showAlert("", i18n.t("questionnaireNo"), [{ text: "OK", onPress: () => router.replace("/firstsafety") }]);
					}}
				>
					<Text style={styles.buttonText}>{i18n.t("yes")}</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[styles.button, { backgroundColor: "#AAA" }]} //gray button
					onPress={() => {
						showAlert(i18n.t("warning"), i18n.t("questionnaireYes"), [
							{ text: "OK", onPress: () => router.replace("/firstsafety") },
						]);
					}}
				>
					<Text style={styles.buttonText}>{i18n.t("no")}</Text>
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
		padding: 20,
		textAlign: "center",
		backgroundColor: "#f8f9fa",
	},
	scrollView: {
		flex: 1,
		padding: 12,
	},
	scrollViewContent: {
		paddingBottom: 20,
	},
	text: {
		fontSize: 24,
		lineHeight: 32,
		color: "#333",
		textAlign: "left",
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

export default FirstQuestionnaire;
