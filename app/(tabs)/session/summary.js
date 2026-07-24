// App Upgrade #5: Session summary - emotion scale, RPE, show more (journal +
// exercise type record via photo + checkboxes), preset goal progress bars, save & continue
import React, { useContext, useEffect, useState } from "react";
import {
	StyleSheet,
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ScrollView,
	Alert,
	Modal,
	Image,
	FlatList,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { LocaleContext } from "../../../contexts/LocaleContext";
import GoalProgressBars from "../../../components/GoalProgressBars";
import { saveSession } from "../../../utils/sessions";
import { getWeeklyProgress } from "../../../utils/goals";
import { trackSessionCompleted, trackGoalAchieved } from "../../../utils/usage";
import { formatDuration, formatDateTime } from "../../../utils/dates";
import { showAlert } from "../../../utils/alert";

const EMOTIONS = [
	{ value: 1, emoji: "😞" },
	{ value: 2, emoji: "🙁" },
	{ value: 3, emoji: "😐" },
	{ value: 4, emoji: "🙂" },
	{ value: 5, emoji: "😄" },
];

const RPE_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const SessionSummary = () => {
	const { i18n, locale } = useContext(LocaleContext);
	const { durationSec, mode } = useLocalSearchParams();
	const equipmentData = i18n.t("equipmentList", { returnObjects: true });

	const [completedAt] = useState(new Date().toISOString());
	const [emotion, setEmotion] = useState(null);
	const [rpe, setRpe] = useState(null);
	const [showMore, setShowMore] = useState(false);
	const [journal, setJournal] = useState("");
	const [exercises, setExercises] = useState([]); // [{ name, reps, equipmentId }]
	const [types, setTypes] = useState({ aerobic: false, balance: false, muscle: false });
	const [typesTouched, setTypesTouched] = useState(false);
	const [pickerVisible, setPickerVisible] = useState(false);
	const [photoUri, setPhotoUri] = useState(null);
	const [weekly, setWeekly] = useState(null);

	useEffect(() => {
		getWeeklyProgress().then(setWeekly);
	}, []);

	// Auto-fill the three type checkboxes from the exercise table (outdoor users);
	// home users can still toggle them manually.
	useEffect(() => {
		if (typesTouched || exercises.length === 0) return;
		const next = { aerobic: false, balance: false, muscle: false };
		exercises.forEach((ex) => {
			const item = equipmentData.find((e) => e.id === ex.equipmentId);
			if (!item) return;
			["aerobic", "balance", "muscle"].forEach((t) => {
				if (item.categories.includes(t)) next[t] = true;
			});
		});
		setTypes(next);
	}, [exercises]);

	// Exercise type record: take a photo of the equipment / instruction board,
	// then confirm the recognized equipment (image recognition service arrives at a later stage)
	const handleTakePhoto = async () => {
		const permission = await ImagePicker.requestCameraPermissionsAsync();
		let result;
		if (permission.granted) {
			result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
		} else {
			result = await ImagePicker.launchImageLibraryAsync({ quality: 0.5 });
		}
		if (!result.canceled && result.assets?.length) {
			setPhotoUri(result.assets[0].uri);
			setPickerVisible(true);
		}
	};

	const handleSelectEquipment = (item) => {
		setPickerVisible(false);
		setExercises((prev) => [...prev, { name: item.name, reps: "", equipmentId: item.id }]);
	};

	const updateReps = (index, reps) => {
		setExercises((prev) => prev.map((ex, i) => (i === index ? { ...ex, reps } : ex)));
	};

	const removeExercise = (index) => {
		setExercises((prev) => prev.filter((_, i) => i !== index));
	};

	const toggleType = (key) => {
		setTypesTouched(true);
		setTypes((prev) => ({ ...prev, [key]: !prev[key] }));
	};

	const handleSave = async () => {
		const session = {
			id: Date.now().toString(),
			date: completedAt,
			durationSec: Number(durationSec) || 0,
			mode: mode === "home" ? "home" : "outdoor",
			emotion,
			rpe,
			journal,
			exercises: exercises.map((ex) => ({ name: ex.name, reps: ex.reps })),
			types,
		};

		const before = await getWeeklyProgress();
		await saveSession(session);
		await trackSessionCompleted(session.mode);
		const after = await getWeeklyProgress();

		// Count newly achieved preset/WHO goals (App Upgrade #4)
		let newlyAchieved = 0;
		["aerobic", "balance", "muscle"].forEach((t) => {
			const wasAchieved = before.progress[t] >= before.targets[t];
			const isAchieved = after.progress[t] >= after.targets[t];
			if (!wasAchieved && isAchieved) newlyAchieved += 1;
		});
		if (newlyAchieved > 0) await trackGoalAchieved(newlyAchieved);

		const message = newlyAchieved > 0 ? `${i18n.t("sessionSaved")}\n${i18n.t("goalAchievedMsg")}` : i18n.t("sessionSaved");
		showAlert("", message, [{ text: "OK", onPress: () => router.replace("/(tabs)") }]);
	};

	return (
		<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
			<ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: hp("18%") }}>
				{/* Date and time of session completion */}
				<View style={styles.block}>
					<Text style={styles.blockLabel}>{i18n.t("completionTime")}</Text>
					<Text style={styles.blockValue}>{formatDateTime(completedAt, locale)}</Text>
				</View>

				{/* Total session duration */}
				<View style={styles.block}>
					<Text style={styles.blockLabel}>{i18n.t("totalDuration")}</Text>
					<Text style={styles.duration}>{formatDuration(Number(durationSec) || 0)}</Text>
				</View>

				{/* Emotion scale */}
				<View style={styles.block}>
					<Text style={styles.blockLabel}>{i18n.t("emotionScale")}</Text>
					<View style={styles.emotionRow}>
						{EMOTIONS.map((e) => (
							<TouchableOpacity
								key={e.value}
								style={[styles.emotionBtn, emotion === e.value && styles.emotionSelected]}
								onPress={() => setEmotion(e.value)}
							>
								<Text style={styles.emoji}>{e.emoji}</Text>
							</TouchableOpacity>
						))}
					</View>
				</View>

				{/* Rate of perceived exertion scale */}
				<View style={styles.block}>
					<Text style={styles.blockLabel}>{i18n.t("rpeScale")}</Text>
					<View style={styles.rpeRow}>
						{RPE_VALUES.map((v) => (
							<TouchableOpacity
								key={v}
								style={[styles.rpeBtn, rpe === v && styles.rpeSelected]}
								onPress={() => setRpe(v)}
							>
								<Text style={[styles.rpeText, rpe === v && styles.rpeTextSelected]}>{v}</Text>
							</TouchableOpacity>
						))}
					</View>
				</View>

				{/* Show more button */}
				<TouchableOpacity style={styles.showMoreBtn} onPress={() => setShowMore((s) => !s)}>
					<Text style={styles.showMoreText}>{showMore ? i18n.t("showLess") : i18n.t("showMore")}</Text>
					<Ionicons name={showMore ? "chevron-up" : "chevron-down"} size={RFValue(18)} color="#840B1C" />
				</TouchableOpacity>

				{showMore && (
					<View>
						{/* Session journal */}
						<View style={styles.block}>
							<Text style={styles.blockLabel}>{i18n.t("sessionJournal")}</Text>
							<TextInput
								style={styles.journalInput}
								placeholder={i18n.t("journalPlaceholder")}
								value={journal}
								onChangeText={setJournal}
								multiline
							/>
						</View>

						{/* Exercise type record (photo recognition + manual reps) */}
						<View style={styles.block}>
							<Text style={styles.blockLabel}>{i18n.t("exerciseTypeRecord")}</Text>
							<Text style={styles.hint}>{i18n.t("exerciseTypeRecordHint")}</Text>
							{mode !== "home" && (
								<TouchableOpacity style={styles.photoBtn} onPress={handleTakePhoto}>
									<Ionicons name="camera" size={RFValue(20)} color="#fff" />
									<Text style={styles.photoBtnText}>{i18n.t("takePhoto")}</Text>
								</TouchableOpacity>
							)}
							<TouchableOpacity style={styles.addManualBtn} onPress={() => setPickerVisible(true)}>
								<Ionicons name="add-circle-outline" size={RFValue(20)} color="#840B1C" />
								<Text style={styles.addManualText}>{i18n.t("addExercise")}</Text>
							</TouchableOpacity>

							{exercises.length > 0 && (
								<View style={styles.table}>
									{exercises.map((ex, index) => (
										<View key={index} style={styles.tableRow}>
											<Text style={styles.tableName} numberOfLines={2}>
												{ex.name}
											</Text>
											<TextInput
												style={styles.repsInput}
												placeholder={i18n.t("reps")}
												value={ex.reps}
												onChangeText={(v) => updateReps(index, v)}
												keyboardType="number-pad"
											/>
											<TouchableOpacity onPress={() => removeExercise(index)}>
												<Ionicons name="trash-outline" size={RFValue(20)} color="#B00020" />
											</TouchableOpacity>
										</View>
									))}
								</View>
							)}
						</View>

						{/* Three checkboxes: auto-filled from the table, manual for home users */}
						<View style={styles.block}>
							<Text style={styles.blockLabel}>{i18n.t("typeChecklist")}</Text>
							{[
								{ key: "aerobic", label: i18n.t("aerobicDone") },
								{ key: "balance", label: i18n.t("balanceDone") },
								{ key: "muscle", label: i18n.t("muscleDone") },
							].map(({ key, label }) => (
								<TouchableOpacity key={key} style={styles.checkRow} onPress={() => toggleType(key)}>
									<Ionicons
										name={types[key] ? "checkbox" : "square-outline"}
										size={RFValue(24)}
										color={types[key] ? "#2E8B57" : "#888"}
									/>
									<Text style={styles.checkLabel}>{label}</Text>
								</TouchableOpacity>
							))}
						</View>
					</View>
				)}

				{/* Progress bars for three preset goals */}
				<View style={styles.block}>
					<Text style={styles.blockLabel}>{i18n.t("weeklyGoalProgress")}</Text>
					{weekly && <GoalProgressBars i18n={i18n} progress={weekly.progress} targets={weekly.targets} />}
				</View>

				{/* Save and continue */}
				<TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
					<Text style={styles.saveBtnText}>{i18n.t("saveAndContinue")}</Text>
				</TouchableOpacity>
			</ScrollView>

			{/* Equipment picker modal (confirms photo "recognition") */}
			<Modal visible={pickerVisible} animationType="slide" transparent onRequestClose={() => setPickerVisible(false)}>
				<View style={styles.modalOverlay}>
					<View style={styles.modalBox}>
						<Text style={styles.modalTitle}>{i18n.t("chooseEquipment")}</Text>
						{photoUri && <Image source={{ uri: photoUri }} style={styles.photoPreview} />}
						<FlatList
							data={equipmentData}
							keyExtractor={(item) => item.id.toString()}
							renderItem={({ item }) => (
								<TouchableOpacity style={styles.modalItem} onPress={() => handleSelectEquipment(item)}>
									<Image source={item.icon} style={styles.modalIcon} />
									<Text style={styles.modalItemText} numberOfLines={2}>
										{item.name}
									</Text>
								</TouchableOpacity>
							)}
						/>
						<TouchableOpacity style={styles.modalClose} onPress={() => setPickerVisible(false)}>
							<Text style={styles.modalCloseText}>{i18n.t("cancel")}</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
		</KeyboardAvoidingView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
		paddingHorizontal: wp("5%"),
	},
	block: {
		marginTop: hp("2.5%"),
	},
	blockLabel: {
		fontSize: RFValue(16),
		fontWeight: "bold",
		color: "#333",
		marginBottom: 8,
	},
	blockValue: {
		fontSize: RFValue(16),
		color: "#555",
	},
	duration: {
		fontSize: RFValue(40),
		fontWeight: "bold",
		color: "#840B1C",
		fontVariant: ["tabular-nums"],
	},
	emotionRow: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
	emotionBtn: {
		padding: 8,
		borderRadius: 12,
		borderWidth: 2,
		borderColor: "transparent",
	},
	emotionSelected: {
		borderColor: "#840B1C",
		backgroundColor: "#FBEAEA",
	},
	emoji: {
		fontSize: RFValue(30),
	},
	rpeRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 6,
	},
	rpeBtn: {
		width: RFValue(36),
		height: RFValue(36),
		borderRadius: RFValue(18),
		borderWidth: 1,
		borderColor: "#ccc",
		justifyContent: "center",
		alignItems: "center",
		margin: 3,
	},
	rpeSelected: {
		backgroundColor: "#840B1C",
		borderColor: "#840B1C",
	},
	rpeText: {
		fontSize: RFValue(15),
		color: "#555",
	},
	rpeTextSelected: {
		color: "#fff",
		fontWeight: "bold",
	},
	showMoreBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		marginTop: hp("3%"),
		paddingVertical: 12,
		borderWidth: 1.5,
		borderColor: "#840B1C",
		borderRadius: 12,
		gap: 6,
	},
	showMoreText: {
		color: "#840B1C",
		fontSize: RFValue(15),
		fontWeight: "bold",
		marginRight: 4,
	},
	journalInput: {
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 12,
		padding: 12,
		minHeight: hp("12%"),
		fontSize: RFValue(15),
		textAlignVertical: "top",
		backgroundColor: "#f8f9fa",
	},
	hint: {
		fontSize: RFValue(12),
		color: "#888",
		marginBottom: 10,
		lineHeight: RFValue(18),
	},
	photoBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#2E8B57",
		borderRadius: 12,
		paddingVertical: 14,
		gap: 8,
		marginBottom: 10,
	},
	photoBtnText: {
		color: "#fff",
		fontSize: RFValue(15),
		fontWeight: "bold",
		marginLeft: 6,
	},
	addManualBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 12,
		gap: 6,
	},
	addManualText: {
		color: "#840B1C",
		fontSize: RFValue(14),
		fontWeight: "600",
		marginLeft: 4,
	},
	table: {
		marginTop: 6,
		borderWidth: 1,
		borderColor: "#eee",
		borderRadius: 12,
		overflow: "hidden",
	},
	tableRow: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
		gap: 8,
	},
	tableName: {
		flex: 1,
		fontSize: RFValue(14),
		color: "#333",
	},
	repsInput: {
		width: wp("18%"),
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 8,
		padding: 8,
		fontSize: RFValue(14),
		textAlign: "center",
		marginHorizontal: 8,
	},
	checkRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 10,
	},
	checkLabel: {
		fontSize: RFValue(15),
		color: "#333",
		marginLeft: 10,
	},
	saveBtn: {
		backgroundColor: "#840B1C",
		borderRadius: 50,
		paddingVertical: hp("2.2%"),
		alignItems: "center",
		marginTop: hp("4%"),
	},
	saveBtnText: {
		color: "#fff",
		fontSize: RFValue(18),
		fontWeight: "bold",
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "flex-end",
	},
	modalBox: {
		backgroundColor: "#fff",
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		padding: 20,
		maxHeight: hp("70%"),
	},
	modalTitle: {
		fontSize: RFValue(17),
		fontWeight: "bold",
		marginBottom: 12,
		textAlign: "center",
	},
	photoPreview: {
		width: "100%",
		height: hp("15%"),
		borderRadius: 12,
		marginBottom: 12,
		resizeMode: "cover",
	},
	modalItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
	},
	modalIcon: {
		width: RFValue(44),
		height: RFValue(44),
		borderRadius: 8,
		marginRight: 12,
	},
	modalItemText: {
		flex: 1,
		fontSize: RFValue(14),
		color: "#333",
	},
	modalClose: {
		paddingVertical: 14,
		alignItems: "center",
	},
	modalCloseText: {
		color: "#840B1C",
		fontSize: RFValue(15),
		fontWeight: "bold",
	},
});

export default SessionSummary;
