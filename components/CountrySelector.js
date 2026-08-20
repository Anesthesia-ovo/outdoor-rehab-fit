import React, { useMemo, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COUNTRY_OPTIONS } from "../constants/countries";

export default function CountrySelector({ i18n, value = "+852", onChange }) {
	const [visible, setVisible] = useState(false);
	const selectedCountry = useMemo(
		() => COUNTRY_OPTIONS.find((country) => country.dialCode === value) || COUNTRY_OPTIONS[0],
		[value],
	);

	const selectCountry = (country) => {
		onChange(country.dialCode);
		setVisible(false);
	};

	return (
		<>
			<TouchableOpacity
				style={styles.trigger}
				onPress={() => setVisible(true)}
				accessibilityRole="button"
				accessibilityLabel={`${i18n.t(selectedCountry.nameKey)} ${selectedCountry.dialCode}`}
			>
				<Text style={styles.countryCode}>{selectedCountry.code}</Text>
				<Text style={styles.dialCode}>{selectedCountry.dialCode}</Text>
				<Text style={styles.arrow}>⌄</Text>
			</TouchableOpacity>

			<Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
				<View style={styles.overlay}>
					<TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setVisible(false)} />
					<View style={styles.modalCard}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>{i18n.t("countryRegion")}</Text>
							<TouchableOpacity onPress={() => setVisible(false)} accessibilityRole="button">
								<Text style={styles.closeButton}>×</Text>
							</TouchableOpacity>
						</View>
						<ScrollView showsVerticalScrollIndicator={false}>
							{COUNTRY_OPTIONS.map((country) => {
								const selected = country.dialCode === selectedCountry.dialCode;
								return (
									<TouchableOpacity
										key={country.code}
										style={[styles.option, selected && styles.optionSelected]}
										onPress={() => selectCountry(country)}
									>
										<Text style={[styles.optionName, selected && styles.optionTextSelected]}>
											{i18n.t(country.nameKey)}
										</Text>
										<Text style={[styles.optionDialCode, selected && styles.optionTextSelected]}>
											{country.dialCode}
										</Text>
									</TouchableOpacity>
								);
							})}
						</ScrollView>
					</View>
				</View>
			</Modal>
		</>
	);
}

const styles = StyleSheet.create({
	trigger: {
		minWidth: 104,
		minHeight: 48,
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 10,
		paddingHorizontal: 10,
		backgroundColor: "#fff",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 5,
	},
	countryCode: { color: "#555", fontSize: 12, fontWeight: "600" },
	dialCode: { color: "#222", fontSize: 14, fontWeight: "700" },
	arrow: { color: "#840B1C", fontSize: 17, marginTop: -3 },
	overlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.45)",
		justifyContent: "center",
		alignItems: "center",
		padding: 24,
	},
	modalCard: {
		width: "100%",
		maxWidth: 420,
		maxHeight: "72%",
		backgroundColor: "#fff",
		borderRadius: 16,
		padding: 16,
	},
	modalHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 8,
	},
	modalTitle: { color: "#333", fontSize: 18, fontWeight: "700" },
	closeButton: { color: "#666", fontSize: 30, lineHeight: 30, paddingHorizontal: 6 },
	option: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		borderRadius: 10,
		paddingHorizontal: 14,
		paddingVertical: 13,
		marginVertical: 3,
		backgroundColor: "#f7f7f7",
	},
	optionSelected: { backgroundColor: "#840B1C" },
	optionName: { color: "#333", fontSize: 15 },
	optionDialCode: { color: "#840B1C", fontSize: 15, fontWeight: "700" },
	optionTextSelected: { color: "#fff", fontWeight: "bold" },
});
