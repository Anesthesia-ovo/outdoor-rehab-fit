import React, { useContext, useEffect, useMemo, useState } from "react";
import {
	Alert,
	Image,
	Modal,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import Slider from "@react-native-community/slider";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { LocaleContext } from "../../../contexts/LocaleContext";
import { useAuth } from "../../../contexts/AuthContext";
import WeeklyGoalProgress from "../../../components/WeeklyGoalProgress";
import { getWeeklyProgress } from "../../../utils/goalStorage";
import { ACTIVITY_TYPE_ICONS, getEquipmentIcon } from "../../../utils/equipmentImages";
import {
	createSessionId,
	formatDateTime,
	formatDuration,
	getOwnerKey,
	saveSession,
} from "../../../utils/sessionStorage";

const TAB_BAR_HEIGHT = 100;

export default function SessionSummaryScreen() {
	const { i18n, locale } = useContext(LocaleContext);
	const { user, isGuest } = useAuth();
	const navigation = useNavigation();
	const insets = useSafeAreaInsets();
	const params = useLocalSearchParams();
	const bottomInset =
		Platform.OS === "ios" ? TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) : Math.max(insets.bottom, 16);

	const startedAt = params.startedAt;
	const endedAt = params.endedAt || new Date().toISOString();
	const durationSec = Number(params.durationSec || 0);
	const sessionType = params.sessionType || "outdoor";

	const equipmentList = i18n.t("equipmentList", { returnObjects: true }) || [];
	const [emotion, setEmotion] = useState(3);
	const [rpe, setRpe] = useState(5);
	const [showMore, setShowMore] = useState(false);
	const [journal, setJournal] = useState("");
	const [exercises, setExercises] = useState([]);
	const [doneAerobic, setDoneAerobic] = useState(false);
	const [doneBalance, setDoneBalance] = useState(false);
	const [doneStrength, setDoneStrength] = useState(false);
	const [pickerVisible, setPickerVisible] = useState(false);
	const [saving, setSaving] = useState(false);
	const [weeklyProgress, setWeeklyProgress] = useState(null);

	useEffect(() => {
		navigation.setOptions({ headerTitle: i18n.t("sessionSummaryTitle") });
	}, [navigation, i18n]);

	useEffect(() => {
		if (isGuest) {
			router.replace("/(tabs)");
			return;
		}
		const load = async () => {
			const progress = await getWeeklyProgress(getOwnerKey(user));
			setWeeklyProgress(progress);
		};
		load();
	}, [isGuest, user]);

	const syncCheckboxesFromExercises = (nextExercises) => {
		const categories = nextExercises.flatMap((item) => item.categories || []);
		if (categories.includes("aerobic")) setDoneAerobic(true);
		if (categories.includes("balance")) setDoneBalance(true);
		if (categories.includes("muscle")) setDoneStrength(true);
	};

	const handleAddEquipment = (equipment) => {
		const next = [
			...exercises,
			{
				id: `${equipment.id}_${Date.now()}`,
				equipmentId: equipment.id,
				name: equipment.name,
				categories: equipment.categories || [],
				reps: "",
			},
		];
		setExercises(next);
		syncCheckboxesFromExercises(next);
		setPickerVisible(false);
	};

	const updateReps = (id, reps) => {
		setExercises((items) => items.map((item) => (item.id === id ? { ...item, reps } : item)));
	};

	const removeExercise = (id) => {
		setExercises((items) => items.filter((item) => item.id !== id));
	};

	const handleSave = async () => {
		const ownerKey = getOwnerKey(user);
		if (!ownerKey) {
			Alert.alert(i18n.t("warning"), i18n.t("guestRestrictedMessage"));
			return;
		}

		setSaving(true);
		try {
			await saveSession({
				id: createSessionId(),
				ownerKey,
				sessionType,
				startedAt,
				endedAt,
				durationSec,
				emotionScale: Math.round(emotion),
				rpeScale: Math.round(rpe),
				journal: journal.trim(),
				exercises: exercises.map((item) => ({
					equipmentId: item.equipmentId,
					name: item.name,
					categories: item.categories,
					reps: item.reps ? Number(item.reps) : null,
				})),
				doneAerobic,
				doneBalance,
				doneStrength,
				createdAt: new Date().toISOString(),
			});

			Alert.alert("", i18n.t("sessionSaved"), [
				{ text: "OK", onPress: () => router.replace("/(tabs)") },
			]);
		} catch (error) {
			console.error("Error saving session", error);
			Alert.alert(i18n.t("warning"), String(error?.message || error));
		} finally {
			setSaving(false);
		}
	};

	const checkboxItems = useMemo(
		() => [
			{
				key: "aerobic",
				label: i18n.t("doneAerobic"),
				value: doneAerobic,
				setter: setDoneAerobic,
				icon: ACTIVITY_TYPE_ICONS.aerobic,
			},
			{
				key: "balance",
				label: i18n.t("doneBalance"),
				value: doneBalance,
				setter: setDoneBalance,
				icon: ACTIVITY_TYPE_ICONS.balance,
			},
			{
				key: "strength",
				label: i18n.t("doneStrength"),
				value: doneStrength,
				setter: setDoneStrength,
				icon: ACTIVITY_TYPE_ICONS.strength,
			},
		],
		[doneAerobic, doneBalance, doneStrength, i18n]
	);

	return (
		<>
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={[styles.container, { paddingBottom: bottomInset + 20 }]}
				keyboardShouldPersistTaps="handled"
			>
				<View style={styles.card}>
					<Text style={styles.metaLabel}>{i18n.t("sessionCompletedAt")}</Text>
					<Text style={styles.metaValue}>{formatDateTime(endedAt, locale)}</Text>
					<Text style={styles.metaLabel}>{i18n.t("sessionDuration")}</Text>
					<Text style={styles.metaValue}>{formatDuration(durationSec)}</Text>
					<Text style={styles.metaLabel}>{i18n.t("sessionType")}</Text>
					<Text style={styles.metaValue}>
						{sessionType === "home" ? i18n.t("sessionTypeHome") : i18n.t("sessionTypeOutdoor")}
					</Text>
				</View>

				<View style={styles.card}>
					<Text style={styles.sectionTitle}>{i18n.t("emotionScale")}</Text>
					<Text style={styles.hint}>{i18n.t("emotionHint")}</Text>
					<Text style={styles.scaleValue}>{Math.round(emotion)}</Text>
					<Slider
						style={styles.slider}
						minimumValue={1}
						maximumValue={5}
						step={1}
						value={emotion}
						onValueChange={setEmotion}
						minimumTrackTintColor="#840B1C"
						maximumTrackTintColor="#ddd"
					/>
				</View>

				<View style={styles.card}>
					<Text style={styles.sectionTitle}>{i18n.t("rpeScale")}</Text>
					<Text style={styles.hint}>{i18n.t("rpeHint")}</Text>
					<Text style={styles.scaleValue}>{Math.round(rpe)}</Text>
					<Slider
						style={styles.slider}
						minimumValue={1}
						maximumValue={10}
						step={1}
						value={rpe}
						onValueChange={setRpe}
						minimumTrackTintColor="#840B1C"
						maximumTrackTintColor="#ddd"
					/>
				</View>

				{weeklyProgress ? (
					<WeeklyGoalProgress progress={weeklyProgress} showCalendar={false} compact />
				) : (
					<View style={styles.card}>
						<Text style={styles.sectionTitle}>{i18n.t("goalProgressTitle")}</Text>
					</View>
				)}

				<TouchableOpacity style={styles.showMoreButton} onPress={() => setShowMore((value) => !value)}>
					<Text style={styles.showMoreText}>{showMore ? i18n.t("hideMore") : i18n.t("showMore")}</Text>
					<Ionicons name={showMore ? "chevron-up" : "chevron-down"} size={18} color="#840B1C" />
				</TouchableOpacity>

				{showMore && (
					<>
						<View style={styles.card}>
							<Text style={styles.sectionTitle}>{i18n.t("sessionJournal")}</Text>
							<TextInput
								style={styles.journalInput}
								value={journal}
								onChangeText={setJournal}
								multiline
								placeholder={i18n.t("sessionJournalPlaceholder")}
								placeholderTextColor="#999"
							/>
						</View>

						<View style={styles.card}>
							<Text style={styles.sectionTitle}>{i18n.t("exerciseRecords")}</Text>
							{exercises.map((item) => {
								const iconSource = getEquipmentIcon(equipmentList, item.equipmentId);
								return (
									<View key={item.id} style={styles.exerciseRow}>
										{iconSource ? <Image source={iconSource} style={styles.exerciseThumb} /> : null}
										<View style={styles.exerciseInfo}>
											<Text style={styles.exerciseName}>{item.name}</Text>
											<TextInput
												style={styles.repsInput}
												value={item.reps}
												onChangeText={(text) => updateReps(item.id, text.replace(/[^0-9]/g, ""))}
												keyboardType="number-pad"
												placeholder={i18n.t("repsPlaceholder")}
												placeholderTextColor="#999"
											/>
											<TouchableOpacity onPress={() => removeExercise(item.id)}>
												<Text style={styles.removeText}>{i18n.t("removeExercise")}</Text>
											</TouchableOpacity>
										</View>
									</View>
								);
							})}
							{sessionType !== "home" && (
								<TouchableOpacity style={styles.addButton} onPress={() => setPickerVisible(true)}>
									<Ionicons name="add-circle-outline" size={20} color="#840B1C" />
									<Text style={styles.addButtonText}>{i18n.t("addExercise")}</Text>
								</TouchableOpacity>
							)}
						</View>

						<View style={styles.card}>
							<Text style={styles.sectionTitle}>{i18n.t("activityTypesDone")}</Text>
							{checkboxItems.map((item) => (
								<TouchableOpacity
									key={item.key}
									style={styles.checkboxRow}
									onPress={() => item.setter(!item.value)}
								>
									<Image source={item.icon} style={styles.activityIcon} />
									<Ionicons
										name={item.value ? "checkbox" : "square-outline"}
										size={24}
										color="#840B1C"
									/>
									<Text style={styles.checkboxLabel}>{item.label}</Text>
								</TouchableOpacity>
							))}
						</View>
					</>
				)}

				<TouchableOpacity
					style={[styles.saveButton, saving && styles.buttonDisabled]}
					onPress={handleSave}
					disabled={saving}
				>
					<Text style={styles.saveButtonText}>{i18n.t("saveAndContinue")}</Text>
				</TouchableOpacity>
			</ScrollView>

			<Modal visible={pickerVisible} animationType="slide" onRequestClose={() => setPickerVisible(false)}>
				<View style={styles.modalContainer}>
					<View style={styles.modalHeader}>
						<Text style={styles.modalTitle}>{i18n.t("selectEquipment")}</Text>
						<TouchableOpacity onPress={() => setPickerVisible(false)}>
							<Ionicons name="close" size={28} color="#333" />
						</TouchableOpacity>
					</View>
					<ScrollView contentContainerStyle={styles.modalList}>
						{equipmentList.map((item) => (
							<TouchableOpacity key={item.id} style={styles.modalItem} onPress={() => handleAddEquipment(item)}>
								{item.icon ? <Image source={item.icon} style={styles.modalThumb} /> : null}
								<Text style={styles.modalItemText}>{item.name}</Text>
							</TouchableOpacity>
						))}
					</ScrollView>
				</View>
			</Modal>
		</>
	);
}

