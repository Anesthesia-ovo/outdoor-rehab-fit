import React, { useContext, useEffect, useRef, useState } from "react";
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { LocaleContext } from "../../../contexts/LocaleContext";
import { useAuth } from "../../../contexts/AuthContext";
import { showGuestRestrictionAlert } from "../../../utils/accessControl";
import { formatDuration } from "../../../utils/sessionStorage";

const TAB_BAR_HEIGHT = 100;

export default function SessionTimerScreen() {
	const { i18n } = useContext(LocaleContext);
	const { isGuest } = useAuth();
	const navigation = useNavigation();
	const insets = useSafeAreaInsets();
	const bottomInset =
		Platform.OS === "ios" ? TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) : Math.max(insets.bottom, 16);

	const [elapsedSec, setElapsedSec] = useState(0);
	const [isRunning, setIsRunning] = useState(false);
	const [startedAt, setStartedAt] = useState(null);
	const [sessionType, setSessionType] = useState("outdoor");
	const intervalRef = useRef(null);

	useEffect(() => {
		navigation.setOptions({ headerTitle: i18n.t("sessionTimerTitle") });
	}, [navigation, i18n]);

	useEffect(() => {
		if (isGuest) {
			showGuestRestrictionAlert(i18n);
			router.replace("/(tabs)");
		}
	}, [isGuest, i18n]);

	useEffect(() => {
		if (isRunning) {
			intervalRef.current = setInterval(() => {
				setElapsedSec((value) => value + 1);
			}, 1000);
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [isRunning]);

	const handleToggleTimer = () => {
		if (!isRunning && !startedAt) {
			setStartedAt(new Date().toISOString());
		}
		setIsRunning((value) => !value);
	};

	const handleEnd = () => {
		if (elapsedSec === 0 && !startedAt) {
			Alert.alert(i18n.t("warning"), i18n.t("sessionNotStarted"));
			return;
		}

		const wasRunning = isRunning;
		setIsRunning(false);
		Alert.alert(i18n.t("discardSessionTitle"), i18n.t("discardSessionMessage"), [
			{ text: i18n.t("cancelTimer"), style: "cancel", onPress: () => setIsRunning(wasRunning) },
			{
				text: i18n.t("continueToSummary"),
				onPress: () => {
					router.replace({
						pathname: "/session/summary",
						params: {
							startedAt: startedAt || new Date().toISOString(),
							endedAt: new Date().toISOString(),
							durationSec: String(elapsedSec),
							sessionType,
						},
					});
				},
			},
		]);
	};

	return (
		<View style={[styles.container, { paddingBottom: bottomInset }]}>
			<Text style={styles.label}>{i18n.t("sessionType")}</Text>
			<View style={styles.typeRow}>
				<TouchableOpacity
					style={[styles.typeChip, sessionType === "outdoor" && styles.typeChipActive]}
					onPress={() => setSessionType("outdoor")}
				>
					<Text style={[styles.typeChipText, sessionType === "outdoor" && styles.typeChipTextActive]}>
						{i18n.t("sessionTypeOutdoor")}
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[styles.typeChip, sessionType === "home" && styles.typeChipActive]}
					onPress={() => setSessionType("home")}
				>
					<Text style={[styles.typeChipText, sessionType === "home" && styles.typeChipTextActive]}>
						{i18n.t("sessionTypeHome")}
					</Text>
				</TouchableOpacity>
			</View>

			<Text style={styles.timer}>{formatDuration(elapsedSec)}</Text>

			<View style={styles.actions}>
				<TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={handleToggleTimer}>
					<Text style={styles.secondaryButtonText}>
						{isRunning ? i18n.t("sessionPause") : elapsedSec === 0 ? i18n.t("sessionStart") : i18n.t("sessionResume")}
					</Text>
				</TouchableOpacity>
				<TouchableOpacity style={[styles.actionButton, styles.primaryButton]} onPress={handleEnd}>
					<Text style={styles.primaryButtonText}>{i18n.t("sessionEnd")}</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
		alignItems: "center",
		paddingHorizontal: wp("8%"),
		paddingTop: hp("4%"),
	},
	label: {
		alignSelf: "flex-start",
		fontSize: RFValue(14),
		fontWeight: "600",
		color: "#333",
		marginBottom: 8,
	},
	typeRow: {
		flexDirection: "row",
		alignSelf: "stretch",
		gap: 10,
		marginBottom: hp("6%"),
	},
	typeChip: {
		flex: 1,
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 24,
		paddingVertical: 10,
		alignItems: "center",
		backgroundColor: "#fff",
	},
	typeChipActive: {
		borderColor: "#840B1C",
		backgroundColor: "#840B1C",
	},
	typeChipText: {
		fontSize: RFValue(14),
		color: "#333",
		fontWeight: "600",
	},
	typeChipTextActive: {
		color: "#fff",
	},
	timer: {
		fontSize: RFValue(56),
		fontWeight: "bold",
		color: "#840B1C",
		letterSpacing: 2,
		marginBottom: hp("8%"),
	},
	actions: {
		width: "100%",
		gap: 14,
	},
	actionButton: {
		borderRadius: 50,
		paddingVertical: hp("2%"),
		alignItems: "center",
	},
	primaryButton: {
		backgroundColor: "#840B1C",
	},
	primaryButtonText: {
		color: "#fff",
		fontSize: RFValue(16),
		fontWeight: "bold",
	},
	secondaryButton: {
		borderWidth: 1,
		borderColor: "#840B1C",
		backgroundColor: "#fff",
	},
	secondaryButtonText: {
		color: "#840B1C",
		fontSize: RFValue(16),
		fontWeight: "bold",
	},
});
