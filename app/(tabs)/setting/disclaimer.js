import React, { useContext } from "react";
import { Platform, StyleSheet, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LocaleContext } from "../../../contexts/LocaleContext";
import { RFValue } from "react-native-responsive-fontsize";

const TAB_BAR_HEIGHT = 100;

const Disclaimer = () => {
	const { i18n } = useContext(LocaleContext);
	const insets = useSafeAreaInsets();
	const bottomPad =
		Platform.OS === "ios" ? TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) : TAB_BAR_HEIGHT + Math.max(insets.bottom, 16);

	return (
		<View style={styles.container}>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
				showsVerticalScrollIndicator
			>
				<Text style={styles.text}>{i18n.t("disclaimer")}</Text>
			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		padding: 16,
		flexGrow: 1,
	},
	text: {
		fontSize: RFValue(16),
		lineHeight: RFValue(26),
		color: "#333",
		textAlign: "left",
	},
});

export default Disclaimer;
