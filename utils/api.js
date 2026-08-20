import { Platform } from "react-native";

const PRODUCTION_API_BASE_URL = "https://outdoor-fit.34-82-31-244.sslip.io/api";
export const API_BASE_URL = Platform.OS === "web"
	? "/api"
	: process.env.EXPO_PUBLIC_API_BASE_URL || PRODUCTION_API_BASE_URL;

export class ApiError extends Error {
	constructor(code, status) {
		super(code);
		this.code = code;
		this.status = status;
	}
}

async function request(path, { method = "GET", body, token } = {}) {
	let response;
	try {
		response = await fetch(`${API_BASE_URL}${path}`, {
			method,
			headers: {
				...(body ? { "Content-Type": "application/json" } : {}),
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			...(body ? { body: JSON.stringify(body) } : {}),
		});
	} catch {
		throw new ApiError("networkError", 0);
	}

	const payload = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new ApiError(payload.error || "serverError", response.status);
	}
	return payload;
}

function post(path, body) {
	return request(path, { method: "POST", body });
}

export function requestSmsCode(phone, purpose = "registration", countryCode = "+852") {
	return post("/auth/sms/request", { phone, purpose, countryCode });
}

export function verifySmsCode(phone, code, purpose = "registration", countryCode = "+852") {
	return post("/auth/sms/verify", { phone, code, purpose, countryCode });
}

export function resetPassword(identifier, newPassword, verificationToken, countryCode = "+852") {
	return post("/auth/password/reset", { identifier, newPassword, verificationToken, countryCode });
}

export function registerAccount(data) {
	return post("/auth/register", data);
}

export function loginAccount(identifier, password, countryCode = "+852") {
	return post("/auth/login", { identifier, password, countryCode });
}

export function sendResearchEvent(token, eventName, metadata = {}) {
	return request("/research/events", { method: "POST", body: { eventName, metadata, appVersion: "1.0.0" }, token });
}

export function getPublicContent(pageKey = "") {
	return request(`/content?pageKey=${encodeURIComponent(pageKey)}`);
}

export function getServerChatMessages(token) {
	return request("/chat/messages?limit=150", { token });
}

export function sendServerChatMessage(token, data) {
	return request("/chat/messages", { method: "POST", body: data, token });
}

export function toggleServerChatReaction(token, messageId, emoji) {
	return request(`/chat/messages/${encodeURIComponent(messageId)}/reactions`, {
		method: "POST",
		body: { emoji },
		token,
	});
}

export function searchChatParticipant(token, phone, countryCode = "+852") {
	return request(`/chat/participants?phone=${encodeURIComponent(phone)}&countryCode=${encodeURIComponent(countryCode)}`, { token });
}

export function getChatConversations(token) {
	return request("/chat/conversations", { token });
}

export function createChatConversation(token, participantId) {
	return request("/chat/conversations", { method: "POST", body: { participantId }, token });
}

export function getConversationMessages(token, conversationId) {
	return request(`/chat/conversations/${encodeURIComponent(conversationId)}/messages?limit=150`, { token });
}

export function sendConversationMessage(token, conversationId, data) {
	return request(`/chat/conversations/${encodeURIComponent(conversationId)}/messages`, { method: "POST", body: data, token });
}

export function toggleConversationReaction(token, conversationId, messageId, emoji) {
	return request(`/chat/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}/reactions`, {
		method: "POST", body: { emoji }, token,
	});
}

export function getChatNotifications(token) {
	return request("/chat/notifications", { token });
}

export function getAdminOverview(token) {
	return request("/admin/overview", { token });
}

export function getAdminMe(token) {
	return request("/admin/me", { token });
}

export function getAdminUsers(token, search = "") {
	return request(`/admin/users?search=${encodeURIComponent(search)}`, { token });
}

export function createAdminUser(token, data) {
	return request("/admin/users", { method: "POST", body: data, token });
}

export function updateAdminUser(token, userId, updates) {
	return request(`/admin/users/${encodeURIComponent(userId)}`, { method: "PATCH", body: updates, token });
}

export function deleteAdminUser(token, userId) {
	return request(`/admin/users/${encodeURIComponent(userId)}`, { method: "DELETE", token });
}

export function createChatGroup(token, title, participantIds) {
	return request("/chat/groups", { method: "POST", body: { title, participantIds }, token });
}

export function addChatGroupMember(token, conversationId, participantId) {
	return request(`/chat/conversations/${encodeURIComponent(conversationId)}/members`, { method: "POST", body: { participantId }, token });
}

export function getChatConversationDetails(token, conversationId) {
	return request(`/chat/conversations/${encodeURIComponent(conversationId)}/details`, { token });
}

export function renameChatGroup(token, conversationId, title) {
	return request(`/chat/conversations/${encodeURIComponent(conversationId)}`, { method: "PATCH", body: { title }, token });
}

export function leaveChatGroup(token, conversationId) {
	return request(`/chat/conversations/${encodeURIComponent(conversationId)}?mode=leave`, { method: "DELETE", token });
}

export function dissolveChatGroup(token, conversationId) {
	return request(`/chat/conversations/${encodeURIComponent(conversationId)}`, { method: "DELETE", token });
}

export function getAdminResearchEvents(token) {
	return request("/admin/research-events?limit=200", { token });
}

export function getAdminContent(token) { return request("/admin/content", { token }); }
export function createAdminContent(token, data) { return request("/admin/content", { method: "POST", body: data, token }); }
export function updateAdminContent(token, id, data) { return request(`/admin/content/${encodeURIComponent(id)}`, { method: "PATCH", body: data, token }); }
export function deleteAdminContent(token, id) { return request(`/admin/content/${encodeURIComponent(id)}`, { method: "DELETE", token }); }

export function getAdminMessages(token) {
	return request("/admin/messages?limit=100", { token });
}

export function getAdminChatUsers(token) {
	return request("/admin/chat-users", { token });
}

export function getAdminUserChatMessages(token, userId) {
	return request(`/admin/chat-users/${encodeURIComponent(userId)}/messages`, { token });
}

export function getAdminPersonnel(token) {
	return request("/admin/personnel", { token });
}

export function createAdminPersonnel(token, data) {
	return request("/admin/personnel", { method: "POST", body: data, token });
}

export function updateAdminPersonnel(token, userId, data) {
	return request(`/admin/personnel/${encodeURIComponent(userId)}`, { method: "PATCH", body: data, token });
}

export function getAdminSystemLogs(token) {
	return request("/admin/system-logs?limit=300", { token });
}
