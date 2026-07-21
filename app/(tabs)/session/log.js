import React, { useCallback, useContext, useState } from "react";
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router, useFocusEffect, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { LocaleContext } from "../../../contexts/LocaleContext";
import { useAuth } from "../../../contexts/AuthContext";
import { showGuestRestrictionAlert } from "../../../utils/accessControl";
import {
	formatDateTime,
	formatDuration,
	getOwnerKey,
	getSessionsForUser,
} from "../../../utils/sessionStorage";

const TAB_BAR_HEIGHT = 100;

export default function SessionLogScreen() {
	const { i18n, locale } = useContext(LocaleContext);
	const { user, isGuest } = useAuth();
	const navigation = useNavigation();
	const insets = useSafeAreaInsets();
	const bottomInset =
		Platform.OS === "ios" ? TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) : Math.max(insets.bottom, 16);
	const [sessions, setSessions] = useState([]);

	useFocusEffect(
		useCallback(() => {
			navigation.setOptions({ headerTitle: i18n.t("sessionLog") });

			if (isGuest) {
				showGuestRestrictionAlert(i18n);
				router.replace("/(tabs)");
				return;
			}

			const load = async () => {
				const ownerKey = getOwnerKey(user);
				const data = await getSessionsForUser(ownerKey);
				setSessions(data);
			};
			load();
		}, [i18n, isGuest, navigation, user])
	);

	return (
		<View style={styles.container}>
			<FlatList
				data={sessions}
				keyExtractor={(item) => item.id}
				contentContainerStyle={{ padding: 16, paddingBottom: bottomInset + 16 }}
				ListEmptyComponent={
					<View style={styles.empty}>
						<Ionicons name="time-outline" size={48} color="#aaa" />
						<Text style={styles.emptyText}>{i18n.t("noSessions")}</Text>
					</View>
				}
				renderItem={({ item }) => (
					<TouchableOpacity
						style={styles.card}
						onPress={() => router.push({ pathname: "/session/detail", params: { id: item.id } })}
					>
						<View style={styles.cardHeader}>
							<Text style={styles.cardTitle}>
								{item.sessionType === "home" ? i18n.t("sessionTypeHome") : i18n.t("sessionTypeOutdoor")}
							</Text>
							<Text style={styles.cardDuration}>{formatDuration(item.durationSec)}</Text>
						</View>
						<Text style={styles.cardMeta}>{formatDateTime(item.endedAt, locale)}</Text>
						<Text style={styles.cardMeta}>
							{i18n.t("exercisesCount", { count: item.exercises?.length || 0 })}
						</Text>
					</TouchableOpacity>
				)}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	empty: {
		alignItems: "center",
		paddingTop: hp("12%"),
	},
	emptyText: {
		marginTop: 12,
		fontSize: RFValue(15),
		color: "#888",
	},
	card: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: "#eee",
		shadowColor: "#000",
		shadowOpacity: 0.06,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2,
		width: wp("92%"),
		alignSelf: "center",
	},
	cardHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	cardTitle: {
		fontSize: RFValue(16),
		fontWeight: "bold",
		color: "#333",
	},
	cardDuration: {
		fontSize: RFValue(16),
		fontWeight: "bold",
		color: "#840B1C",
	},
	cardMeta: {
		marginTop: 6,
		fontSize: RFValue(13),
		color: "#666",
	},
});
