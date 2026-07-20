import React, { useContext } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { LocaleContext } from "../contexts/LocaleContext";
import { showGuestRestrictionAlert } from "../utils/accessControl";

export default function GuestLockedSection({ title, children }) {
	const { i18n } = useContext(LocaleContext);

	return (
		<View style={styles.container}>
			<TouchableOpacity style={styles.lockedHeader} activeOpacity={0.8} onPress={() => showGuestRestrictionAlert(i18n)}>
				<View style={styles.titleRow}>
					<Ionicons name="lock-closed" size={RFValue(18)} color="#840B1C" />
					<Text style={styles.title}>{title}</Text>
				</View>
				<Text style={styles.hint}>{i18n.t("guestRestrictedSection")}</Text>
			</TouchableOpacity>
			<View style={styles.blurredContent} pointerEvents="none">
				{children}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		position: "relative",
		overflow: "hidden",
	},
	lockedHeader: {
		backgroundColor: "#F8F9FA",
		borderWidth: 1,
		borderColor: "#E9ECEF",
		borderRadius: 10,
		padding: 14,
		marginBottom: 8,
	},
	titleRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	title: {
		fontSize: RFValue(15),
		fontWeight: "bold",
		color: "#333",
	},
	hint: {
		marginTop: 6,
		fontSize: RFValue(12),
		color: "#840B1C",
	},
	blurredContent: {
		opacity: 0.25,
	},
});
