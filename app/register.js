import React, { useContext, useState } from "react";
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
import { USER_PROFILE_ROLES } from "../constants/auth";
import { requestSmsCode, verifySmsCode } from "../utils/api";
import { navigateAfterAuth } from "../utils/onboarding";
import CountrySelector from "../components/CountrySelector";
import { isValidInternationalPhone } from "../constants/countries";

const ERROR_MESSAGES = {
	registerRequired: "registerRequired",
	passwordTooShort: "passwordTooShort",
	passwordMismatch: "passwordMismatch",
	invalidPhone: "invalidPhone",
	invalidEmail: "invalidEmail",
	phoneExists: "phoneExists",
	emailExists: "emailExists",
	nameRequired: "nameRequired",
	roleRequired: "roleRequired",
	phoneNotVerified: "phoneNotVerified",
	smsDeliveryFailed: "smsDeliveryFailed",
	smsRateLimited: "smsRateLimited",
	smsVerificationFailed: "smsVerificationFailed",
	invalidOrExpiredCode: "invalidCode",
	networkError: "networkError",
	serverError: "serverError",
};

const ROLE_OPTIONS = [
	USER_PROFILE_ROLES.PARTICIPANT,
	USER_PROFILE_ROLES.CAREGIVER,
];

export default function RegisterScreen() {
	const { i18n } = useContext(LocaleContext);
	const { register } = useAuth();
	const { from } = useLocalSearchParams();
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [countryCode, setCountryCode] = useState("+852");
	const [verificationCode, setVerificationCode] = useState("");
	const [verificationToken, setVerificationToken] = useState("");
	const [codeSent, setCodeSent] = useState(false);
	const [sendingCode, setSendingCode] = useState(false);
	const [verifyingCode, setVerifyingCode] = useState(false);
	const [email, setEmail] = useState("");
	const [profileRole, setProfileRole] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const handleRegister = async () => {
		setSubmitting(true);
		const result = await register({ name, phone, countryCode, email, profileRole, password, confirmPassword, verificationToken });
		setSubmitting(false);

		if (!result.success) {
			const messageKey = ERROR_MESSAGES[result.error] || "registerRequired";
			showAlert(i18n.t("warning"), i18n.t(messageKey));
			return;
		}

		showAlert("", i18n.t("registerSuccess"), [
			{
				text: "OK",
				onPress: () => navigateAfterAuth(from),
			},
		]);
	};

	const handlePhoneChange = (value) => {
		setPhone(value);
		setVerificationCode("");
		setVerificationToken("");
		setCodeSent(false);
	};

	const handleCountryChange = (value) => {
		setCountryCode(value);
		handlePhoneChange("");
	};

	const handleSendCode = async () => {
		if (!isValidInternationalPhone(phone, countryCode)) {
			showAlert(i18n.t("warning"), i18n.t("invalidPhone"));
			return;
		}
		setSendingCode(true);
		try {
			await requestSmsCode(phone, "registration", countryCode);
			setCodeSent(true);
			showAlert(i18n.t("codeSentTitle"), i18n.t("codeSentSimple"));
		} catch (error) {
			showAlert(i18n.t("warning"), i18n.t(ERROR_MESSAGES[error.code] || "serverError"));
		} finally {
			setSendingCode(false);
		}
	};

	const handleVerifyCode = async () => {
		if (!/^\d{6}$/.test(verificationCode)) {
			showAlert(i18n.t("warning"), i18n.t("invalidCode"));
			return;
		}
		setVerifyingCode(true);
		try {
			const result = await verifySmsCode(phone, verificationCode, "registration", countryCode);
			setVerificationToken(result.verificationToken);
			showAlert("", i18n.t("verificationSuccess"));
		} catch (error) {
			showAlert(i18n.t("warning"), i18n.t(ERROR_MESSAGES[error.code] || "invalidCode"));
		} finally {
			setVerifyingCode(false);
		}
	};

	return (
		<ImageBackground source={require("@/assets/images/background.png")} resizeMethod="cover" style={styles.background}>
			<SafeAreaView style={styles.safeArea}>
				<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
					<ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
						<View style={styles.header}>
							<Text style={styles.title}>{i18n.t("registerTitle")}</Text>
							<Text style={styles.subtitle}>{i18n.t("registerSubtitle")}</Text>
						</View>

						<View style={styles.formCard}>
							<Text style={styles.label}>{i18n.t("name")}</Text>
							<TextInput
								style={styles.input}
								value={name}
								onChangeText={setName}
								autoCorrect={false}
								placeholder={i18n.t("namePlaceholder")}
								placeholderTextColor="#999"
							/>

							<Text style={styles.label}>{i18n.t("phone")}</Text>
							<View style={styles.phoneRow}>
								<CountrySelector i18n={i18n} value={countryCode} onChange={handleCountryChange} />
								<TextInput
									style={[styles.input, styles.phoneInput]}
									value={phone}
									onChangeText={handlePhoneChange}
									keyboardType="phone-pad"
									autoCorrect={false}
									placeholder={i18n.t("internationalPhonePlaceholder")}
									placeholderTextColor="#999"
								/>
							</View>

							<TouchableOpacity
								style={[styles.codeButton, sendingCode && styles.buttonDisabled]}
								onPress={handleSendCode}
								disabled={sendingCode || !!verificationToken}
							>
								{sendingCode ? <ActivityIndicator color="#840B1C" /> : (
									<Text style={styles.codeButtonText}>
										{codeSent ? i18n.t("resendCodeButton") : i18n.t("sendCodeButton")}
									</Text>
								)}
							</TouchableOpacity>

							{codeSent && !verificationToken && (
								<>
									<Text style={styles.label}>{i18n.t("verificationCode")}</Text>
									<TextInput
										style={styles.input}
										value={verificationCode}
										onChangeText={setVerificationCode}
										keyboardType="number-pad"
										maxLength={6}
										placeholder={i18n.t("verificationCodePlaceholder")}
										placeholderTextColor="#999"
									/>
									<TouchableOpacity
										style={[styles.codeButton, verifyingCode && styles.buttonDisabled]}
										onPress={handleVerifyCode}
										disabled={verifyingCode}
									>
										{verifyingCode ? <ActivityIndicator color="#840B1C" /> : (
											<Text style={styles.codeButtonText}>{i18n.t("verifyCodeButton")}</Text>
										)}
									</TouchableOpacity>
								</>
							)}

							{!!verificationToken && <Text style={styles.verifiedText}>{i18n.t("verifiedPhone")}</Text>}

							<Text style={styles.label}>{i18n.t("email")}</Text>
							<TextInput
								style={styles.input}
								value={email}
								onChangeText={setEmail}
								autoCapitalize="none"
								autoCorrect={false}
								keyboardType="email-address"
								placeholder={i18n.t("emailPlaceholder")}
								placeholderTextColor="#999"
							/>

							<Text style={styles.label}>{i18n.t("role")}</Text>
							<View style={styles.roleContainer}>
								{ROLE_OPTIONS.map((role) => {
									const selected = profileRole === role;
									return (
										<TouchableOpacity
											key={role}
											style={[styles.roleOption, selected && styles.roleOptionSelected]}
											onPress={() => setProfileRole(role)}
										>
											<Text style={[styles.roleOptionText, selected && styles.roleOptionTextSelected]}>
												{i18n.t(`profileRole_${role}`)}
											</Text>
										</TouchableOpacity>
									);
								})}
							</View>

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
								onPress={handleRegister}
								disabled={submitting}
							>
								{submitting ? (
									<ActivityIndicator color="#fff" />
								) : (
									<Text style={styles.primaryButtonText}>{i18n.t("registerButton")}</Text>
								)}
							</TouchableOpacity>

							<View style={styles.footerRow}>
								<Text style={styles.footerText}>{i18n.t("hasAccount")} </Text>
								<TouchableOpacity onPress={() => router.replace({ pathname: "/login", params: { from } })}>
									<Text style={styles.footerLink}>{i18n.t("goToLogin")}</Text>
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
		paddingHorizontal: wp("8%"),
		paddingVertical: hp("3%"),
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
		marginBottom: hp("1.8%"),
		backgroundColor: "#fff",
		color: "#333",
	},
	phoneRow: {
		flexDirection: "row",
		alignItems: "stretch",
		gap: 8,
		marginBottom: hp("1.8%"),
	},
	phoneInput: {
		flex: 1,
		minWidth: 0,
		marginBottom: 0,
	},
	roleContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		marginBottom: hp("1.8%"),
	},
	roleOption: {
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 20,
		paddingHorizontal: 14,
		paddingVertical: 8,
		backgroundColor: "#fff",
	},
	roleOptionSelected: {
		borderColor: "#840B1C",
		backgroundColor: "#840B1C",
	},
	roleOptionText: {
		fontSize: RFValue(12),
		color: "#333",
	},
	roleOptionTextSelected: {
		color: "#fff",
		fontWeight: "bold",
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
	buttonDisabled: {
		opacity: 0.7,
	},
	codeButton: {
		borderWidth: 1,
		borderColor: "#840B1C",
		borderRadius: 10,
		paddingVertical: hp("1.3%"),
		alignItems: "center",
		marginTop: -hp("0.8%"),
		marginBottom: hp("1.8%"),
		backgroundColor: "#fff",
	},
	codeButtonText: {
		color: "#840B1C",
		fontSize: RFValue(14),
		fontWeight: "bold",
	},
	verifiedText: {
		color: "#177245",
		fontWeight: "bold",
		marginTop: -hp("0.8%"),
		marginBottom: hp("1.8%"),
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
