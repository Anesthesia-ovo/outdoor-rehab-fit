// Login / guest auth adapted from outdoor-rehab-fit-1 (phone/email registration)
// Keeps App Upgrade #4: auto log-out after 1.5 hours of inactivity
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
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
import { trackLoginEvent } from "../utils/usage";
import { clearCurrentOwner, ensureUserFolder } from "../utils/userStorage";

export const INACTIVITY_LIMIT_MS = 1.5 * 60 * 60 * 1000; // 1.5 hours

// Guests can only access this subset of equipment videos / audio instructions
export const GUEST_ALLOWED_EQUIPMENT_IDS = [0, 1, 2, 3, 4];

export const AuthContext = createContext(null);

function createUserSession(user) {
	return {
		name: user.name,
		username: user.name, // backward-compatible display field used elsewhere
		phone: user.phone,
		email: user.email || "",
		profileRole: user.profileRole || user.role,
		role: AUTH_ROLES.USER,
		isGuest: false,
		loginAt: new Date().toISOString(),
		lastActivity: Date.now(),
	};
}

function normalizeStoredSession(session) {
	if (!session.role) {
		session.role =
			session.name === "guest" || session.username === "guest" || session.isGuest
				? AUTH_ROLES.GUEST
				: AUTH_ROLES.USER;
	}

	if (!session.name && session.username) {
		session.name = session.username;
	}

	if (!session.username && session.name) {
		session.username = session.name;
	}

	session.isGuest = session.role === AUTH_ROLES.GUEST;
	return session;
}

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const lastActivityRef = useRef(Date.now());

	useEffect(() => {
		const restoreSession = async () => {
			try {
				const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
				if (stored) {
					const session = normalizeStoredSession(JSON.parse(stored));
					const lastActivity = session.lastActivity || Date.now();
					if (Date.now() - lastActivity < INACTIVITY_LIMIT_MS) {
						await ensureUserFolder(session);
						setUser(session);
						lastActivityRef.current = lastActivity;
					} else {
						await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
						await clearCurrentOwner();
					}
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
		if (!session) {
			await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
			await clearCurrentOwner();
			setUser(null);
			return;
		}
		const withActivity = { ...session, lastActivity: Date.now() };
		await ensureUserFolder(withActivity);
		await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(withActivity));
		setUser(withActivity);
	};

	const login = useCallback(async (identifier, password) => {
		const result = await validateCredentials(AsyncStorage, identifier, password);
		if (!result.valid) {
			return { success: false, error: result.error || "invalidCredentials" };
		}

		await persistSession(createUserSession(result.user));
		lastActivityRef.current = Date.now();
		await trackLoginEvent();
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
		lastActivityRef.current = Date.now();
		await trackLoginEvent();
		return { success: true };
	}, []);

	const loginAsGuest = useCallback(async () => {
		const session = {
			name: "guest",
			username: "guest",
			phone: "",
			email: "",
			profileRole: "",
			role: AUTH_ROLES.GUEST,
			isGuest: true,
			loginAt: new Date().toISOString(),
			lastActivity: Date.now(),
		};

		await persistSession(session);
		lastActivityRef.current = Date.now();
		return { success: true };
	}, []);

	const logout = useCallback(async () => {
		await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
		await clearCurrentOwner();
		setUser(null);
		router.replace("/login");
	}, []);

	/** Dev / test helper: clear onboarding + session and return to Start cover. */
	const resetOnboarding = useCallback(async () => {
		await AsyncStorage.multiRemove(["userAgreed", "safetyResponse", AUTH_STORAGE_KEY]);
		await clearCurrentOwner();
		setUser(null);
		router.replace("/");
	}, []);

	const recordActivity = useCallback(() => {
		lastActivityRef.current = Date.now();
	}, []);

	useEffect(() => {
		if (!user) return;
		const timer = setInterval(() => {
			if (Date.now() - lastActivityRef.current >= INACTIVITY_LIMIT_MS) {
				logout();
			} else {
				persistSession({
					...user,
					lastActivity: Date.now(),
				});
			}
		}, 60 * 1000);
		return () => clearInterval(timer);
	}, [user, logout]);

	const isGuest = user?.role === AUTH_ROLES.GUEST;
	const isUser = user?.role === AUTH_ROLES.USER;
	const isLoggedIn = isUser;
	const canAccessEquipment = useCallback(
		(equipmentId) => {
			if (isLoggedIn) return true;
			return GUEST_ALLOWED_EQUIPMENT_IDS.includes(Number(equipmentId));
		},
		[isLoggedIn]
	);

	const value = useMemo(
		() => ({
			user,
			isLoading,
			ready: !isLoading, // backward compatible
			isAuthenticated: !!user,
			isGuest,
			isUser,
			isLoggedIn,
			login,
			register,
			loginAsGuest,
			logout,
			resetOnboarding,
			recordActivity,
			canAccessEquipment,
		}),
		[user, isLoading, isGuest, isUser, isLoggedIn, login, register, loginAsGuest, logout, resetOnboarding, recordActivity, canAccessEquipment]
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
