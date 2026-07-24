// App Upgrade #2: Locate specific types of outdoor exercise equipment (GIS)
// Official GIS data arrives at a later stage; sample locations are used locally.
import React, { useContext, useState } from "react";
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ScrollView, Linking, Platform } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { LocaleContext } from "../../../contexts/LocaleContext";
import { EQUIPMENT_LOCATIONS } from "../../../constants/EquipmentLocations";

const TYPE_KEYS = ["all", "aerobic", "muscle", "balance", "mobility", "wheelchair", "multifunctional", "relaxation", "upper", "lower"];

const EquipmentMap = () => {
	const { i18n, locale } = useContext(LocaleContext);
	const [selectedType, setSelectedType] = useState("all");

	const filtered =
		selectedType === "all"
			? EQUIPMENT_LOCATIONS
			: EQUIPMENT_LOCATIONS.filter((loc) => loc.types.includes(selectedType));

	const openInMaps = (loc) => {
		const label = encodeURIComponent(locale === "zh" ? loc.nameZh : loc.nameEn);
		const url = Platform.select({
			ios: `maps:0,0?q=${label}@${loc.latitude},${loc.longitude}`,
			android: `geo:0,0?q=${loc.latitude},${loc.longitude}(${label})`,
			default: `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`,
		});
		Linking.openURL(url).catch(() => {
			Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`);
		});
	};

	return (
		<View style={styles.container}>
			<Text style={styles.note}>{i18n.t("equipmentMapNote")}</Text>

			{/* Filter by specific equipment type */}
			<Text style={styles.filterLabel}>{i18n.t("filterByType")}</Text>
			<View style={{ height: hp("6%") }}>
				<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
					{TYPE_KEYS.map((key) => (
						<TouchableOpacity
							key={key}
							style={[styles.chip, selectedType === key && styles.chipSelected]}
							onPress={() => setSelectedType(key)}
						>
							<Text style={[styles.chipText, selectedType === key && styles.chipTextSelected]}>{i18n.t(key)}</Text>
						</TouchableOpacity>
					))}
				</ScrollView>
			</View>

			<FlatList
				data={filtered}
				keyExtractor={(item) => item.id}
				contentContainerStyle={{ padding: wp("4%"), paddingBottom: hp("15%") }}
				renderItem={({ item }) => (
					<View style={styles.card}>
						<View style={styles.cardHeader}>
							<MaterialCommunityIcons name="map-marker" size={RFValue(26)} color="#840B1C" />
							<View style={{ flex: 1, marginLeft: 8 }}>
								<Text style={styles.name}>{locale === "zh" ? item.nameZh : item.nameEn}</Text>
								<Text style={styles.district}>
									{i18n.t("distanceNote")}: {locale === "zh" ? item.districtZh : item.districtEn}
								</Text>
							</View>
						</View>
						<View style={styles.typeRow}>
							{item.types.map((t) => (
								<View key={t} style={styles.typeTag}>
									<Text style={styles.typeTagText}>{i18n.t(t)}</Text>
								</View>
							))}
						</View>
						<TouchableOpacity style={styles.mapBtn} onPress={() => openInMaps(item)}>
							<Ionicons name="navigate" size={RFValue(16)} color="#fff" />
							<Text style={styles.mapBtnText}>{i18n.t("openInMaps")}</Text>
						</TouchableOpacity>
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
	note: {
		fontSize: RFValue(12),
		color: "#888",
		paddingHorizontal: wp("4%"),
		paddingTop: 10,
		lineHeight: RFValue(18),
	},
	filterLabel: {
		fontSize: RFValue(14),
		fontWeight: "bold",
		color: "#333",
		paddingHorizontal: wp("4%"),
		marginTop: 10,
		marginBottom: 6,
	},
	filterRow: {
		paddingHorizontal: wp("4%"),
		alignItems: "center",
		gap: 8,
	},
	chip: {
		borderWidth: 1,
		borderColor: "#EB9481",
		borderRadius: 20,
		paddingHorizontal: 14,
		paddingVertical: 8,
		marginRight: 8,
	},
	chipSelected: {
		backgroundColor: "#840B1C",
		borderColor: "#840B1C",
	},
	chipText: {
		fontSize: RFValue(13),
		color: "#840B1C",
	},
	chipTextSelected: {
		color: "#fff",
		fontWeight: "bold",
	},
	card: {
		backgroundColor: "#f8f9fa",
		borderRadius: 14,
		padding: 16,
		marginBottom: 14,
	},
	cardHeader: {
		flexDirection: "row",
		alignItems: "center",
	},
	name: {
		fontSize: RFValue(15),
		fontWeight: "bold",
		color: "#333",
	},
	district: {
		fontSize: RFValue(12),
		color: "#888",
		marginTop: 2,
	},
	typeRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		marginTop: 10,
		gap: 6,
	},
	typeTag: {
		backgroundColor: "#F0E4C2",
		borderRadius: 8,
		paddingHorizontal: 8,
		paddingVertical: 4,
		marginRight: 6,
		marginBottom: 4,
	},
	typeTagText: {
		fontSize: RFValue(11),
		color: "#555",
	},
	mapBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#2E8B57",
		borderRadius: 10,
		paddingVertical: 10,
		marginTop: 12,
		gap: 6,
	},
	mapBtnText: {
		color: "#fff",
		fontSize: RFValue(13),
		fontWeight: "bold",
		marginLeft: 4,
	},
});

export default EquipmentMap;
