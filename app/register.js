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
import { router, useLocalSearchParams } from "expo-router";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { LocaleContext } from "../contexts/LocaleContext";
import { useAuth } from "../contexts/AuthContext";
import { USER_PROFILE_ROLES } from "../constants/auth";
import { navigateAfterAuth } from "../utils/onboarding";

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
};

const ROLE_OPTIONS = [
	USER_PROFILE_ROLES.PARTICIPANT,
	USER_PROFILE_ROLES.STAFF,
	USER_PROFILE_ROLES.CAREGIVER,
];

export default function RegisterScreen() {
	const { i18n } = useContext(LocaleContext);
	const { register } = useAuth();
	const { from } = useLocalSearchParams();
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");
	const [profileRole, setProfileRole] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const handleRegister = async () => {
		setSubmitting(true);
		const result = await register({ name, phone, email, profileRole, password, confirmPassword });
		setSubmitting(false);

		if (!result.success) {
			const messageKey = ERROR_MESSAGES[result.error] || "registerRequired";
			Alert.alert(i18n.t("warning"), i18n.t(messageKey));
			return;
		}

		Alert.alert("", i18n.t("registerSuccess"), [
			{
				text: "OK",
				onPress: () => navigateAfterAuth(from),
			},
		]);
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
							<TextInput
								style={styles.input}
								value={phone}
								onChangeText={setPhone}
								keyboardType="phone-pad"
								autoCorrect={false}
								placeholder={i18n.t("phonePlaceholder")}
								placeholderTextColor="#999"
							/>

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
