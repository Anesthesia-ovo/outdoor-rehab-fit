import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";
import { createDatabase } from "../src/database.js";
import { hashPassword } from "../src/security.js";

async function withServer(run) {
  const database = createDatabase(":memory:");
  const app = createApp({ database, jwtSecret: "test-secret-with-more-than-thirty-two-characters" });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  try {
    await run(`http://127.0.0.1:${port}`, database);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    database.close();
  }
}

test("register, authenticate, and read the current user", async () => {
  await withServer(async (baseUrl) => {
    const smsRequest = await fetch(`${baseUrl}/api/auth/sms/request`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone: "91234568" }),
    });
    assert.equal(smsRequest.status, 201);
    const { testCode } = await smsRequest.json();

    const smsVerify = await fetch(`${baseUrl}/api/auth/sms/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone: "91234568", code: testCode }),
    });
    assert.equal(smsVerify.status, 200);
    const { verificationToken } = await smsVerify.json();

    const registration = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Research Tester",
        phone: "91234568",
        email: "tester@example.com",
        profileRole: "participant",
        password: "safe-password",
        verificationToken,
      }),
    });
    assert.equal(registration.status, 201);
    const registered = await registration.json();
    assert.ok(registered.token);
    assert.equal(registered.user.phone, "+85291234568");

    const duplicate = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Duplicate",
        phone: "91234568",
        profileRole: "participant",
        password: "safe-password",
        verificationToken,
      }),
    });
    assert.equal(duplicate.status, 409);

    const login = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier: "tester@example.com", password: "safe-password" }),
    });
    assert.equal(login.status, 200);
    const authenticated = await login.json();

    const me = await fetch(`${baseUrl}/api/users/me`, {
      headers: { authorization: `Bearer ${authenticated.token}` },
    });
    assert.equal(me.status, 200);
    assert.equal((await me.json()).user.name, "Research Tester");

    const resetRequest = await fetch(`${baseUrl}/api/auth/sms/request`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone: "91234568", purpose: "password_reset" }),
    });
    assert.equal(resetRequest.status, 201);
    const { testCode: resetCode } = await resetRequest.json();

    const resetVerify = await fetch(`${baseUrl}/api/auth/sms/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone: "91234568", code: resetCode, purpose: "password_reset" }),
    });
    assert.equal(resetVerify.status, 200);
    const { verificationToken: resetToken } = await resetVerify.json();

    const resetPassword = await fetch(`${baseUrl}/api/auth/password/reset`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier: "91234568", newPassword: "new-safe-password", verificationToken: resetToken }),
    });
    assert.equal(resetPassword.status, 200);

    const newLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier: "91234568", password: "new-safe-password" }),
    });
    assert.equal(newLogin.status, 200);
  });
});

