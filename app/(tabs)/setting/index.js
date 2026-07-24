import React, { useContext } from "react";
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { LocaleContext } from "../../../contexts/LocaleContext";
import { useAuth } from "../../../contexts/AuthContext";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { showAlert } from "../../../utils/alert";

const Setting = () => {
	const { i18n, changeLanguage } = useContext(LocaleContext);
	const { user, isGuest, isUser, isAuthenticated, logout, resetOnboarding } = useAuth();

	const handleLogout = () => {
		showAlert(i18n.t("logout"), i18n.t("logoutConfirm"), [
			{ text: i18n.t("cancel"), style: "cancel" },
			{
				text: i18n.t("confirm"),
				style: "destructive",
				onPress: async () => {
					await logout();
				},
			},
		]);
	};

	const handleResetOnboarding = () => {
		showAlert(i18n.t("resetOnboarding"), i18n.t("resetOnboardingConfirm"), [
			{ text: i18n.t("cancel"), style: "cancel" },
			{
				text: i18n.t("confirm"),
				style: "destructive",
				onPress: async () => {
					await resetOnboarding();
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
		<ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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
			<TouchableOpacity style={[styles.button, styles.resetButton]} onPress={handleResetOnboarding}>
				<FontAwesome name="refresh" size={RFValue(30)} color="white" />
				<Text style={styles.buttonText}>{i18n.t("resetOnboarding")}</Text>
			</TouchableOpacity>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		alignItems: "center",
		paddingBottom: hp("15%"),
		paddingTop: hp("1%"),
	},
	accountCard: {
		width: wp("80%"),
		backgroundColor: "#f8f9fa",
		borderRadius: 12,
		padding: 16,
		marginVertical: 10,
	},
	accountLabel: {
		fontSize: RFValue(12),
		color: "#888",
		marginBottom: 4,
	},
	accountName: {
		fontSize: RFValue(18),
		fontWeight: "bold",
		color: "#333",
	},
	accountMeta: {
		fontSize: RFValue(13),
		color: "#555",
		marginTop: 6,
	},
	accountHint: {
		fontSize: RFValue(12),
		color: "#840B1C",
		marginTop: 8,
		lineHeight: RFValue(18),
	},
	logoutButton: {
		backgroundColor: "#B00020",
	},
	loginNowButton: {
		backgroundColor: "#840B1C",
	},
	registerButton: {
		backgroundColor: "#007BFF",
	},
	resetButton: {
		backgroundColor: "#6C757D",
	},
	button: {
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#007BFF",
		borderRadius: 10,
		padding: 20,
		margin: 10,
		width: wp("80%"),
		height: hp("15%"),
	},
	buttonText: {
		color: "white",
		marginTop: hp("1%"),
		fontSize: RFValue(18),
		fontWeight: "bold",
	},
});

export default Setting;
