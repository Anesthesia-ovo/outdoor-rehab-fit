import React, { useContext, useEffect, useMemo, useState } from "react";
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import { LocaleContext } from "../../../contexts/LocaleContext";
import { useAuth } from "../../../contexts/AuthContext";
import { ACTIVITY_TYPE_ICONS, getEquipmentIcon } from "../../../utils/equipmentImages";
import {
	deleteSession,
	formatDateTime,
	formatDuration,
	getSessionById,
} from "../../../utils/sessionStorage";

const TAB_BAR_HEIGHT = 100;

export default function SessionDetailScreen() {
	const { i18n, locale } = useContext(LocaleContext);
	const { isGuest } = useAuth();
	const navigation = useNavigation();
	const insets = useSafeAreaInsets();
	const { id } = useLocalSearchParams();
	const bottomInset =
		Platform.OS === "ios" ? TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) : Math.max(insets.bottom, 16);
	const [session, setSession] = useState(null);
	const equipmentList = i18n.t("equipmentList", { returnObjects: true }) || [];

	useEffect(() => {
		navigation.setOptions({ headerTitle: i18n.t("sessionDetailTitle") });
	}, [navigation, i18n]);

	useEffect(() => {
		if (isGuest) {
			router.replace("/(tabs)");
			return;
		}

		const load = async () => {
			const data = await getSessionById(id);
			setSession(data);
		};
		load();
	}, [id, isGuest]);

	const activityItems = useMemo(
		() => [
			{
				key: "aerobic",
				label: i18n.t("doneAerobic"),
				done: !!session?.doneAerobic,
				icon: ACTIVITY_TYPE_ICONS.aerobic,
			},
			{
				key: "balance",
				label: i18n.t("doneBalance"),
				done: !!session?.doneBalance,
				icon: ACTIVITY_TYPE_ICONS.balance,
			},
			{
				key: "strength",
				label: i18n.t("doneStrength"),
				done: !!session?.doneStrength,
				icon: ACTIVITY_TYPE_ICONS.strength,
			},
		],
		[i18n, session]
	);

	const handleDelete = () => {
		Alert.alert(i18n.t("deleteSession"), i18n.t("deleteSessionConfirm"), [
			{ text: i18n.t("cancel"), style: "cancel" },
			{
				text: i18n.t("confirm"),
				style: "destructive",
				onPress: async () => {
					await deleteSession(id);
					router.replace("/session/log");
				},
			},
		]);
	};

	if (!session) {
		return (
			<View style={styles.empty}>
				<Text style={styles.emptyText}>{i18n.t("noSessions")}</Text>
			</View>
		);
	}

	const isOutdoor = session.sessionType !== "home";

	return (
		<ScrollView contentContainerStyle={[styles.container, { paddingBottom: bottomInset + 20 }]}>
			<View style={styles.card}>
				<Text style={styles.label}>{i18n.t("sessionCompletedAt")}</Text>
				<Text style={styles.value}>{formatDateTime(session.endedAt, locale)}</Text>
				<Text style={styles.label}>{i18n.t("sessionDuration")}</Text>
				<Text style={styles.value}>{formatDuration(session.durationSec)}</Text>
				<Text style={styles.label}>{i18n.t("sessionType")}</Text>
				<Text style={styles.value}>
					{session.sessionType === "home" ? i18n.t("sessionTypeHome") : i18n.t("sessionTypeOutdoor")}
				</Text>
				<Text style={styles.label}>{i18n.t("emotionScale")}</Text>
				<Text style={styles.value}>{session.emotionScale}</Text>
				<Text style={styles.label}>{i18n.t("rpeScale")}</Text>
				<Text style={styles.value}>{session.rpeScale}</Text>
			</View>

			{!!session.journal && (
				<View style={styles.card}>
					<Text style={styles.sectionTitle}>{i18n.t("sessionJournal")}</Text>
					<Text style={styles.body}>{session.journal}</Text>
				</View>
			)}

			{isOutdoor && (
				<View style={styles.card}>
					<Text style={styles.sectionTitle}>{i18n.t("exerciseRecords")}</Text>
					{(session.exercises || []).length === 0 ? (
						<Text style={styles.body}>{i18n.t("noneSelected")}</Text>
					) : (
						session.exercises.map((item, index) => {
							const iconSource = getEquipmentIcon(equipmentList, item.equipmentId);
							return (
								<View key={`${item.equipmentId}_${index}`} style={styles.exerciseRow}>
									{iconSource ? <Image source={iconSource} style={styles.exerciseThumb} /> : null}
									<View style={styles.exerciseInfo}>
										<Text style={styles.exerciseName}>{item.name}</Text>
										<Text style={styles.exerciseReps}>
											{i18n.t("reps")}: {item.reps ?? "-"}
										</Text>
									</View>
								</View>
							);
						})
					)}
				</View>
			)}

			<View style={styles.card}>
				<Text style={styles.sectionTitle}>{i18n.t("activityTypesDone")}</Text>
				{activityItems.map((item) => (
					<View key={item.key} style={styles.activityRow}>
						<Image source={item.icon} style={styles.activityIcon} />
						<Text style={styles.activityLabel}>{item.label}</Text>
						<Text style={styles.activityStatus}>{item.done ? "✓" : "—"}</Text>
					</View>
				))}
			</View>

			<TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
				<Text style={styles.deleteButtonText}>{i18n.t("deleteSession")}</Text>
			</TouchableOpacity>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: wp("5%"),
		backgroundColor: "#f7f7f7",
	},
	empty: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	emptyText: {
		fontSize: RFValue(15),
		color: "#888",
	},
	card: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
	},
	label: {
		marginTop: 8,
		fontSize: RFValue(12),
		color: "#888",
	},
	value: {
		fontSize: RFValue(16),
		fontWeight: "600",
		color: "#333",
	},
	sectionTitle: {
		fontSize: RFValue(15),
		fontWeight: "bold",
		marginBottom: 8,
		color: "#333",
	},
	body: {
		fontSize: RFValue(14),
		color: "#444",
		lineHeight: RFValue(22),
		marginBottom: 4,
	},
	exerciseRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
	},
	exerciseThumb: {
		width: 64,
		height: 64,
		borderRadius: 10,
		backgroundColor: "#f0f0f0",
	},
	exerciseInfo: {
		flex: 1,
	},
	exerciseName: {
		fontSize: RFValue(14),
		fontWeight: "600",
		color: "#333",
	},
	exerciseReps: {
		marginTop: 4,
		fontSize: RFValue(13),
		color: "#666",
	},
	activityRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: "#f5f5f5",
	},
	activityIcon: {
		width: 36,
		height: 36,
		resizeMode: "contain",
	},
	activityLabel: {
		flex: 1,
		fontSize: RFValue(14),
		color: "#333",
	},
	activityStatus: {
		fontSize: RFValue(16),
		fontWeight: "bold",
		color: "#840B1C",
		minWidth: 24,
		textAlign: "center",
	},
	deleteButton: {
		marginTop: 8,
		borderRadius: 50,
		borderWidth: 1,
		borderColor: "#840B1C",
		paddingVertical: 14,
		alignItems: "center",
		backgroundColor: "#fff",
	},
	deleteButtonText: {
		color: "#840B1C",
		fontSize: RFValue(15),
		fontWeight: "bold",
	},
});
