import React, { useState, useEffect, useContext } from "react";
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import SearchBar from "../../../components/SearchBar";
import { useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useNavigation } from "expo-router";
import { LocaleContext } from "../../../contexts/LocaleContext";
import { getBookmarks, saveBookmarks } from "../../../utils/bookmarks";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
const EquipmentList = () => {
	const { i18n } = useContext(LocaleContext);
	const equipmentData = i18n.t("equipmentList", { returnObjects: true });
	const buttons = [
		{ icon: require("@/assets/icons/outdoor/list.png"), text: i18n.t("all") },
		{ icon: require("@/assets/icons/outdoor/muscle.png"), text: i18n.t("muscle") },
		{ icon: require("@/assets/icons/outdoor/flexibility.png"), text: i18n.t("mobility") },
		{ icon: require("@/assets/icons/outdoor/balance.png"), text: i18n.t("balance") },
		{ icon: require("@/assets/icons/outdoor/aerobic.png"), text: i18n.t("aerobic") },
		{ icon: require("@/assets/icons/outdoor/wheelchair.png"), text: i18n.t("wheelchair") },
		{ icon: require("@/assets/icons/outdoor/multi.png"), text: i18n.t("multifunctional") },
		{ icon: require("@/assets/icons/outdoor/relax.png"), text: i18n.t("relaxation") },
		{ icon: require("@/assets/icons/outdoor/upper.png"), text: i18n.t("upper") },
		{ icon: require("@/assets/icons/outdoor/lower.png"), text: i18n.t("lower") },
	];
	const renderCategoryIcons = (categories) => {
		return (
			<View style={styles.iconRow}>
				{categories.map((category) => {
					const button = buttons.find((btn) => btn.text === i18n.t(category));
					return button ? <Image key={category} source={button.icon} style={styles.categoryIcon} /> : null;
				})}
			</View>
		);
	};
	const { categoryName, categoryId } = useLocalSearchParams();
	const equipmentList = equipmentData;
	const navigation = useNavigation();
	const [searchQuery, setSearchQuery] = useState("");
	const [bookmarked, setBookmarked] = useState({});

	useEffect(() => {
		navigation.setOptions({ headerTitle: categoryName });
	}, [navigation, categoryName]);

	useEffect(() => {
		const loadBookmarks = async () => {
			try {
				setBookmarked(await getBookmarks());
			} catch (error) {
				console.error("Error loading bookmarks", error);
			}
		};

		loadBookmarks();
	}, []);

	const toggleBookmark = async (itemId) => {
		try {
			let updatedBookmarks = { ...bookmarked };
			if (updatedBookmarks[itemId]) {
				delete updatedBookmarks[itemId];
			} else {
				updatedBookmarks[itemId] = true;
			}
			setBookmarked(updatedBookmarks);
			await saveBookmarks(updatedBookmarks);
		} catch (error) {
			console.error("Error updating bookmarks", error);
		}
	};

	const filteredEquipmentList = equipmentList.filter((item) => {
		if (categoryName === "Show All" || categoryName === "顯示全部") {
			return item.name.toLowerCase().includes(searchQuery.toLowerCase());
		}
		return item.categories.includes(categoryId) && item.name.toLowerCase().includes(searchQuery.toLowerCase());
	});

	return (
		<View style={styles.container}>
			<SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder={i18n.t("searching")} />
			<FlatList
				data={filteredEquipmentList}
				contentContainerStyle={{ alignItems: "center", paddingBottom: hp("15%") }}
				keyExtractor={(item) => item.id.toString()}
				showsVerticalScrollIndicator={false}
				renderItem={({ item }) => (
					<TouchableOpacity
						onPress={() => router.push({ pathname: "/outdoor/detail", params: item })}
						style={styles.card}
					>
						<Image source={item.icon} style={styles.image} />
						<View style={styles.info}>
							<Text style={styles.name}>{item.name}</Text>
						</View>
						{renderCategoryIcons(item.categories)}
						<TouchableOpacity style={styles.bookmark} onPress={() => toggleBookmark(item.id)}>
							<Ionicons
								name={bookmarked[item.id] ? "heart" : "heart-outline"}
								size={RFValue(30)}
								color={bookmarked[item.id] ? "red" : "gray"}
							/>
						</TouchableOpacity>
					</TouchableOpacity>
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
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-start",
		paddingVertical: 10,
		position: "relative",
	},
	card: {
		flexDirection: "row",
		backgroundColor: "#fff",
		borderRadius: 8,
		shadowColor: "#000",
		shadowOpacity: 0.1,
		shadowRadius: 10,
		elevation: 5,
		marginBottom: 16,
		height: hp("20%"),
		// Shadow for iOS
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		// Elevation for Android
		elevation: 5,
		width: wp("90%"),
	},
	image: {
		width: wp("35%"),
		height: hp("20%"),
		borderTopLeftRadius: 8,
		borderBottomLeftRadius: 8,
	},
	info: {
		paddingTop: hp("2%"),
		width: wp("55%"),
		paddingLeft: wp("5%"),
	},
	name: {
		fontSize: RFValue(18),
		fontWeight: "bold",
		flexShrink: 1,
	},
	type: {
		fontSize: RFValue(14),
		color: "#666",
	},
	bookmark: {
		position: "absolute",
		bottom: hp("2%"),
		right: wp("5%"),
	},
	iconRow: {
		position: "absolute",
		left: wp("39%"),
		bottom: hp("2%"),
		flexDirection: "row",
	},
	categoryIcon: {
		width: RFValue(20),
		height: RFValue(20),
		marginRight: 8,
	},
});

export default EquipmentList;
