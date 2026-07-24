import React, { useContext, useEffect, useState } from "react";
import {
	ActivityIndicator,
	ImageBackground,
	KeyboardAvoidingView,
	Platform,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { LocaleContext } from "../contexts/LocaleContext";
import { showAlert } from "../utils/alert";
import { useAuth } from "../contexts/AuthContext";
import { navigateAfterAuth } from "../utils/onboarding";

const ERROR_MESSAGES = {
	loginRequired: "loginRequired",
	invalidCredentials: "invalidCredentials",
	invalidPhone: "invalidPhone",
	invalidEmail: "invalidEmail",
	emailNotRegistered: "emailNotRegistered",
};

export default function LoginScreen() {
	const { i18n } = useContext(LocaleContext);
	const { isAuthenticated, isGuest, isUser, isLoading, login, loginAsGuest } = useAuth();
	const { from } = useLocalSearchParams();
	const isFromSettings = from === "settings";
	const [identifier, setIdentifier] = useState("");
	const [password, setPassword] = useState("");
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (!isLoading && isUser && !isFromSettings) {
			navigateAfterAuth(from);
		}
	}, [isAuthenticated, isLoading, isUser, isFromSettings, from]);

	const handleLogin = async () => {
		if (!identifier.trim() || !password) {
			showAlert(i18n.t("warning"), i18n.t("loginRequired"));
			return;
		}

		setSubmitting(true);
		const result = await login(identifier, password);
		setSubmitting(false);

		if (!result.success) {
			const messageKey = ERROR_MESSAGES[result.error] || "invalidCredentials";
			showAlert(i18n.t("warning"), i18n.t(messageKey));
			return;
		}

		await navigateAfterAuth(from);
	};

	const handleGuestLogin = () => {
		showAlert(i18n.t("guestConfirmTitle"), i18n.t("guestConfirmMessage"), [
			{ text: i18n.t("cancel"), style: "cancel" },
			{
				text: i18n.t("stayGuest"),
				onPress: async () => {
					setSubmitting(true);
					await loginAsGuest();
					setSubmitting(false);
					await navigateAfterAuth(from);
				},
			},
		]);
	};

	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#840B1C" />
			</View>
		);
	}

	if (isUser && !isFromSettings) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#840B1C" />
			</View>
		);
	}

	return (
		<ImageBackground source={require("@/assets/images/background.png")} resizeMethod="cover" style={styles.background}>
			<SafeAreaView style={styles.safeArea}>
				<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
					<ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
						<View style={styles.header}>
							<Text style={styles.title}>{i18n.t("loginTitle")}</Text>
							<Text style={styles.subtitle}>
								{isFromSettings && isGuest ? i18n.t("loginNowHint") : i18n.t("loginSubtitle")}
							</Text>
						</View>

						<View style={styles.formCard}>
							<Text style={styles.label}>{i18n.t("loginIdentifier")}</Text>
							<TextInput
								style={styles.input}
								value={identifier}
								onChangeText={setIdentifier}
								autoCapitalize="none"
								autoCorrect={false}
								keyboardType="email-address"
								placeholder={i18n.t("loginIdentifierPlaceholder")}
								placeholderTextColor="#999"
							/>
							<Text style={styles.hint}>{i18n.t("loginIdentifierHint")}</Text>

							<Text style={styles.label}>{i18n.t("password")}</Text>
							<TextInput
								style={styles.input}
								value={password}
								onChangeText={setPassword}
								secureTextEntry
								autoCapitalize="none"
								autoCorrect={false}
								placeholder={i18n.t("passwordPlaceholder")}
								placeholderTextColor="#999"
							/>

							<TouchableOpacity
								style={styles.forgotPasswordButton}
								onPress={() => router.push({ pathname: "/forgot-password", params: { from } })}
							>
								<Text style={styles.forgotPasswordText}>{i18n.t("forgotPassword")}</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={[styles.primaryButton, submitting && styles.buttonDisabled]}
								onPress={handleLogin}
								disabled={submitting}
							>
								{submitting ? (
									<ActivityIndicator color="#fff" />
								) : (
									<Text style={styles.primaryButtonText}>{i18n.t("loginButton")}</Text>
								)}
							</TouchableOpacity>

							{!isFromSettings && (
								<TouchableOpacity
									style={[styles.secondaryButton, submitting && styles.buttonDisabled]}
									onPress={handleGuestLogin}
									disabled={submitting}
								>
									<Text style={styles.secondaryButtonText}>{i18n.t("guestButton")}</Text>
								</TouchableOpacity>
							)}

							<View style={styles.footerRow}>
								<Text style={styles.footerText}>{i18n.t("noAccount")} </Text>
								<TouchableOpacity onPress={() => router.push({ pathname: "/register", params: { from } })}>
									<Text style={styles.footerLink}>{i18n.t("goToRegister")}</Text>
								</TouchableOpacity>
							</View>
						</View>
					</ScrollView>
				</KeyboardAvoidingView>
			</SafeAreaView>
		</ImageBackground>
	);
}

