// App Upgrade #5: Session record - timer with Start/Resume/Pause + End session
import React, { useContext, useEffect, useRef, useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { LocaleContext } from "../../../contexts/LocaleContext";
import { formatDuration } from "../../../utils/dates";
import { showAlert } from "../../../utils/alert";

const SessionRecord = () => {
	const { i18n } = useContext(LocaleContext);
	const [mode, setMode] = useState(null); // "outdoor" | "home"
	const [seconds, setSeconds] = useState(0);
	const [running, setRunning] = useState(false);
	const [started, setStarted] = useState(false);
	const intervalRef = useRef(null);

	useEffect(() => {
		if (running) {
			intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
		}
		return () => clearInterval(intervalRef.current);
	}, [running]);

	const handleStartPause = () => {
		if (!running) setStarted(true);
		setRunning((r) => !r);
	};

	const handleEnd = () => {
		setRunning(false);
		if (seconds === 0) {
			router.back();
			return;
		}
		router.replace({ pathname: "/session/summary", params: { durationSec: String(seconds), mode } });
	};

	const handleDiscard = () => {
		showAlert("", i18n.t("discardSessionConfirm"), [
			{ text: i18n.t("cancel"), style: "cancel" },
			{ text: i18n.t("discardSession"), style: "destructive", onPress: () => router.back() },
		]);
	};

	// Step 1: choose where this session takes place (outdoor / home practical session)
	if (!mode) {
		return (
			<View style={styles.container}>
				<Text style={styles.modeTitle}>{i18n.t("sessionMode")}</Text>
				<TouchableOpacity style={[styles.modeBtn, { backgroundColor: "#2E8B57" }]} onPress={() => setMode("outdoor")}>
					<MaterialCommunityIcons name="tree" size={RFValue(36)} color="#fff" />
					<Text style={styles.modeBtnText}>{i18n.t("outdoorSession")}</Text>
				</TouchableOpacity>
				<TouchableOpacity style={[styles.modeBtn, { backgroundColor: "#007BFF" }]} onPress={() => setMode("home")}>
					<Ionicons name="home" size={RFValue(36)} color="#fff" />
					<Text style={styles.modeBtnText}>{i18n.t("homeSession")}</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<Text style={styles.modeTag}>{i18n.t(mode === "outdoor" ? "outdoorSession" : "homeSession")}</Text>

			{/* Time in minutes and seconds */}
			<Text style={styles.timer}>{formatDuration(seconds)}</Text>

			{/* Start / Resume / Pause button */}
			<TouchableOpacity style={[styles.mainBtn, running ? styles.pauseBtn : styles.startBtn]} onPress={handleStartPause}>
				<Ionicons name={running ? "pause" : "play"} size={RFValue(30)} color="#fff" />
				<Text style={styles.mainBtnText}>{running ? i18n.t("pause") : started ? i18n.t("resume") : i18n.t("start")}</Text>
			</TouchableOpacity>

			{/* End session button */}
			<TouchableOpacity style={[styles.mainBtn, styles.endBtn]} onPress={handleEnd}>
				<Ionicons name="stop" size={RFValue(30)} color="#fff" />
				<Text style={styles.mainBtnText}>{i18n.t("endSession")}</Text>
			</TouchableOpacity>

			<TouchableOpacity onPress={handleDiscard}>
				<Text style={styles.discardText}>{i18n.t("discardSession")}</Text>
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: wp("10%"),
	},
	modeTitle: {
		fontSize: RFValue(20),
		fontWeight: "bold",
		color: "#333",
		marginBottom: hp("4%"),
	},
	modeBtn: {
		width: "100%",
		borderRadius: 16,
		paddingVertical: hp("4%"),
		alignItems: "center",
		marginBottom: hp("2.5%"),
	},
	modeBtnText: {
		color: "#fff",
		fontSize: RFValue(18),
		fontWeight: "bold",
		marginTop: 8,
	},
	modeTag: {
		fontSize: RFValue(16),
		color: "#666",
		fontWeight: "600",
		marginBottom: hp("2%"),
	},
	timer: {
		fontSize: RFValue(72),
		fontWeight: "bold",
		color: "#333",
		fontVariant: ["tabular-nums"],
		marginBottom: hp("6%"),
	},
	mainBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		width: "100%",
		borderRadius: 50,
		paddingVertical: hp("2.2%"),
		marginBottom: hp("2%"),
		gap: 10,
	},
	startBtn: {
		backgroundColor: "#2E8B57",
	},
	pauseBtn: {
		backgroundColor: "#E9A23B",
	},
	endBtn: {
		backgroundColor: "#B00020",
	},
	mainBtnText: {
		color: "#fff",
		fontSize: RFValue(20),
		fontWeight: "bold",
		marginLeft: 8,
	},
	discardText: {
		marginTop: hp("2%"),
		color: "#999",
		fontSize: RFValue(14),
		textDecorationLine: "underline",
	},
});

export default SessionRecord;
