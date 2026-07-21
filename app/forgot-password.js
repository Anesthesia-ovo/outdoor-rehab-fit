import React, { useContext, useState } from "react";
import {
	ActivityIndicator,
	Alert,
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { LocaleContext } from "../contexts/LocaleContext";
import { resetPasswordWithCode, sendDemoVerificationCode } from "../constants/auth";

const ERROR_MESSAGES = {
	accountNotFound: "accountNotFound",
	invalidPhone: "invalidPhone",
	invalidEmail: "invalidEmail",
	resetRequired: "resetRequired",
	passwordTooShort: "passwordTooShort",
	passwordMismatch: "passwordMismatch",
	invalidCode: "invalidCode",
	codeExpired: "codeExpired",
};

export default function ForgotPasswordScreen() {
	const { i18n } = useContext(LocaleContext);
	const { from } = useLocalSearchParams();
	const [step, setStep] = useState(1);
	const [identifier, setIdentifier] = useState("");
	const [code, setCode] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [demoCode, setDemoCode] = useState("");
	const [channel, setChannel] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const handleSendCode = async () => {
		if (!identifier.trim()) {
			Alert.alert(i18n.t("warning"), i18n.t("resetIdentifierRequired"));
			return;
		}

		setSubmitting(true);
		const result = await sendDemoVerificationCode(AsyncStorage, identifier);
		setSubmitting(false);

		if (!result.success) {
			const messageKey = ERROR_MESSAGES[result.error] || "accountNotFound";
			Alert.alert(i18n.t("warning"), i18n.t(messageKey));
			return;
		}

		setDemoCode(result.demoCode);
		setChannel(result.channel);
		setStep(2);
		Alert.alert(
			i18n.t("codeSentTitle"),
			i18n.t("codeSentDemoMessage", {
				channel: result.channel === "email" ? i18n.t("emailChannel") : i18n.t("phoneChannel"),
				code: result.demoCode,
			})
		);
	};

	const handleResetPassword = async () => {
		setSubmitting(true);
		const result = await resetPasswordWithCode(AsyncStorage, identifier, code, newPassword, confirmPassword);
		setSubmitting(false);

		if (!result.success) {
			const messageKey = ERROR_MESSAGES[result.error] || "resetRequired";
			Alert.alert(i18n.t("warning"), i18n.t(messageKey));
			return;
		}

		Alert.alert("", i18n.t("resetSuccess"), [
			{
				text: "OK",
				onPress: () => router.replace({ pathname: "/login", params: { from } }),
			},
		]);
	};

	return (
		<ImageBackground source={require("@/assets/images/background.png")} resizeMethod="cover" style={styles.background}>
			<SafeAreaView style={styles.safeArea}>
				<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
					<ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
						<View style={styles.header}>
							<Text style={styles.title}>{i18n.t("forgotPasswordTitle")}</Text>
							<Text style={styles.subtitle}>
								{step === 1 ? i18n.t("forgotPasswordSubtitle") : i18n.t("forgotPasswordStep2Subtitle")}
							</Text>
						</View>

						<View style={styles.formCard}>
							<View style={styles.demoBadge}>
								<Text style={styles.demoBadgeText}>{i18n.t("forgotPasswordDemoNote")}</Text>
							</View>

							{step === 1 ? (
								<>
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

									<TouchableOpacity
										style={[styles.primaryButton, submitting && styles.buttonDisabled]}
										onPress={handleSendCode}
										disabled={submitting}
									>
										{submitting ? (
											<ActivityIndicator color="#fff" />
										) : (
											<Text style={styles.primaryButtonText}>{i18n.t("sendCodeButton")}</Text>
										)}
									</TouchableOpacity>
								</>
							) : (
								<>
									<Text style={styles.sentHint}>
										{i18n.t("codeSentTo", {
											channel: channel === "email" ? i18n.t("emailChannel") : i18n.t("phoneChannel"),
											target: identifier.trim(),
										})}
									</Text>
									{!!demoCode && (
										<Text style={styles.demoCodeText}>
											{i18n.t("demoCodeLabel")}: {demoCode}
										</Text>
									)}

									<Text style={styles.label}>{i18n.t("verificationCode")}</Text>
									<TextInput
										style={styles.input}
										value={code}
										onChangeText={setCode}
										keyboardType="number-pad"
										autoCorrect={false}
										placeholder={i18n.t("verificationCodePlaceholder")}
										placeholderTextColor="#999"
										maxLength={6}
									/>

									<Text style={styles.label}>{i18n.t("newPassword")}</Text>
									<TextInput
										style={styles.input}
										value={newPassword}
										onChangeText={setNewPassword}
										secureTextEntry
										autoCapitalize="none"
										autoCorrect={false}
										placeholder={i18n.t("passwordPlaceholder")}
										placeholderTextColor="#999"
									/>

									<Text style={styles.label}>{i18n.t("confirmPassword")}</Text>
									<TextInput
										style={styles.input}
										value={confirmPassword}
										onChangeText={setConfirmPassword}
										secureTextEntry
										autoCapitalize="none"
										autoCorrect={false}
										placeholder={i18n.t("confirmPasswordPlaceholder")}
										placeholderTextColor="#999"
									/>

									<TouchableOpacity
										style={[styles.primaryButton, submitting && styles.buttonDisabled]}
										onPress={handleResetPassword}
										disabled={submitting}
									>
										{submitting ? (
											<ActivityIndicator color="#fff" />
										) : (
											<Text style={styles.primaryButtonText}>{i18n.t("resetPasswordButton")}</Text>
										)}
									</TouchableOpacity>

									<TouchableOpacity
										style={[styles.secondaryButton, submitting && styles.buttonDisabled]}
										onPress={handleSendCode}
										disabled={submitting}
									>
										<Text style={styles.secondaryButtonText}>{i18n.t("resendCodeButton")}</Text>
									</TouchableOpacity>
								</>
							)}

							<View style={styles.footerRow}>
								<TouchableOpacity onPress={() => router.replace({ pathname: "/login", params: { from } })}>
									<Text style={styles.footerLink}>{i18n.t("backToLogin")}</Text>
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
	scrollContent: {
		flexGrow: 1,
		justifyContent: "center",
		paddingHorizontal: wp("8%"),
		paddingVertical: hp("4%"),
	},
	header: {
		marginBottom: hp("2%"),
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
	demoBadge: {
		backgroundColor: "#FFF3CD",
		borderRadius: 8,
		padding: 10,
		marginBottom: hp("2%"),
	},
	demoBadgeText: {
		fontSize: RFValue(12),
		color: "#856404",
		lineHeight: RFValue(18),
		textAlign: "center",
	},
	label: {
		fontSize: RFValue(14),
		fontWeight: "600",
		color: "#333",
		marginBottom: hp("0.8%"),
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
	sentHint: {
		fontSize: RFValue(13),
		color: "#555",
		marginBottom: hp("1%"),
		lineHeight: RFValue(18),
	},
	demoCodeText: {
		fontSize: RFValue(16),
		fontWeight: "bold",
		color: "#840B1C",
		marginBottom: hp("2%"),
		textAlign: "center",
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
	footerLink: {
		fontSize: RFValue(14),
		color: "#840B1C",
		fontWeight: "bold",
	},
});