const styles = StyleSheet.create({
	scroll: {
		flex: 1,
		backgroundColor: "#f7f7f7",
	},
	container: {
		padding: wp("5%"),
	},
	card: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
	},
	metaLabel: {
		fontSize: RFValue(12),
		color: "#888",
		marginTop: 6,
	},
	metaValue: {
		fontSize: RFValue(16),
		fontWeight: "600",
		color: "#333",
		marginTop: 2,
	},
	sectionTitle: {
		fontSize: RFValue(15),
		fontWeight: "bold",
		color: "#333",
		marginBottom: 6,
	},
	hint: {
		fontSize: RFValue(12),
		color: "#777",
		marginBottom: 8,
	},
	scaleValue: {
		fontSize: RFValue(28),
		fontWeight: "bold",
		color: "#840B1C",
		textAlign: "center",
	},
	slider: {
		width: "100%",
		height: 40,
	},
	progressPlaceholder: {
		gap: 8,
		marginTop: 8,
	},
	progressBar: {
		height: 10,
		width: "70%",
		borderRadius: 6,
		backgroundColor: "#E8CCB0",
	},
	showMoreButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
		paddingVertical: 10,
		marginBottom: 8,
	},
	showMoreText: {
		color: "#840B1C",
		fontSize: RFValue(14),
		fontWeight: "bold",
	},
	journalInput: {
		minHeight: 90,
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 10,
		padding: 12,
		textAlignVertical: "top",
		fontSize: RFValue(14),
		color: "#333",
	},
	exerciseRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
		paddingVertical: 12,
		gap: 12,
	},
	exerciseThumb: {
		width: 64,
		height: 64,
		borderRadius: 10,
		backgroundColor: "#f0f0f0",
	},
	exerciseInfo: {
		flex: 1,
		gap: 8,
	},
	exerciseName: {
		fontSize: RFValue(14),
		fontWeight: "600",
		color: "#333",
	},
	repsInput: {
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 8,
		paddingHorizontal: 10,
		paddingVertical: 8,
		fontSize: RFValue(14),
	},
	removeText: {
		color: "#840B1C",
		fontSize: RFValue(12),
	},
	addButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginTop: 12,
	},
	addButtonText: {
		color: "#840B1C",
		fontSize: RFValue(14),
		fontWeight: "600",
	},
	checkboxRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingVertical: 10,
	},
	activityIcon: {
		width: 36,
		height: 36,
		resizeMode: "contain",
	},
	checkboxLabel: {
		fontSize: RFValue(14),
		color: "#333",
		flex: 1,
	},
	saveButton: {
		backgroundColor: "#840B1C",
		borderRadius: 50,
		paddingVertical: 16,
		alignItems: "center",
		marginTop: 8,
	},
	saveButtonText: {
		color: "#fff",
		fontSize: RFValue(16),
		fontWeight: "bold",
	},
	buttonDisabled: {
		opacity: 0.7,
	},
	modalContainer: {
		flex: 1,
		backgroundColor: "#fff",
		paddingTop: 50,
	},
	modalHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingBottom: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
	},
	modalTitle: {
		fontSize: RFValue(18),
		fontWeight: "bold",
	},
	modalList: {
		padding: 16,
	},
	modalItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
	},
	modalThumb: {
		width: 52,
		height: 52,
		borderRadius: 8,
		backgroundColor: "#f0f0f0",
	},
	modalItemText: {
		flex: 1,
		fontSize: RFValue(15),
		color: "#333",
	},
});
