import React, { useContext, useEffect, useState } from "react";
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Slider from "@react-native-community/slider";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { LocaleContext } from "../../../contexts/LocaleContext";
import { useAuth } from "../../../contexts/AuthContext";
import {
	GOAL_TYPES,
	MAX_TARGET_DAYS,
	MIN_TARGET_DAYS,
	getGoalsForUser,
	setPresetTarget,
} from "../../../utils/goalStorage";
import { getOwnerKey } from "../../../utils/sessionStorage";

const TAB_BAR_HEIGHT = 100;

export default function EditPresetGoalScreen() {
	const { i18n } = useContext(LocaleContext);
	const { user, isGuest } = useAuth();
	const navigation = useNavigation();
	const insets = useSafeAreaInsets();
	const { type } = useLocalSearchParams();
	const bottomInset =
		Platform.OS === "ios" ? TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) : Math.max(insets.bottom, 16);

	const goalType = [GOAL_TYPES.AEROBIC, GOAL_TYPES.BALANCE, GOAL_TYPES.STRENGTH].includes(type)
		? type
		: GOAL_TYPES.AEROBIC;

	const titleMap = {
		[GOAL_TYPES.AEROBIC]: i18n.t("goalAerobic"),
		[GOAL_TYPES.BALANCE]: i18n.t("goalBalance"),
		[GOAL_TYPES.STRENGTH]: i18n.t("goalStrength"),
	};

	const [days, setDays] = useState(3);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		navigation.setOptions({ headerTitle: titleMap[goalType] });
	}, [navigation, goalType, i18n]);

	useEffect(() => {
		if (isGuest) {
			router.replace("/(tabs)");
			return;
		}
		const load = async () => {
			const goals = await getGoalsForUser(getOwnerKey(user));
			setDays(goals?.targets?.[goalType] ?? 3);
		};
		load();
	}, [goalType, isGuest, user]);

	const handleSave = async () => {
		const ownerKey = getOwnerKey(user);
		if (!ownerKey) {
			return;
		}
		setSaving(true);
		try {
			await setPresetTarget(ownerKey, goalType, days);
			Alert.alert("", i18n.t("goalTargetSaved"), [
				{ text: "OK", onPress: () => router.back() },
			]);
		} catch (error) {
			Alert.alert(i18n.t("warning"), String(error?.message || error));
		} finally {
			setSaving(false);
		}
	};

	return (
		<View style={[styles.container, { paddingBottom: bottomInset }]}>
			<Text style={styles.label}>{i18n.t("goalTargetDays")}</Text>
			<Text style={styles.value}>
				{Math.round(days)} {i18n.t("goalDaysUnit")}
			</Text>
			<Slider
				style={styles.slider}
				minimumValue={MIN_TARGET_DAYS}
				maximumValue={MAX_TARGET_DAYS}
				step={1}
				value={days}
				onValueChange={setDays}
				minimumTrackTintColor="#840B1C"
				maximumTrackTintColor="#ddd"
			/>
			<View style={styles.rangeRow}>
				<Text style={styles.rangeText}>{MIN_TARGET_DAYS}</Text>
				<Text style={styles.rangeText}>{MAX_TARGET_DAYS}</Text>
			</View>
			<TouchableOpacity
				style={[styles.saveButton, saving && styles.disabled]}
				onPress={handleSave}
				disabled={saving}
			>
				<Text style={styles.saveButtonText}>{i18n.t("goalSaveTarget")}</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
		paddingHorizontal: wp("8%"),
		paddingTop: hp("5%"),
	},
	label: {
		fontSize: RFValue(15),
		fontWeight: "600",
		color: "#333",
		marginBottom: 12,
	},
	value: {
		fontSize: RFValue(36),
		fontWeight: "bold",
		color: "#840B1C",
		textAlign: "center",
		marginBottom: 20,
	},
	slider: {
		width: "100%",
		height: 40,
	},
	rangeRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: hp("6%"),
	},
	rangeText: {
		fontSize: RFValue(12),
		color: "#888",
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
