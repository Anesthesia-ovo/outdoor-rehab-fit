import React, { useContext, useState } from "react";
import { Platform, View, Text, FlatList, Image, StyleSheet, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { LocaleContext } from "../../contexts/LocaleContext";
import { router } from "expo-router";

const TAB_BAR_HEIGHT = 100;

const Favourite = () => {
	const { i18n, locale, changeLanguage } = useContext(LocaleContext);
	const insets = useSafeAreaInsets();
	const bottomInset =
		Platform.OS === "ios" ? TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) : Math.max(insets.bottom, 16);
	const equipmentData = i18n.t("equipmentList", { returnObjects: true });
	const [bookmarkedItems, setBookmarkedItems] = useState([]);
	const [bookmarked, setBookmarked] = useState({});
	const buttons = [
		{ icon: require("@/assets/icons/outdoor/list.png"), text: i18n.t("all") },
		{ icon: require("@/assets/icons/outdoor/muscle.png"), text: i18n.t("muscle") },
		{ icon: require("@/assets/icons/outdoor/flexibility.png"), text: i18n.t("mobility") },
		{ icon: require("@/assets/icons/outdoor/balance.png"), text: i18n.t("balance") },
		{ icon: require("@/assets/icons/outdoor/aerobic.png"), text: i18n.t("aerobic") },
		{ icon: require("@/assets/icons/outdoor/wheelchair.png"), text: i18n.t("wheelchair") },
		{ icon: require("@/assets/icons/outdoor/multi.png"), text: i18n.t("multifunctional") },
		{ icon: require("@/assets/icons/outdoor/relax.png"), text: i18n.t("relaxation") },
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

	useFocusEffect(
		React.useCallback(() => {
			const fetchBookmarkedItems = async () => {
				try {
					const savedBookmarks = await AsyncStorage.getItem("bookmarkedItems");
					const bookmarked = savedBookmarks ? JSON.parse(savedBookmarks) : {};
					setBookmarked(bookmarked);
					const items = equipmentData.filter((item) => bookmarked[item.id]);
					setBookmarkedItems(items);
				} catch (error) {
					console.error("Error fetching bookmarked items", error);
				}
			};
			fetchBookmarkedItems();
		}, [])
	);

	const toggleBookmark = async (itemId) => {
		try {
			let updatedBookmarks = { ...bookmarked };
			if (updatedBookmarks[itemId]) {
				delete updatedBookmarks[itemId];
			} else {
				updatedBookmarks[itemId] = true;
			}
			setBookmarked(updatedBookmarks);
			await AsyncStorage.setItem("bookmarkedItems", JSON.stringify(updatedBookmarks));
			const items = equipmentData.filter((item) => updatedBookmarks[item.id]);
			setBookmarkedItems(items);
		} catch (error) {
			console.error("Error updating bookmarks", error);
		}
	};

	return (
		<View style={styles.container}>
			<FlatList
				data={bookmarkedItems}
				contentContainerStyle={{ paddingTop: 16, paddingBottom: bottomInset }}
				keyExtractor={(item) => item.id.toString()}
				renderItem={({ item }) => (
					<TouchableOpacity
						onPress={() => router.navigate({ pathname: "/outdoor/detail", params: item })}
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
								size={38}
								color={bookmarked[item.id] ? "red" : "gray"}
							/>
						</TouchableOpacity>
					</TouchableOpacity>
				)}
				ListEmptyComponent={() => (
					<View style={styles.emptyContainer}>
						<Ionicons name="alert-circle-outline" size={50} color="gray" />
						<Text style={styles.emptyText}>{i18n.t("noFavorite")}</Text>
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
		paddingHorizontal: 16,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-start",
		paddingVertical: 10,
		position: "relative",
	},
	headerText: {
		flex: 1,
		textAlign: "center",
		fontSize: 18,
		fontWeight: "bold",
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
		height: 180,
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
		width: "99%",
	},
	image: {
		width: "35%",
		height: "100%",
		borderTopLeftRadius: 8,
		borderBottomLeftRadius: 8,
	},
	info: {
		paddingTop: 16,
		width: "65%",
		paddingLeft: 16,
	},
	name: {
		fontSize: 24,
		fontWeight: "bold",
		flexShrink: 1,
	},
	type: {
		fontSize: 14,
		color: "#666",
	},
	bookmark: {
		position: "absolute",
		bottom: 16,
		right: 16,
	},
	iconRow: {
		position: "absolute",
		left: "40%",
		bottom: 20,
		flexDirection: "row",
	},
	categoryIcon: {
		width: 32,
		height: 32,
		marginRight: 8,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingTop: 16,
	},
	emptyText: {
		marginTop: 16,
		fontSize: 18,
		color: "gray",
	},
});

export default Favourite;
