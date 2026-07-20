import React, { useContext } from "react";
import { Alert, Platform, ScrollView, StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";
import { LocaleContext } from "../../../contexts/LocaleContext";
import { useAuth } from "../../../contexts/AuthContext";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";

const TAB_BAR_HEIGHT = 100;

const Setting = () => {
	const { i18n, changeLanguage } = useContext(LocaleContext);
	const { user, isGuest, isUser, isAuthenticated, logout } = useAuth();
	const insets = useSafeAreaInsets();
	const bottomInset =
		Platform.OS === "ios" ? TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) : TAB_BAR_HEIGHT + Math.max(insets.bottom, 16);

	const handleLogout = () => {
		Alert.alert(i18n.t("logout"), i18n.t("logoutConfirm"), [
			{ text: i18n.t("cancel"), style: "cancel" },
			{
				text: i18n.t("confirm"),
				style: "destructive",
				onPress: async () => {
					await logout();
					router.replace("/login");
				},
			},
		]);
	};

	const handleLoginNow = () => {
		router.push({ pathname: "/login", params: { from: "settings" } });
	};

	const handleRegister = () => {
		router.push({ pathname: "/register", params: { from: "settings" } });
	};

	const showLogout = isUser || (isAuthenticated && !isGuest && user?.name !== "guest");

	return (
		<ScrollView
			style={styles.scrollView}
			contentContainerStyle={[styles.container, { paddingBottom: bottomInset }]}
			showsVerticalScrollIndicator={false}
		>
			<View style={styles.accountCard}>
				<Text style={styles.accountLabel}>
					{isGuest || user?.name === "guest" ? i18n.t("guestMode") : i18n.t("loggedInAs")}
				</Text>
				<Text style={styles.accountName}>{isGuest ? i18n.t("guestMode") : user?.name ?? "-"}</Text>
				{!isGuest && user?.phone ? (
					<Text style={styles.accountMeta}>
						{i18n.t("accountPhone")}: {user.phone}
					</Text>
				) : null}
				{!isGuest && user?.profileRole ? (
					<Text style={styles.accountMeta}>
						{i18n.t("accountRole")}: {i18n.t(`profileRole_${user.profileRole}`)}
					</Text>
				) : null}
				{isGuest && <Text style={styles.accountHint}>{i18n.t("loginNowHint")}</Text>}
			</View>

			{showLogout ? (
				<TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
					<FontAwesome name="sign-out" size={RFValue(30)} color="white" />
					<Text style={styles.buttonText}>{i18n.t("logout")}</Text>
				</TouchableOpacity>
			) : (
				<>
					<TouchableOpacity style={[styles.button, styles.loginNowButton]} onPress={handleLoginNow}>
						<FontAwesome name="sign-in" size={RFValue(30)} color="white" />
						<Text style={styles.buttonText}>{i18n.t("loginNow")}</Text>
					</TouchableOpacity>
					<TouchableOpacity style={[styles.button, styles.registerButton]} onPress={handleRegister}>
						<FontAwesome name="user-plus" size={RFValue(30)} color="white" />
						<Text style={styles.buttonText}>{i18n.t("registerButton")}</Text>
					</TouchableOpacity>
				</>
			)}

			<TouchableOpacity style={styles.button} onPress={changeLanguage}>
				<FontAwesome name="language" size={RFValue(30)} color="white" />
				<Text style={styles.buttonText}>{i18n.t("changeLanguage")}</Text>
			</TouchableOpacity>
			<TouchableOpacity
				style={styles.button}
				onPress={() => {
					router.push(`/setting/about`);
				}}
			>
				<FontAwesome name="info-circle" size={RFValue(30)} color="white" />
				<Text style={styles.buttonText}>{i18n.t("aboutApp")}</Text>
			</TouchableOpacity>
			<TouchableOpacity
				style={styles.button}
				onPress={() => {
					router.push(`/setting/info`);
				}}
			>
				<FontAwesome name="users" size={RFValue(30)} color="white" />
				<Text style={styles.buttonText}>{i18n.t("aboutTeam")}</Text>
			</TouchableOpacity>
			<TouchableOpacity
				style={styles.button}
				onPress={() => {
					router.push(`/setting/disclaimer`);
				}}
			>
				<FontAwesome name="exclamation-triangle" size={RFValue(30)} color="white" />
				<Text style={styles.buttonText}>{i18n.t("settingDisclaimer")}</Text>
			</TouchableOpacity>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	scrollView: {
		flex: 1,
		backgroundColor: "#fff",
	},
	container: {
		alignItems: "center",
		paddingTop: 8,
	},
	accountCard: {
		width: wp("80%"),
		backgroundColor: "#f8f9fa",
		borderRadius: 10,
		padding: 16,
		marginTop: 10,
		marginBottom: 4,
	},
	accountLabel: {
		fontSize: RFValue(14),
		color: "#666",
	},
	accountName: {
		marginTop: 4,
		fontSize: RFValue(18),
		fontWeight: "bold",
		color: "#333",
	},
	accountMeta: {
		marginTop: 6,
		fontSize: RFValue(13),
		color: "#555",
	},
	accountHint: {
		marginTop: 8,
		fontSize: RFValue(13),
		color: "#888",
		lineHeight: RFValue(18),
	},
	button: {
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#007BFF",
		borderRadius: 10,
		paddingVertical: 16,
		paddingHorizontal: 20,
		marginVertical: 8,
		width: wp("80%"),
		minHeight: hp("10%"),
	},
	buttonText: {
		color: "white",
		marginTop: hp("1%"),
		fontSize: RFValue(18),
		fontWeight: "bold",
	},
	loginNowButton: {
		backgroundColor: "#840B1C",
	},
	registerButton: {
		backgroundColor: "#28a745",
	},
	logoutButton: {
		backgroundColor: "#840B1C",
	},
});

export default Setting;
