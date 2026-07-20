export const AUTH_STORAGE_KEY = "authSession";
export const REGISTERED_USERS_KEY = "registeredUsers";

export const AUTH_ROLES = {
	USER: "user",
	GUEST: "guest",
};

export const USER_PROFILE_ROLES = {
	PARTICIPANT: "participant",
	STAFF: "staff",
	CAREGIVER: "caregiver",
};

export const PRESET_USER = {
	name: "Demo User",
	phone: "91234567",
	email: "demo@polyu.edu.hk",
	password: "outdoor2026",
	role: USER_PROFILE_ROLES.PARTICIPANT,
};

export const MIN_PASSWORD_LENGTH = 6;

export function normalizePhone(phone) {
	return phone.replace(/\D/g, "").replace(/^852/, "");
}

export function normalizeEmail(email) {
	return email.trim().toLowerCase();
}

export function isValidEmail(email) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone) {
	const normalized = normalizePhone(phone);
	return /^[0-9]{8}$/.test(normalized);
}

export function isEmailLogin(identifier) {
	return identifier.trim().includes("@");
}

export async function getRegisteredUsers(storage) {
	const data = await storage.getItem(REGISTERED_USERS_KEY);
	return data ? JSON.parse(data) : [];
}

function buildUserRecord({ name, phone, email, role, password }) {
	return {
		name: name.trim(),
		phone: normalizePhone(phone),
		email: email?.trim() ? normalizeEmail(email) : "",
		role,
		password,
	};
}

export async function saveRegisteredUser(storage, userInput) {
	const users = await getRegisteredUsers(storage);
	const user = buildUserRecord(userInput);

	if (!user.name) {
		return { success: false, error: "nameRequired" };
	}

	if (!isValidPhone(user.phone)) {
		return { success: false, error: "invalidPhone" };
	}

	if (user.email && !isValidEmail(user.email)) {
		return { success: false, error: "invalidEmail" };
	}

	if (users.some((item) => item.phone === user.phone)) {
		return { success: false, error: "phoneExists" };
	}

	if (user.email && users.some((item) => item.email === user.email)) {
		return { success: false, error: "emailExists" };
	}

	users.push(user);
	await storage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
	return { success: true, user };
}

function matchesPresetUser(user) {
	return {
		name: PRESET_USER.name,
		phone: PRESET_USER.phone,
		email: PRESET_USER.email,
		role: PRESET_USER.role,
	};
}

function toSessionUser(user) {
	return {
		name: user.name,
		phone: user.phone,
		email: user.email || "",
		profileRole: user.role,
	};
}

export async function validateCredentials(storage, identifier, password) {
	const trimmedIdentifier = identifier.trim();

	if (!trimmedIdentifier || !password) {
		return { valid: false, error: "loginRequired" };
	}

	const loginByEmail = isEmailLogin(trimmedIdentifier);

	if (loginByEmail) {
		const email = normalizeEmail(trimmedIdentifier);
		if (!isValidEmail(email)) {
			return { valid: false, error: "invalidEmail" };
		}

		if (email === PRESET_USER.email && password === PRESET_USER.password) {
			return { valid: true, user: matchesPresetUser(PRESET_USER) };
		}

		const users = await getRegisteredUsers(storage);
		const matchedUser = users.find((user) => user.email === email && user.password === password);

		if (matchedUser) {
			return { valid: true, user: toSessionUser(matchedUser) };
		}

		const emailRegistered = users.some((user) => user.email === email) || email === PRESET_USER.email;
		if (!emailRegistered) {
			return { valid: false, error: "emailNotRegistered" };
		}

		return { valid: false, error: "invalidCredentials" };
	}

	const phone = normalizePhone(trimmedIdentifier);

	if (!isValidPhone(phone)) {
		return { valid: false, error: "invalidPhone" };
	}

	if (phone === PRESET_USER.phone && password === PRESET_USER.password) {
		return { valid: true, user: matchesPresetUser(PRESET_USER) };
	}

	const users = await getRegisteredUsers(storage);
	const matchedUser = users.find((user) => user.phone === phone && user.password === password);

	if (matchedUser) {
		return { valid: true, user: toSessionUser(matchedUser) };
	}

	return { valid: false, error: "invalidCredentials" };
}