const styles = StyleSheet.create({
	background: {
		flex: 1,
	},
	safeArea: {
		flex: 1,
	},
	flex: {
		flex: 1,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#fff",
	},
	scrollContent: {
		flexGrow: 1,
		justifyContent: "center",
		paddingHorizontal: wp("8%"),
		paddingVertical: hp("4%"),
	},
	header: {
		marginBottom: hp("3%"),
	},
	title: {
		fontSize: RFValue(24),
		fontWeight: "bold",
		color: "#840B1C",
		textAlign: "center",
	},
	subtitle: {
		marginTop: hp("1%"),
		fontSize: RFValue(14),
		color: "#555",
		textAlign: "center",
		lineHeight: RFValue(20),
	},
	formCard: {
		backgroundColor: "rgba(255, 255, 255, 0.95)",
		borderRadius: 16,
		padding: wp("6%"),
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 8,
		elevation: 4,
	},
	label: {
		fontSize: RFValue(14),
		fontWeight: "600",
		color: "#333",
		marginBottom: hp("0.8%"),
	},
	hint: {
		fontSize: RFValue(11),
		color: "#777",
		lineHeight: RFValue(16),
		marginTop: -hp("1%"),
		marginBottom: hp("1.5%"),
	},
	input: {
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 10,
		paddingHorizontal: wp("4%"),
		paddingVertical: hp("1.4%"),
		fontSize: RFValue(14),
		marginBottom: hp("2%"),
		backgroundColor: "#fff",
		color: "#333",
	},
	forgotPasswordButton: {
		alignSelf: "flex-end",
		marginTop: -hp("1%"),
		marginBottom: hp("1.5%"),
	},
	forgotPasswordText: {
		fontSize: RFValue(13),
		color: "#840B1C",
		fontWeight: "600",
	},
	primaryButton: {
		backgroundColor: "#840B1C",
		borderRadius: 50,
		paddingVertical: hp("1.8%"),
		alignItems: "center",
		marginTop: hp("1%"),
	},
	primaryButtonText: {
		color: "#fff",
		fontSize: RFValue(16),
		fontWeight: "bold",
	},
	secondaryButton: {
		borderWidth: 1,
		borderColor: "#840B1C",
		borderRadius: 50,
		paddingVertical: hp("1.6%"),
		alignItems: "center",
		marginTop: hp("1.5%"),
		backgroundColor: "#fff",
	},
	secondaryButtonText: {
		color: "#840B1C",
		fontSize: RFValue(15),
		fontWeight: "600",
	},
	buttonDisabled: {
		opacity: 0.7,
	},
	footerRow: {
		flexDirection: "row",
		justifyContent: "center",
		marginTop: hp("2%"),
	},
	footerText: {
		fontSize: RFValue(14),
		color: "#666",
	},
	footerLink: {
		fontSize: RFValue(14),
		color: "#840B1C",
		fontWeight: "bold",
	},
});
