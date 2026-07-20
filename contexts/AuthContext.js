import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
	AUTH_ROLES,
	AUTH_STORAGE_KEY,
	MIN_PASSWORD_LENGTH,
	USER_PROFILE_ROLES,
	isValidEmail,
	isValidPhone,
	saveRegisteredUser,
	validateCredentials,
} from "../constants/auth";

export const AuthContext = createContext(null);

function createUserSession(user) {
	return {
		name: user.name,
		phone: user.phone,
		email: user.email || "",
		profileRole: user.profileRole || user.role,
		role: AUTH_ROLES.USER,
		loginAt: new Date().toISOString(),
	};
}

function normalizeStoredSession(session) {
	if (!session.role) {
		session.role = session.name === "guest" || session.username === "guest" ? AUTH_ROLES.GUEST : AUTH_ROLES.USER;
	}

	if (!session.name && session.username) {
		session.name = session.username;
	}

	return session;
}

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const restoreSession = async () => {
			try {
				const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
				if (stored) {
					setUser(normalizeStoredSession(JSON.parse(stored)));
				}
			} catch (error) {
				console.error("Error restoring auth session", error);
			} finally {
				setIsLoading(false);
			}
		};

		restoreSession();
	}, []);

	const persistSession = async (session) => {
		await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
		setUser(session);
	};

	const login = useCallback(async (identifier, password) => {
		const result = await validateCredentials(AsyncStorage, identifier, password);
		if (!result.valid) {
			return { success: false, error: result.error || "invalidCredentials" };
		}

		await persistSession(createUserSession(result.user));
		return { success: true };
	}, []);

	const register = useCallback(async ({ name, phone, email, profileRole, password, confirmPassword }) => {
		if (!name?.trim() || !phone?.trim() || !profileRole || !password || !confirmPassword) {
			return { success: false, error: "registerRequired" };
		}

		if (!isValidPhone(phone)) {
			return { success: false, error: "invalidPhone" };
		}

		if (email?.trim() && !isValidEmail(email)) {
			return { success: false, error: "invalidEmail" };
		}

		if (!Object.values(USER_PROFILE_ROLES).includes(profileRole)) {
			return { success: false, error: "roleRequired" };
		}

		if (password.length < MIN_PASSWORD_LENGTH) {
			return { success: false, error: "passwordTooShort" };
		}

		if (password !== confirmPassword) {
			return { success: false, error: "passwordMismatch" };
		}

		const result = await saveRegisteredUser(AsyncStorage, {
			name,
			phone,
			email,
			role: profileRole,
			password,
		});

		if (!result.success) {
			return result;
		}

		await persistSession(createUserSession(result.user));
		return { success: true };
	}, []);

	const loginAsGuest = useCallback(async () => {
		const session = {
			name: "guest",
			phone: "",
			email: "",
			profileRole: "",
			role: AUTH_ROLES.GUEST,
			loginAt: new Date().toISOString(),
		};

		await persistSession(session);
		return { success: true };
	}, []);

	const logout = useCallback(async () => {
		await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
		setUser(null);
	}, []);

	const value = useMemo(
		() => ({
			user,
			isLoading,
			isAuthenticated: !!user,
			isGuest: user?.role === AUTH_ROLES.GUEST,
			isUser: user?.role === AUTH_ROLES.USER,
			login,
			register,
			loginAsGuest,
			logout,
		}),
		[user, isLoading, login, register, loginAsGuest, logout]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return context;
}
