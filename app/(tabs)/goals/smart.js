// App Upgrade #6: SMART goal setting with written guidance + carry over to next week
import React, { useCallback, useContext, useState } from "react";
import {
	StyleSheet,
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ScrollView,
	Alert,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { Collapsible } from "@/components/Collapsible";
import { LocaleContext } from "../../../contexts/LocaleContext";
import { showAlert } from "../../../utils/alert";
import {
	getGoalState,
	addSmartGoal,
	toggleSmartGoal,
	removeSmartGoal,
	carryOverSmartGoals,
	getCurrentWeekSmartGoals,
	getPastWeekSmartGoals,
} from "../../../utils/goals";

const SmartGoal = () => {
	const { i18n } = useContext(LocaleContext);
	const [text, setText] = useState("");
	const [currentGoals, setCurrentGoals] = useState([]);
	const [pastGoals, setPastGoals] = useState([]);

	const load = useCallback(async () => {
		const state = await getGoalState();
		setCurrentGoals(getCurrentWeekSmartGoals(state));
		setPastGoals(getPastWeekSmartGoals(state));
	}, []);

	useFocusEffect(
		useCallback(() => {
			load();
		}, [load])
	);

	const handleAdd = async () => {
		if (!text.trim()) return;
		await addSmartGoal(text.trim());
		setText("");
		load();
	};

	const handleToggle = async (id) => {
		await toggleSmartGoal(id);
		load();
	};

	const handleRemove = (id) => {
		showAlert("", i18n.t("deleteSessionConfirm"), [
			{ text: i18n.t("cancel"), style: "cancel" },
			{
				text: i18n.t("delete"),
				style: "destructive",
				onPress: async () => {
					await removeSmartGoal(id);
					load();
				},
			},
		]);
	};

	// After each week there is an option to keep the same goals for the following week
	const handleCarryOver = async () => {
		await carryOverSmartGoals();
		showAlert("", i18n.t("goalsCarriedOver"));
		load();
	};

	return (
		<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
			<ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: hp("15%") }}>
				{/* Written guidance on how to write a proper SMART goal */}
				<View style={styles.guidanceBox}>
					<Collapsible title={i18n.t("smartGuidanceTitle")}>
						<Text style={styles.guidanceText}>{i18n.t("smartGuidance")}</Text>
					</Collapsible>
				</View>

				<View style={styles.inputRow}>
					<TextInput
						style={styles.input}
						placeholder={i18n.t("smartPlaceholder")}
						value={text}
						onChangeText={setText}
						multiline
					/>
					<TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
						<Ionicons name="add" size={RFValue(24)} color="#fff" />
					</TouchableOpacity>
				</View>

				<Text style={styles.sectionTitle}>{i18n.t("smartGoals")}</Text>
				{currentGoals.length === 0 && <Text style={styles.empty}>{i18n.t("noSmartGoals")}</Text>}
				{currentGoals.map((goal) => (
					<View key={goal.id} style={styles.goalRow}>
						<TouchableOpacity onPress={() => handleToggle(goal.id)} style={styles.checkArea}>
							<Ionicons
								name={goal.done ? "checkbox" : "square-outline"}
								size={RFValue(24)}
								color={goal.done ? "#2E8B57" : "#888"}
							/>
						</TouchableOpacity>
						<Text style={[styles.goalText, goal.done && styles.goalDone]}>{goal.text}</Text>
						<TouchableOpacity onPress={() => handleRemove(goal.id)}>
							<Ionicons name="trash-outline" size={RFValue(20)} color="#B00020" />
						</TouchableOpacity>
					</View>
				))}

				{pastGoals.length > 0 && (
					<TouchableOpacity style={styles.carryBtn} onPress={handleCarryOver}>
						<Ionicons name="repeat" size={RFValue(18)} color="#fff" />
						<Text style={styles.carryBtnText}>{i18n.t("keepSameGoals")}</Text>
					</TouchableOpacity>
				)}
			</ScrollView>
		</KeyboardAvoidingView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
		paddingHorizontal: wp("5%"),
	},
	guidanceBox: {
		backgroundColor: "#FFF7E6",
		borderRadius: 12,
		padding: 14,
		marginTop: hp("2%"),
		borderWidth: 1,
		borderColor: "#F0E4C2",
	},
	guidanceText: {
		fontSize: RFValue(14),
		lineHeight: RFValue(22),
		color: "#444",
	},
	inputRow: {
		flexDirection: "row",
		alignItems: "flex-end",
		marginTop: hp("2%"),
	},
	input: {
		flex: 1,
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 12,
		padding: 12,
		fontSize: RFValue(15),
		minHeight: RFValue(48),
		backgroundColor: "#f8f9fa",
	},
	addBtn: {
		backgroundColor: "#840B1C",
		borderRadius: 12,
		width: RFValue(48),
		height: RFValue(48),
		justifyContent: "center",
		alignItems: "center",
		marginLeft: 10,
	},
	sectionTitle: {
		fontSize: RFValue(18),
		fontWeight: "bold",
		marginTop: hp("3%"),
		marginBottom: hp("1%"),
		color: "#333",
	},
	empty: {
		fontSize: RFValue(14),
		color: "#999",
		marginVertical: hp("1%"),
	},
	goalRow: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#f8f9fa",
		borderRadius: 12,
		padding: 14,
		marginBottom: 10,
	},
	checkArea: {
		marginRight: 10,
	},
	goalText: {
		flex: 1,
		fontSize: RFValue(15),
		color: "#333",
		marginRight: 10,
	},
	goalDone: {
		textDecorationLine: "line-through",
		color: "#999",
	},
	carryBtn: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#2E8B57",
		borderRadius: 12,
		paddingVertical: 14,
		marginTop: hp("2%"),
		gap: 8,
	},
	carryBtnText: {
		color: "#fff",
		fontSize: RFValue(15),
		fontWeight: "bold",
		marginLeft: 6,
	},
});

export default SmartGoal;
