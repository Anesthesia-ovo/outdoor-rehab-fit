// App Upgrade #5: Session log - list of saved sessions, each with a share button (#7)
import React, { useCallback, useContext, useState } from "react";
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { LocaleContext } from "../../../contexts/LocaleContext";
import { getSessions, deleteSession } from "../../../utils/sessions";
import { formatDuration, formatDateTime } from "../../../utils/dates";
import { shareSession } from "../../../utils/share";
import { showAlert } from "../../../utils/alert";

const SessionLog = () => {
	const { i18n, locale } = useContext(LocaleContext);
	const [sessions, setSessions] = useState([]);

	useFocusEffect(
		useCallback(() => {
			getSessions().then(setSessions);
		}, [])
	);

	const handleShare = (session) => {
		shareSession(session, i18n, locale);
	};

	const handleDelete = (session) => {
		showAlert("", i18n.t("deleteSessionConfirm"), [
			{ text: i18n.t("cancel"), style: "cancel" },
			{
				text: i18n.t("delete"),
				style: "destructive",
				onPress: async () => {
					const next = await deleteSession(session.id);
					setSessions(next);
				},
			},
		]);
	};

	const EMOJIS = { 1: "😞", 2: "🙁", 3: "😐", 4: "🙂", 5: "😄" };

	return (
		<View style={styles.container}>
			<FlatList
				data={sessions}
				keyExtractor={(item) => item.id}
				contentContainerStyle={{ padding: wp("4%"), paddingBottom: hp("15%") }}
				renderItem={({ item }) => (
					<TouchableOpacity
						style={styles.card}
						onPress={() => router.push({ pathname: "/sessionlog/detail", params: { id: item.id } })}
					>
						<View style={styles.cardTop}>
							<MaterialCommunityIcons
								name={item.mode === "home" ? "home-variant" : "tree"}
								size={RFValue(24)}
								color={item.mode === "home" ? "#007BFF" : "#2E8B57"}
							/>
							<View style={{ flex: 1, marginLeft: 10 }}>
								<Text style={styles.cardTitle}>{i18n.t(item.mode === "home" ? "homeSession" : "outdoorSession")}</Text>
								<Text style={styles.cardDate}>{formatDateTime(item.date, locale)}</Text>
							</View>
							{item.emotion ? <Text style={styles.emotion}>{EMOJIS[item.emotion]}</Text> : null}
						</View>
						<View style={styles.cardBottom}>
							<View style={styles.durationBox}>
								<Ionicons name="time-outline" size={RFValue(16)} color="#840B1C" />
								<Text style={styles.duration}>{formatDuration(item.durationSec)}</Text>
							</View>
							{item.exercises?.length > 0 && (
								<Text style={styles.exerciseCount}>
									{i18n.t("exercisesDone")}: {item.exercises.length}
								</Text>
							)}
							<View style={styles.actions}>
								{/* Share button on every saved session (App Upgrade #5/#7) */}
								<TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(item)}>
									<Ionicons name="share-social" size={RFValue(20)} color="#007BFF" />
								</TouchableOpacity>
								<TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
									<Ionicons name="trash-outline" size={RFValue(20)} color="#B00020" />
								</TouchableOpacity>
							</View>
						</View>
					</TouchableOpacity>
				)}
				ListEmptyComponent={() => (
					<View style={styles.empty}>
						<Ionicons name="clipboard-outline" size={RFValue(48)} color="#ccc" />
						<Text style={styles.emptyText}>{i18n.t("noSessions")}</Text>
					</View>
				)}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	card: {
		backgroundColor: "#fff",
		borderRadius: 14,
		padding: 16,
		marginBottom: 14,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.12,
		shadowRadius: 4,
		elevation: 3,
	},
	cardTop: {
		flexDirection: "row",
		alignItems: "center",
	},
	cardTitle: {
		fontSize: RFValue(15),
		fontWeight: "bold",
		color: "#333",
	},
	cardDate: {
		fontSize: RFValue(12),
		color: "#888",
		marginTop: 2,
	},
	emotion: {
		fontSize: RFValue(24),
	},
	cardBottom: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 12,
	},
	durationBox: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FBEAEA",
		borderRadius: 8,
		paddingHorizontal: 10,
		paddingVertical: 5,
		gap: 4,
	},
	duration: {
		fontSize: RFValue(14),
		fontWeight: "bold",
		color: "#840B1C",
		marginLeft: 4,
	},
	exerciseCount: {
		fontSize: RFValue(12),
		color: "#666",
		marginLeft: 12,
		flex: 1,
	},
	actions: {
		flexDirection: "row",
		marginLeft: "auto",
	},
	actionBtn: {
		padding: 6,
		marginLeft: 6,
	},
	empty: {
		alignItems: "center",
		marginTop: hp("15%"),
	},
	emptyText: {
		marginTop: 12,
		fontSize: RFValue(15),
		color: "#999",
	},
});

export default SessionLog;
