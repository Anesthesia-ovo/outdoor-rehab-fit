import React, { useContext, useState } from "react";
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useFocusEffect } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";
import { LocaleContext } from "../../contexts/LocaleContext";
import { useAuth } from "../../contexts/AuthContext";
import { router } from "expo-router";
import { getLearningProgress } from "../../utils/learning";
import { getBookmarks, saveBookmarks } from "../../utils/bookmarks";
import { RFValue } from "react-native-responsive-fontsize";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

const Favourite = () => {
	const { i18n, locale, changeLanguage } = useContext(LocaleContext);
	const { isGuest } = useAuth();
	const equipmentData = i18n.t("equipmentList", { returnObjects: true });
	const [bookmarkedItems, setBookmarkedItems] = useState([]);
	const [bookmarked, setBookmarked] = useState({});
	const [learning, setLearning] = useState({});
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
			if (isGuest) return;
			const fetchBookmarkedItems = async () => {
				try {
					const bookmarked = await getBookmarks();
					setBookmarked(bookmarked);
					const items = equipmentData.filter((item) => bookmarked[item.id]);
					setBookmarkedItems(items);
					// App Upgrade #10: learning progress of "My favorite" items
					const progress = await getLearningProgress();
					setLearning(progress);
				} catch (error) {
					console.error("Error fetching bookmarked items", error);
				}
			};
			fetchBookmarkedItems();
		}, [isGuest])
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
			await saveBookmarks(updatedBookmarks);
			const items = equipmentData.filter((item) => updatedBookmarks[item.id]);
			setBookmarkedItems(items);
		} catch (error) {
			console.error("Error updating bookmarks", error);
		}
	};

	return (
		<View style={styles.container}>
			{isGuest ? (
				<View style={styles.restrictedContainer}>
					<Ionicons name="lock-closed" size={60} color="#840B1C" />
					<Text style={styles.restrictedTitle}>{i18n.t("guestRestrictedTitle")}</Text>
					<Text style={styles.restrictedText}>{i18n.t("guestRestrictedMessage")}</Text>
					<TouchableOpacity
						style={styles.loginButton}
						onPress={() => router.push({ pathname: "/login", params: { from: "settings" } })}
					>
						<Text style={styles.loginButtonText}>{i18n.t("loginNow")}</Text>
					</TouchableOpacity>
				</View>
			) : (
			<FlatList
				data={bookmarkedItems}
				contentContainerStyle={{ paddingTop: 16, paddingBottom: hp("15%") }}
				keyExtractor={(item) => item.id.toString()}
				renderItem={({ item }) => (
					<TouchableOpacity
						onPress={() => router.navigate({ pathname: "/outdoor/detail", params: item })}
						style={styles.card}
					>
						<Image source={item.icon} style={styles.image} />
						<View style={styles.info}>
							<Text style={styles.name}>{item.name}</Text>
							{/* App Upgrade #10: read / watched / listened badges */}
							<View style={styles.progressRow}>
								<Ionicons
									name={learning[item.id]?.read ? "book" : "book-outline"}
									size={20}
									color={learning[item.id]?.read ? "#2E8B57" : "#bbb"}
								/>
								<Ionicons
									name={learning[item.id]?.watched ? "videocam" : "videocam-outline"}
									size={20}
									color={learning[item.id]?.watched ? "#2E8B57" : "#bbb"}
									style={{ marginLeft: 8 }}
								/>
								<Ionicons
									name={learning[item.id]?.listened ? "volume-high" : "volume-mute-outline"}
									size={20}
									color={learning[item.id]?.listened ? "#2E8B57" : "#bbb"}
									style={{ marginLeft: 8 }}
								/>
							</View>
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
			)}
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
	progressRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 8,
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
	restrictedContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 32,
	},
	restrictedTitle: {
		marginTop: 16,
		fontSize: RFValue(18),
		fontWeight: "bold",
		color: "#840B1C",
		textAlign: "center",
	},
	restrictedText: {
		marginTop: 10,
		fontSize: RFValue(14),
		color: "#555",
		textAlign: "center",
		lineHeight: RFValue(20),
	},
	loginButton: {
		marginTop: 20,
		backgroundColor: "#840B1C",
		borderRadius: 24,
		paddingHorizontal: 24,
		paddingVertical: 12,
	},
	loginButtonText: {
		color: "#fff",
		fontSize: RFValue(14),
		fontWeight: "bold",
	},
});

export default Favourite;
