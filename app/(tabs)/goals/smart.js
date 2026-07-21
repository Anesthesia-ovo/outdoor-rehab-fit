import React, { useContext, useEffect, useState } from "react";
import {
	Alert,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { router, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import { LocaleContext } from "../../../contexts/LocaleContext";
import { useAuth } from "../../../contexts/AuthContext";
import { createSmartGoalId, getGoalsForUser, setSmartGoals } from "../../../utils/goalStorage";
import { getOwnerKey } from "../../../utils/sessionStorage";

const TAB_BAR_HEIGHT = 100;

export default function SmartGoalScreen() {
	const { i18n } = useContext(LocaleContext);
	const { user, isGuest } = useAuth();
	const navigation = useNavigation();
	const insets = useSafeAreaInsets();
	const bottomInset =
		Platform.OS === "ios" ? TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) : Math.max(insets.bottom, 16);

	const [goals, setGoals] = useState([{ id: createSmartGoalId(), text: "" }]);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		navigation.setOptions({ headerTitle: i18n.t("goalSmartTitle") });
	}, [navigation, i18n]);

	useEffect(() => {
		if (isGuest) {
			router.replace("/(tabs)");
			return;
		}
		const load = async () => {
			const data = await getGoalsForUser(getOwnerKey(user));
			if (data?.smartGoals?.length) {
				setGoals(data.smartGoals.map((item) => ({ id: item.id, text: item.text })));
			}
		};
		load();
	}, [isGuest, user]);

	const updateText = (id, text) => {
		setGoals((items) => items.map((item) => (item.id === id ? { ...item, text } : item)));
	};

	const addGoal = () => {
		setGoals((items) => [...items, { id: createSmartGoalId(), text: "" }]);
	};

	const removeGoal = (id) => {
		setGoals((items) => (items.length <= 1 ? items : items.filter((item) => item.id !== id)));
	};

	const handleSave = async () => {
		const ownerKey = getOwnerKey(user);
		if (!ownerKey) {
			return;
		}
		const cleaned = goals
			.map((item) => ({ id: item.id, text: item.text.trim() }))
			.filter((item) => item.text.length > 0);

		setSaving(true);
		try {
			await setSmartGoals(ownerKey, cleaned);
			Alert.alert("", i18n.t("goalSmartSaved"), [{ text: "OK", onPress: () => router.back() }]);
		} catch (error) {
			Alert.alert(i18n.t("warning"), String(error?.message || error));
		} finally {
			setSaving(false);
		}
	};

	return (
		<ScrollView
			style={styles.scroll}
			contentContainerStyle={[styles.container, { paddingBottom: bottomInset + 20 }]}
			keyboardShouldPersistTaps="handled"
		>
			<View style={styles.card}>
				<Text style={styles.sectionTitle}>{i18n.t("goalSmartGuidanceTitle")}</Text>
				<Text style={styles.guidance}>{i18n.t("goalSmartGuidance")}</Text>
			</View>

			{goals.map((item, index) => (
				<View key={item.id} style={styles.card}>
					<View style={styles.rowHeader}>
						<Text style={styles.sectionTitle}>
							{i18n.t("goalSmart")} {index + 1}
						</Text>
						{goals.length > 1 && (
							<TouchableOpacity onPress={() => removeGoal(item.id)}>
								<Text style={styles.removeText}>{i18n.t("goalSmartRemove")}</Text>
							</TouchableOpacity>
						)}
					</View>
					<TextInput
						style={styles.input}
						value={item.text}
						onChangeText={(text) => updateText(item.id, text)}
						multiline
						placeholder={i18n.t("goalSmartPlaceholder")}
						placeholderTextColor="#999"
					/>
				</View>
			))}

			<TouchableOpacity style={styles.addButton} onPress={addGoal}>
				<Ionicons name="add-circle-outline" size={22} color="#840B1C" />
				<Text style={styles.addButtonText}>{i18n.t("goalSmartAdd")}</Text>
			</TouchableOpacity>

			<TouchableOpacity
				style={[styles.saveButton, saving && styles.disabled]}
				onPress={handleSave}
				disabled={saving}
			>
				<Text style={styles.saveButtonText}>{i18n.t("goalSmartSave")}</Text>
			</TouchableOpacity>
		</ScrollView>
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
	sectionTitle: {
		fontSize: RFValue(15),
		fontWeight: "bold",
		color: "#333",
		marginBottom: 8,
	},
	guidance: {
		fontSize: RFValue(13),
		color: "#555",
		lineHeight: RFValue(22),
	},
	rowHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	removeText: {
		color: "#840B1C",
		fontSize: RFValue(12),
		fontWeight: "600",
	},
	input: {
		minHeight: 90,
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 10,
		padding: 12,
		textAlignVertical: "top",
		fontSize: RFValue(14),
		color: "#333",
	},
	addButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginBottom: 16,
		paddingVertical: 8,
	},
	addButtonText: {
		color: "#840B1C",
		fontSize: RFValue(14),
		fontWeight: "600",
	},
	saveButton: {
		backgroundColor: "#840B1C",
		borderRadius: 50,
		paddingVertical: 16,
		alignItems: "center",
	},
	saveButtonText: {
		color: "#fff",
		fontSize: RFValue(16),
		fontWeight: "bold",
	},
	disabled: {
		opacity: 0.7,
	},
});