test("enforces super administrator, administrator, and operator permissions", async () => {
	await withServer(async (baseUrl, database) => {
		const password = await hashPassword("admin-password");
		const now = new Date().toISOString();
		const insertUser = database.prepare(`
			INSERT INTO users (id, name, phone, email, profile_role, password_salt, password_hash, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		`);
		insertUser.run("super-1", "Super Admin", "+85290000001", "super@example.com", "staff", password.salt, password.hash, now, now);
		insertUser.run("admin-1", "Admin", "+85290000002", "admin@example.com", "staff", password.salt, password.hash, now, now);
		insertUser.run("operator-1", "Operator", "+85290000003", "operator@example.com", "staff", password.salt, password.hash, now, now);
		insertUser.run("participant-1", "Participant", "+85290000004", "participant@example.com", "participant", password.salt, password.hash, now, now);
		const insertAdmin = database.prepare(`
			INSERT INTO admin_accounts (user_id, system_role, permissions_json, is_active, created_by, created_at, updated_at)
			VALUES (?, ?, ?, 1, ?, ?, ?)
		`);
		insertAdmin.run("super-1", "super_admin", "[]", null, now, now);
		insertAdmin.run("admin-1", "admin", "[]", "super-1", now, now);
		insertAdmin.run("operator-1", "operator", JSON.stringify(["users.read"]), "admin-1", now, now);

		const login = async (identifier) => {
			const result = await fetch(`${baseUrl}/api/auth/login`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ identifier, password: "admin-password" }),
			});
			return (await result.json()).token;
		};
		const superToken = await login("super@example.com");
		const adminToken = await login("admin@example.com");
		const operatorToken = await login("operator@example.com");
		const participantToken = await login("participant@example.com");
		const adminCreatedUser = await fetch(`${baseUrl}/api/admin/users`, {
			method: "POST",
			headers: { authorization: `Bearer ${adminToken}`, "content-type": "application/json" },
			body: JSON.stringify({ name: "Created User", countryCode: "+852", phone: "90000005", email: "created@example.com", profileRole: "participant", password: "initial-password" }),
		});
		assert.equal(adminCreatedUser.status, 201);
		assert.equal((await adminCreatedUser.json()).user.phone, "+85290000005");
		const createdLogin = await fetch(`${baseUrl}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ identifier: "created@example.com", password: "initial-password" }) });
		assert.equal(createdLogin.status, 200);
		const initialChat = await fetch(`${baseUrl}/api/chat/messages`, {
			headers: { authorization: `Bearer ${participantToken}` },
		});
		assert.equal(initialChat.status, 200);
		assert.deepEqual((await initialChat.json()).messages, []);
		const sentChat = await fetch(`${baseUrl}/api/chat/messages`, {
			method: "POST",
			headers: { authorization: `Bearer ${participantToken}`, "content-type": "application/json" },
			body: JSON.stringify({ type: "text", text: "Hello research group" }),
		});
		assert.equal(sentChat.status, 201);
		const sentMessage = (await sentChat.json()).message;
		assert.equal(sentMessage.text, "Hello research group");
		const reaction = await fetch(`${baseUrl}/api/chat/messages/${sentMessage.id}/reactions`, {
			method: "POST",
			headers: { authorization: `Bearer ${participantToken}`, "content-type": "application/json" },
			body: JSON.stringify({ emoji: "👍" }),
		});
		assert.equal(reaction.status, 200);
		assert.equal((await reaction.json()).reactions["👍"], 1);

		const participantSearch = await fetch(`${baseUrl}/api/chat/participants?phone=90000004&countryCode=%2B852`, {
			headers: { authorization: `Bearer ${adminToken}` },
		});
		assert.equal(participantSearch.status, 200);
		assert.equal((await participantSearch.json()).participant.id, "participant-1");
		const createDirect = await fetch(`${baseUrl}/api/chat/conversations`, {
			method: "POST",
			headers: { authorization: `Bearer ${adminToken}`, "content-type": "application/json" },
			body: JSON.stringify({ participantId: "participant-1" }),
		});
		assert.equal(createDirect.status, 201);
		const directId = (await createDirect.json()).conversation.id;
		const directMessage = await fetch(`${baseUrl}/api/chat/conversations/${directId}/messages`, {
			method: "POST",
			headers: { authorization: `Bearer ${adminToken}`, "content-type": "application/json" },
			body: JSON.stringify({ type: "text", text: "Private research message" }),
		});
		assert.equal(directMessage.status, 201);
		const notifications = await fetch(`${baseUrl}/api/chat/notifications`, { headers: { authorization: `Bearer ${participantToken}` } });
		assert.equal(notifications.status, 200);
		assert.equal((await notifications.json()).notifications[0].preview, "Private research message");
		const directInbox = await fetch(`${baseUrl}/api/chat/conversations`, { headers: { authorization: `Bearer ${participantToken}` } });
		const participantConversation = (await directInbox.json()).conversations.find((item) => item.id === directId);
		assert.equal(participantConversation.unreadCount, 1);
		const directHistory = await fetch(`${baseUrl}/api/chat/conversations/${directId}/messages`, { headers: { authorization: `Bearer ${participantToken}` } });
		assert.equal(directHistory.status, 200);
		assert.equal((await directHistory.json()).messages[0].text, "Private research message");
		const groupedChatUsers = await fetch(`${baseUrl}/api/admin/chat-users`, { headers: { authorization: `Bearer ${adminToken}` } });
		assert.equal(groupedChatUsers.status, 200);
		assert.ok((await groupedChatUsers.json()).users.some((item) => item.id === "participant-1"));
		const groupedUserMessages = await fetch(`${baseUrl}/api/admin/chat-users/participant-1/messages`, { headers: { authorization: `Bearer ${adminToken}` } });
		assert.equal(groupedUserMessages.status, 200);
		assert.ok((await groupedUserMessages.json()).messages.length >= 2);
		const createGroup = await fetch(`${baseUrl}/api/chat/groups`, { method: "POST", headers: { authorization: `Bearer ${adminToken}`, "content-type": "application/json" }, body: JSON.stringify({ title: "Research Group", participantIds: ["participant-1"] }) });
		assert.equal(createGroup.status, 201);
		const group = (await createGroup.json()).conversation; assert.equal(group.memberCount, 2);
		const groupDetails = await fetch(`${baseUrl}/api/chat/conversations/${group.id}/details`, { headers: { authorization: `Bearer ${participantToken}` } });
		assert.equal(groupDetails.status, 200); assert.equal((await groupDetails.json()).members.length, 2);
		const renameGroup = await fetch(`${baseUrl}/api/chat/conversations/${group.id}`, { method: "PATCH", headers: { authorization: `Bearer ${adminToken}`, "content-type": "application/json" }, body: JSON.stringify({ title: "Renamed Group" }) });
		assert.equal(renameGroup.status, 200);
		const dissolveGroup = await fetch(`${baseUrl}/api/chat/conversations/${group.id}`, { method: "DELETE", headers: { authorization: `Bearer ${adminToken}` } });
		assert.equal(dissolveGroup.status, 200);

		const denied = await fetch(`${baseUrl}/api/admin/overview`, {
			headers: { authorization: `Bearer ${participantToken}` },
		});
		assert.equal(denied.status, 403);

		const operatorUsers = await fetch(`${baseUrl}/api/admin/users`, {
			headers: { authorization: `Bearer ${operatorToken}` },
		});
		assert.equal(operatorUsers.status, 200);
		const operatorOverview = await fetch(`${baseUrl}/api/admin/overview`, {
			headers: { authorization: `Bearer ${operatorToken}` },
		});
		assert.equal(operatorOverview.status, 403);

		const update = await fetch(`${baseUrl}/api/admin/users/participant-1`, {
			method: "PATCH",
			headers: { authorization: `Bearer ${adminToken}`, "content-type": "application/json" },
			body: JSON.stringify({ name: "Updated Participant", profileRole: "caregiver" }),
		});
		assert.equal(update.status, 200);
		assert.equal((await update.json()).user.profileRole, "caregiver");

		const createOperator = await fetch(`${baseUrl}/api/admin/personnel`, {
			method: "POST",
			headers: { authorization: `Bearer ${adminToken}`, "content-type": "application/json" },
			body: JSON.stringify({
				identifier: "participant@example.com",
				systemRole: "operator",
				permissions: ["dashboard.read", "research.read", "system_logs.read"],
			}),
		});
		assert.equal(createOperator.status, 201);
		const operatorAccount = (await createOperator.json()).account;
		assert.deepEqual(operatorAccount.permissions.sort(), ["dashboard.read", "research.read"]);
		const createdId = database.prepare("SELECT id FROM users WHERE email = 'created@example.com'").get().id;
		const deletedUser = await fetch(`${baseUrl}/api/admin/users/${createdId}`, { method: "DELETE", headers: { authorization: `Bearer ${adminToken}` } });
		assert.equal(deletedUser.status, 200);
		const deletedLogin = await fetch(`${baseUrl}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ identifier: "created@example.com", password: "initial-password" }) });
		assert.equal(deletedLogin.status, 401);

		const adminLogs = await fetch(`${baseUrl}/api/admin/system-logs`, {
			headers: { authorization: `Bearer ${adminToken}` },
		});
		assert.equal(adminLogs.status, 403);
		const superLogs = await fetch(`${baseUrl}/api/admin/system-logs`, {
			headers: { authorization: `Bearer ${superToken}` },
		});
		assert.equal(superLogs.status, 200);
		assert.equal((await superLogs.json()).logs.length, 6);
	});
});
