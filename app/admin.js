import React, { useMemo, useState } from "react";
import {
	ActivityIndicator,
	Modal,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	useWindowDimensions,
	View,
} from "react-native";
import {
	createAdminPersonnel,
	createAdminUser,
	deleteAdminUser,
	getAdminMe,
	getAdminChatUsers,
	getAdminUserChatMessages,
	getAdminOverview,
	getAdminPersonnel,
	getAdminResearchEvents,
	getAdminContent,
	createAdminContent,
	updateAdminContent,
	deleteAdminContent,
	getAdminSystemLogs,
	getAdminUsers,
	loginAccount,
	updateAdminPersonnel,
	updateAdminUser,
} from "../utils/api";

const ROLE_LABELS = { participant: "参与者", staff: "项目人员", caregiver: "照顾者" };
const CONTENT_TYPE_LABELS = { video: "视频", text: "文字内容", feature: "功能入口" };
const PAGE_OPTIONS = [
	{ key: "home", label: "APP 首页" },
	{ key: "outdoor.detail", label: "户外器材详情页" },
];
const SYSTEM_ROLE_LABELS = { super_admin: "最高管理员", admin: "管理员", operator: "操作员" };
const PERMISSION_LABELS = {
	"dashboard.read": "查看数据概览",
	"users.read": "查看用户资料",
	"users.edit": "编辑用户资料",
	"research.read": "查看科研数据",
	"messages.read": "查看聊天记录",
	"data.export": "导出数据",
};
const TABS = [
	{ key: "overview", label: "数据概览", permission: "dashboard.read" },
	{ key: "users", label: "用户管理", permission: "users.read" },
	{ key: "events", label: "科研数据", permission: "research.read" },
	{ key: "maintenance", label: "APP维护", permission: "users.edit" },
	{ key: "messages", label: "聊天记录", permission: "messages.read" },
	{ key: "personnel", label: "后台人员", permission: "operators.manage" },
	{ key: "logs", label: "系统日志", permission: "system_logs.read" },
];

function csvCell(value) {
	return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function exportUsersCsv(users) {
	if (Platform.OS !== "web") return;
	const rows = [
		["姓名", "手机号", "电邮", "角色", "注册时间"],
		...users.map((user) => [user.name, user.phone, user.email, ROLE_LABELS[user.profileRole], user.createdAt]),
	];
	const blob = new Blob(["\ufeff", rows.map((row) => row.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = `outdoor-fit-users-${new Date().toISOString().slice(0, 10)}.csv`;
	anchor.click();
	URL.revokeObjectURL(url);
}

function StatCard({ label, value, color = "#840B1C" }) {
	return (
		<View style={styles.statCard}>
			<View style={[styles.statAccent, { backgroundColor: color }]} />
			<Text style={styles.statValue}>{value ?? 0}</Text>
			<Text style={styles.statLabel}>{label}</Text>
		</View>
	);
}

export default function AdminDashboard() {
	const { width: viewportWidth } = useWindowDimensions();
	const compactLayout = viewportWidth < 900;
	const [identifier, setIdentifier] = useState("");
	const [password, setPassword] = useState("");
	const [token, setToken] = useState("");
	const [adminName, setAdminName] = useState("");
	const [adminAccess, setAdminAccess] = useState(null);
	const [activeTab, setActiveTab] = useState("overview");
	const [overview, setOverview] = useState(null);
	const [users, setUsers] = useState([]);
	const [events, setEvents] = useState([]);
	const [contentItems, setContentItems] = useState([]); const [editingContent, setEditingContent] = useState(null);
	const [chatUsers, setChatUsers] = useState([]);
	const [selectedChatUser, setSelectedChatUser] = useState(null);
	const [messages, setMessages] = useState([]);
	const [personnel, setPersonnel] = useState([]);
	const [systemLogs, setSystemLogs] = useState([]);
	const [search, setSearch] = useState("");
	const [editingUser, setEditingUser] = useState(null);
	const [creatingUser, setCreatingUser] = useState(null);
	const [editingPersonnel, setEditingPersonnel] = useState(null);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	const loadDashboard = async (adminToken, access, userSearch = "") => {
		const permissions = access.admin.permissions;
		const [overviewData, userData, eventData, messageData, personnelData, logData, contentData] = await Promise.all([
			permissions.includes("dashboard.read") ? getAdminOverview(adminToken) : Promise.resolve(null),
			permissions.includes("users.read") ? getAdminUsers(adminToken, userSearch) : Promise.resolve({ users: [] }),
			permissions.includes("research.read") ? getAdminResearchEvents(adminToken) : Promise.resolve({ events: [] }),
			permissions.includes("messages.read") ? getAdminChatUsers(adminToken) : Promise.resolve({ users: [] }),
			permissions.includes("operators.manage") ? getAdminPersonnel(adminToken) : Promise.resolve({ personnel: [] }),
			permissions.includes("system_logs.read") ? getAdminSystemLogs(adminToken) : Promise.resolve({ logs: [] }),
			permissions.includes("users.edit") ? getAdminContent(adminToken) : Promise.resolve({ items: [] }),
		]);
		setOverview(overviewData);
		setUsers(userData.users);
		setEvents(eventData.events);
		setChatUsers(messageData.users);
		setMessages([]);
		setSelectedChatUser(null);
		setPersonnel(personnelData.personnel);
		setSystemLogs(logData.logs);
		setContentItems(contentData.items);
	};

	const handleLogin = async () => {
		setLoading(true);
		setError("");
		try {
			const result = await loginAccount(identifier, password);
			const access = await getAdminMe(result.token);
			await loadDashboard(result.token, access);
			setToken(result.token);
			setAdminName(result.user.name);
			setAdminAccess(access);
			const firstTab = TABS.find((tab) => access.admin.permissions.includes(tab.permission));
			setActiveTab(firstTab?.key || "overview");
			setPassword("");
		} catch (loginError) {
			setError(loginError.code === "adminRequired" ? "此账号没有项目人员管理权限。" : "登录失败，请检查账号、密码和管理权限。");
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = async () => {
		setLoading(true);
		try {
			const result = await getAdminUsers(token, search);
			setUsers(result.users);
		} catch {
			setError("用户查询失败，请稍后重试。");
		} finally {
			setLoading(false);
		}
	};

	const openUserChat = async (chatUser) => {
		setLoading(true);
		setError("");
		try {
			const result = await getAdminUserChatMessages(token, chatUser.id);
			setSelectedChatUser(result.user);
			setMessages(result.messages);
		} catch {
			setError("聊天记录读取失败，请稍后重试。");
		} finally {
			setLoading(false);
		}
	};

	const handleSaveUser = async () => {
		setSaving(true);
		setError("");
		try {
			await updateAdminUser(token, editingUser.id, {
				name: editingUser.name,
				email: editingUser.email,
				profileRole: editingUser.profileRole,
			});
			setEditingUser(null);
			await loadDashboard(token, adminAccess, search);
		} catch (saveError) {
			setError(saveError.code === "emailExists" ? "该电邮已被其他用户使用。" : "保存失败，请检查填写内容。");
		} finally {
			setSaving(false);
		}
	};
	const handleDeleteUser = async (target) => {
		if (Platform.OS === "web" && !window.confirm(`确定删除用户“${target.name}”吗？个人资料将匿名化，且该账号不能再登录。`)) return;
		setSaving(true); setError("");
		try { await deleteAdminUser(token, target.id); await loadDashboard(token, adminAccess, search); }
		catch (deleteError) { setError(deleteError.code === "adminAccountMustBeRemovedFirst" ? "该用户拥有后台权限，请先移除其后台身份。" : deleteError.code === "cannotDeleteSelf" ? "不能删除当前登录账号。" : "删除用户失败。"); }
		finally { setSaving(false); }
	};

	const handleCreateUser = async () => {
		setSaving(true); setError("");
		try {
			await createAdminUser(token, creatingUser);
			setCreatingUser(null);
			await loadDashboard(token, adminAccess, search);
		} catch (createError) {
			const messagesByCode = { phoneExists: "该手机号已注册。", emailExists: "该电邮已注册。", invalidEmail: "电邮格式不正确。", invalidRegistration: "请完整填写资料，密码至少需要 8 位。" };
			setError(messagesByCode[createError.code] || "新增用户失败，请检查填写内容。");
		} finally { setSaving(false); }
	};

	const handleSaveContent = async () => {
		setSaving(true); setError("");
		try {
			const data = {
				pageKey: editingContent.pageKey,
				contentType: editingContent.contentType,
				title: editingContent.title,
				value: editingContent.value,
				sortOrder: Number(editingContent.sortOrder) || 0,
				isActive: editingContent.isActive,
			};
			if (editingContent.id) await updateAdminContent(token, editingContent.id, data);
			else await createAdminContent(token, data);
			setEditingContent(null);
			await loadDashboard(token, adminAccess, search);
		} catch {
			setError("维护内容保存失败，请检查页面、标题和内容地址。");
		} finally { setSaving(false); }
	};
	const handleDeleteContent = async (item) => {
		if (Platform.OS === "web" && !window.confirm(`确定永久删除“${item.title}”吗？`)) return;
		setSaving(true); setError("");
		try { await deleteAdminContent(token, item.id); await loadDashboard(token, adminAccess, search); }
		catch { setError("维护内容删除失败。"); }
		finally { setSaving(false); }
	};

	const togglePersonnelPermission = (permission) => {
		setEditingPersonnel((current) => ({
			...current,
			permissions: current.permissions.includes(permission)
				? current.permissions.filter((item) => item !== permission)
				: [...current.permissions, permission],
		}));
	};

	const handleSavePersonnel = async () => {
		setSaving(true);
		setError("");
		try {
			const data = {
				systemRole: editingPersonnel.systemRole,
				permissions: editingPersonnel.permissions,
				isActive: editingPersonnel.isActive,
			};
			if (editingPersonnel.userId) {
				await updateAdminPersonnel(token, editingPersonnel.userId, data);
			} else {
				await createAdminPersonnel(token, { ...data, identifier: editingPersonnel.identifier });
			}
			setEditingPersonnel(null);
			await loadDashboard(token, adminAccess, search);
		} catch (personnelError) {
			const messagesByCode = {
				userNotFound: "找不到该注册用户，请先让此人员注册 APP 账号。",
				adminAccountExists: "该用户已经拥有后台身份。",
				cannotAssignRole: "当前账号不能授予此管理角色。",
			};
			setError(messagesByCode[personnelError.code] || "后台人员权限保存失败。");
		} finally {
			setSaving(false);
		}
	};

	const eventMax = useMemo(() => Math.max(1, ...(overview?.eventTypes || []).map((item) => item.count)), [overview]);
	const visibleTabs = useMemo(
		() => TABS.filter((tab) => adminAccess?.admin.permissions.includes(tab.permission)),
		[adminAccess],
	);

	if (!token) {
		return (
			<View style={styles.loginPage}>
				<View style={styles.loginCard}>
					<Text style={styles.brand}>OUTDOOR-FIT</Text>
					<Text style={styles.loginTitle}>科研管理后台</Text>
					<Text style={styles.loginHint}>请使用已获授权的最高管理员、管理员或操作员账号登录。普通 APP 用户无法进入后台。</Text>
					<TextInput style={styles.input} value={identifier} onChangeText={setIdentifier} placeholder="手机号或电邮" autoCapitalize="none" />
					<TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="密码" secureTextEntry onSubmitEditing={handleLogin} />
					{!!error && <Text style={styles.errorText}>{error}</Text>}
					<TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
						{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>登录后台</Text>}
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.page}>
			<View style={styles.topbar}>
				<View>
					<Text style={styles.topbarBrand}>OUTDOOR-FIT</Text>
					<Text style={styles.topbarSubtitle}>科研管理后台</Text>
				</View>
				<View style={styles.adminArea}>
					<Text style={styles.adminName}>{adminName}</Text>
					<Text style={styles.adminRole}>{SYSTEM_ROLE_LABELS[adminAccess?.admin.systemRole]}</Text>
					<TouchableOpacity onPress={() => { setToken(""); setOverview(null); setAdminAccess(null); }}><Text style={styles.logout}>退出</Text></TouchableOpacity>
				</View>
			</View>

			<View style={[styles.body, compactLayout && styles.bodyCompact]}>
				<View style={[styles.primarySidebar, compactLayout && styles.primarySidebarCompact]}>
					{visibleTabs.map((tab, index) => <TouchableOpacity key={tab.key} style={[styles.primaryNavItem, activeTab === tab.key && styles.primaryNavItemActive]} onPress={() => setActiveTab(tab.key)}><Text style={styles.primaryNavIcon}>{["⌂","♟","▥","✉","⚙","≡"][index] || "•"}</Text><Text style={[styles.primaryNavText, activeTab === tab.key && styles.primaryNavTextActive]}>{tab.label.slice(0, 4)}</Text></TouchableOpacity>)}
				</View>
				<View style={[styles.secondarySidebar, compactLayout && styles.secondarySidebarCompact]}>
					<Text style={styles.secondaryTitle}>功能菜单</Text>
					{visibleTabs.map((tab) => (
						<TouchableOpacity key={tab.key} style={[styles.secondaryItem, activeTab === tab.key && styles.secondaryItemActive]} onPress={() => setActiveTab(tab.key)}>
							<Text style={[styles.secondaryItemText, activeTab === tab.key && styles.secondaryItemTextActive]}>{tab.label}</Text>
						</TouchableOpacity>
					))}
				</View>
				<View style={styles.mainArea}>
					<View style={styles.breadcrumb}><Text style={styles.breadcrumbHome}>⌂ 管理后台</Text><Text style={styles.breadcrumbDivider}>/</Text><Text style={styles.breadcrumbCurrent}>{TABS.find((tab) => tab.key === activeTab)?.label}</Text></View>
				<ScrollView contentContainerStyle={styles.content}>
					{!!error && <Text style={styles.errorBanner}>{error}</Text>}
					{activeTab === "overview" && overview && (
						<>
							<Text style={styles.sectionTitle}>数据概览</Text>
							<View style={styles.statsGrid}>
								<StatCard label="注册用户" value={overview.counts.users} />
								<StatCard label="科研事件" value={overview.counts.researchEvents} color="#235789" />
								<StatCard label="短信请求" value={overview.counts.smsRequests} color="#D97706" />
								<StatCard label="验证成功" value={overview.counts.smsVerified} color="#177245" />
								<StatCard label="聊天消息" value={overview.counts.messages} color="#6D28D9" />
								<StatCard label="有效同意" value={overview.counts.activeConsents} color="#0F766E" />
							</View>
							<View style={styles.panelRow}>
								<View style={styles.panel}>
									<Text style={styles.panelTitle}>用户角色分布</Text>
									{overview.roles.map((item) => <Text key={item.role} style={styles.dataLine}>{ROLE_LABELS[item.role] || item.role}：{item.count}</Text>)}
								</View>
								<View style={styles.panel}>
									<Text style={styles.panelTitle}>科研事件类型</Text>
									{overview.eventTypes.length === 0 && <Text style={styles.empty}>尚无科研事件</Text>}
									{overview.eventTypes.map((item) => (
										<View key={item.eventName} style={styles.barRow}>
											<Text style={styles.barLabel}>{item.eventName}</Text>
											<View style={styles.barTrack}><View style={[styles.barFill, { width: `${Math.max(6, item.count / eventMax * 100)}%` }]} /></View>
											<Text style={styles.barCount}>{item.count}</Text>
										</View>
									))}
								</View>
							</View>
						</>
					)}

					{activeTab === "users" && (
						<>
							<View style={styles.sectionHeader}>
								<Text style={styles.sectionTitle}>用户管理</Text>
								<View style={{ flexDirection: "row", gap: 8 }}>{adminAccess.admin.permissions.includes("users.edit") && <TouchableOpacity style={styles.primaryButton} onPress={() => setCreatingUser({ name: "", countryCode: "+852", phone: "", email: "", profileRole: "participant", password: "" })}><Text style={styles.primaryButtonText}>新增用户</Text></TouchableOpacity>}{adminAccess.admin.permissions.includes("data.export") && <TouchableOpacity style={styles.exportButton} onPress={() => exportUsersCsv(users)}><Text style={styles.exportButtonText}>导出 CSV</Text></TouchableOpacity>}</View>
							</View>
							<View style={styles.searchRow}>
								<TextInput style={[styles.input, styles.searchInput]} value={search} onChangeText={setSearch} placeholder="搜索姓名、手机号或电邮" onSubmitEditing={handleSearch} />
								<TouchableOpacity style={styles.searchButton} onPress={handleSearch}><Text style={styles.primaryButtonText}>搜索</Text></TouchableOpacity>
							</View>
							<View style={styles.userTableHeader}><Text style={[styles.tableHeadText, styles.userNameCell]}>姓名</Text><Text style={[styles.tableHeadText, styles.userContactCell]}>账号 / 联系方式</Text><Text style={[styles.tableHeadText, styles.userRoleCell]}>用户类型</Text><Text style={[styles.tableHeadText, styles.userDateCell]}>注册时间</Text><Text style={[styles.tableHeadText, styles.userActionCell]}>操作</Text></View>
							{users.map((user) => (
								<View key={user.id} style={styles.listCard}>
									<Text style={[styles.listTitle, styles.userNameCell]}>{user.name}</Text><View style={styles.userContactCell}><Text style={styles.listDetail}>{user.phone}</Text><Text style={styles.listMeta}>{user.email || "未填写电邮"}</Text></View><Text style={[styles.listDetail, styles.userRoleCell]}>{ROLE_LABELS[user.profileRole]}</Text><Text style={[styles.listMeta, styles.userDateCell]}>{new Date(user.createdAt).toLocaleString()}</Text>
									{adminAccess.admin.permissions.includes("users.edit") && (
										<View style={styles.userActionCell}><TouchableOpacity style={styles.editButton} onPress={() => setEditingUser({ ...user })}><Text style={styles.editButtonText}>编辑</Text></TouchableOpacity><TouchableOpacity style={[styles.editButton, { backgroundColor: "#FDECEC" }]} onPress={() => handleDeleteUser(user)}><Text style={{ color: "#B42318", fontWeight: "700" }}>删除</Text></TouchableOpacity></View>
									)}
								</View>
							))}
						</>
					)}

					{activeTab === "events" && (
						<>
							<Text style={styles.sectionTitle}>科研使用事件</Text>
							<Text style={styles.sectionHint}>原始科研事件为只读记录，避免研究数据被误改。</Text>
							{events.length === 0 && <Text style={styles.empty}>尚未收到科研使用数据</Text>}
							{events.map((event) => (
								<View key={event.id} style={styles.listCard}>
									<View style={styles.listMain}>
										<Text style={styles.listTitle}>{event.eventName}</Text>
										<Text style={styles.listDetail}>{event.participantName} · {new Date(event.eventTime).toLocaleString()}</Text>
										<Text style={styles.listMeta} numberOfLines={2}>{event.metadataJson}</Text>
									</View>
								</View>
							))}
						</>
					)}

					{activeTab === "maintenance" && (
						<>
							<View style={styles.sectionHeader}>
								<View><Text style={styles.sectionTitle}>APP 内容维护</Text><Text style={styles.sectionHint}>选择内容出现的界面，可新增视频、文字说明或功能入口，并控制排序及上下架。</Text></View>
								<TouchableOpacity style={styles.primaryButton} onPress={() => setEditingContent({ pageKey: "home", contentType: "video", title: "", value: "", sortOrder: 0, isActive: true })}><Text style={styles.primaryButtonText}>新增内容</Text></TouchableOpacity>
							</View>
							{contentItems.length === 0 && <Text style={styles.empty}>尚未配置维护内容</Text>}
							{contentItems.map((item) => (
								<View key={item.id} style={styles.listCard}>
									<View style={styles.listMain}>
										<Text style={styles.listTitle}>{item.title}</Text>
										<Text style={styles.listDetail}>{PAGE_OPTIONS.find((page) => page.key === item.pageKey)?.label || item.pageKey} · {CONTENT_TYPE_LABELS[item.contentType] || item.contentType} · 排序 {item.sortOrder}</Text>
										<Text style={styles.listMeta} numberOfLines={1}>{item.isActive ? "已上架" : "已下架"} · {item.value}</Text>
									</View>
									<TouchableOpacity style={styles.editButton} onPress={() => setEditingContent({ ...item })}><Text style={styles.editButtonText}>编辑</Text></TouchableOpacity>
									<TouchableOpacity style={[styles.editButton, { backgroundColor: "#FDECEC" }]} onPress={() => handleDeleteContent(item)}><Text style={{ color: "#B42318", fontWeight: "700" }}>删除</Text></TouchableOpacity>
								</View>
							))}
						</>
					)}

					{activeTab === "messages" && (
						<>
							<View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>{selectedChatUser ? `${selectedChatUser.name} 的聊天记录` : "按用户查看聊天记录"}</Text><Text style={styles.sectionHint}>聊天数据只读，并按用户归类供授权研究人员查看。</Text></View>{selectedChatUser && <TouchableOpacity style={styles.exportButton} onPress={() => { setSelectedChatUser(null); setMessages([]); }}><Text style={styles.exportButtonText}>返回用户列表</Text></TouchableOpacity>}</View>
							{!selectedChatUser && chatUsers.length === 0 && <Text style={styles.empty}>尚无服务器聊天记录</Text>}
							{!selectedChatUser && chatUsers.map((chatUser) => <TouchableOpacity key={chatUser.id} style={styles.listCard} onPress={() => openUserChat(chatUser)}><View style={styles.listMain}><Text style={styles.listTitle}>{chatUser.name}</Text><Text style={styles.listDetail}>{chatUser.phone}{chatUser.email ? ` · ${chatUser.email}` : ""}</Text><Text style={styles.listMeta}>相关消息 {chatUser.messageCount} 条 · 最近：{new Date(chatUser.lastMessageAt).toLocaleString()}</Text></View><Text style={styles.editButtonText}>查看 ›</Text></TouchableOpacity>)}
							{selectedChatUser && messages.length === 0 && <Text style={styles.empty}>该用户尚无聊天记录</Text>}
							{selectedChatUser && messages.map((message) => <View key={message.id} style={styles.listCard}><View style={styles.listMain}><Text style={styles.listTitle}>{message.senderName} · {message.conversationTitle}</Text><Text style={styles.listDetail}>{message.deletedAt ? "[消息已删除]" : message.body || (message.messageType === "image" ? "[图片]" : `[${message.messageType}]`)}</Text><Text style={styles.listMeta}>{new Date(message.createdAt).toLocaleString()}</Text></View></View>)}
						</>
					)}

					{activeTab === "personnel" && (
						<>
							<View style={styles.sectionHeader}>
								<View>
									<Text style={styles.sectionTitle}>后台人员与权限</Text>
									<Text style={styles.sectionHint}>管理员可创建操作员；最高管理员还可以创建管理员。</Text>
								</View>
								<TouchableOpacity
									style={styles.primaryButton}
									onPress={() => setEditingPersonnel({ identifier: "", systemRole: "operator", permissions: ["dashboard.read"], isActive: true })}
								>
									<Text style={styles.primaryButtonText}>新增后台人员</Text>
								</TouchableOpacity>
							</View>
							{personnel.map((person) => (
								<View key={person.userId} style={styles.listCard}>
									<View style={styles.listMain}>
										<Text style={styles.listTitle}>{person.name} · {SYSTEM_ROLE_LABELS[person.systemRole]}</Text>
										<Text style={styles.listDetail}>{person.phone}　{person.email || "未填写电邮"}</Text>
										<Text style={styles.listMeta}>
											{person.isActive ? "已启用" : "已停用"} · {person.systemRole === "operator" ? person.permissions.map((permission) => PERMISSION_LABELS[permission]).join("、") || "未分配权限" : "角色固定权限"}
										</Text>
									</View>
									{person.systemRole !== "super_admin" && (
										<TouchableOpacity style={styles.editButton} onPress={() => setEditingPersonnel({ ...person })}><Text style={styles.editButtonText}>权限设置</Text></TouchableOpacity>
									)}
								</View>
							))}
						</>
					)}

					{activeTab === "logs" && (
						<>
							<Text style={styles.sectionTitle}>系统日志</Text>
							<Text style={styles.sectionHint}>此页面仅最高管理员可访问，记录所有后台修改与权限变更。</Text>
							{systemLogs.length === 0 && <Text style={styles.empty}>尚无系统修改日志</Text>}
							{systemLogs.map((log) => (
								<View key={log.id} style={styles.listCard}>
									<View style={styles.listMain}>
										<Text style={styles.listTitle}>{log.action}</Text>
										<Text style={styles.listDetail}>{log.actorName} · {SYSTEM_ROLE_LABELS[log.actorRole] || log.actorRole || "系统"} · {new Date(log.createdAt).toLocaleString()}</Text>
										<Text style={styles.listMeta} numberOfLines={3}>对象：{log.targetType || "-"} / {log.targetId || "-"}　{log.metadataJson}</Text>
									</View>
								</View>
							))}
						</>
					)}
				</ScrollView>
				</View>
			</View>

			<Modal visible={!!creatingUser} transparent animationType="fade" onRequestClose={() => setCreatingUser(null)}>
				<View style={styles.modalOverlay}><ScrollView style={styles.personnelModalScroll} contentContainerStyle={styles.modalCard}>
					<Text style={styles.modalTitle}>新增用户</Text>
					<Text style={styles.fieldLabel}>姓名</Text><TextInput style={styles.input} value={creatingUser?.name || ""} onChangeText={(name) => setCreatingUser((value) => ({ ...value, name }))} />
					<Text style={styles.fieldLabel}>国家区号与手机号</Text><View style={styles.searchRow}><TextInput style={[styles.input, { width: 100 }]} value={creatingUser?.countryCode || "+852"} onChangeText={(countryCode) => setCreatingUser((value) => ({ ...value, countryCode }))} keyboardType="phone-pad" /><TextInput style={[styles.input, styles.searchInput]} value={creatingUser?.phone || ""} onChangeText={(phone) => setCreatingUser((value) => ({ ...value, phone }))} keyboardType="phone-pad" placeholder="手机号码" /></View>
					<Text style={styles.fieldLabel}>电邮（选填）</Text><TextInput style={styles.input} value={creatingUser?.email || ""} onChangeText={(email) => setCreatingUser((value) => ({ ...value, email }))} autoCapitalize="none" />
					<Text style={styles.fieldLabel}>初始密码（至少 8 位）</Text><TextInput style={styles.input} value={creatingUser?.password || ""} onChangeText={(password) => setCreatingUser((value) => ({ ...value, password }))} secureTextEntry />
					<Text style={styles.fieldLabel}>用户类型</Text><View style={styles.roleRow}>{Object.entries(ROLE_LABELS).map(([role, label]) => <TouchableOpacity key={role} style={[styles.roleButton, creatingUser?.profileRole === role && styles.roleButtonActive]} onPress={() => setCreatingUser((value) => ({ ...value, profileRole: role }))}><Text style={[styles.roleButtonText, creatingUser?.profileRole === role && styles.roleButtonTextActive]}>{label}</Text></TouchableOpacity>)}</View>
					<View style={styles.modalActions}><TouchableOpacity style={styles.cancelButton} onPress={() => setCreatingUser(null)}><Text style={styles.cancelButtonText}>取消</Text></TouchableOpacity><TouchableOpacity style={[styles.primaryButton, styles.saveButton]} onPress={handleCreateUser} disabled={saving}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>创建用户</Text>}</TouchableOpacity></View>
				</ScrollView></View>
			</Modal>

			<Modal visible={!!editingUser} transparent animationType="fade" onRequestClose={() => setEditingUser(null)}>
				<View style={styles.modalOverlay}>
					<View style={styles.modalCard}>
						<Text style={styles.modalTitle}>编辑用户</Text>
						<Text style={styles.fieldLabel}>姓名</Text>
						<TextInput style={styles.input} value={editingUser?.name || ""} onChangeText={(name) => setEditingUser((value) => ({ ...value, name }))} />
						<Text style={styles.fieldLabel}>电邮</Text>
						<TextInput style={styles.input} value={editingUser?.email || ""} onChangeText={(email) => setEditingUser((value) => ({ ...value, email }))} autoCapitalize="none" />
						<Text style={styles.fieldLabel}>角色</Text>
						<View style={styles.roleRow}>
							{Object.entries(ROLE_LABELS).map(([role, label]) => (
								<TouchableOpacity key={role} style={[styles.roleButton, editingUser?.profileRole === role && styles.roleButtonActive]} onPress={() => setEditingUser((value) => ({ ...value, profileRole: role }))}>
									<Text style={[styles.roleButtonText, editingUser?.profileRole === role && styles.roleButtonTextActive]}>{label}</Text>
								</TouchableOpacity>
							))}
						</View>
						<View style={styles.modalActions}>
							<TouchableOpacity style={styles.cancelButton} onPress={() => setEditingUser(null)}><Text style={styles.cancelButtonText}>取消</Text></TouchableOpacity>
							<TouchableOpacity style={[styles.primaryButton, styles.saveButton]} onPress={handleSaveUser} disabled={saving}>
								{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>保存修改</Text>}
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			<Modal visible={!!editingContent} transparent animationType="fade" onRequestClose={() => setEditingContent(null)}>
				<View style={styles.modalOverlay}><ScrollView style={styles.personnelModalScroll} contentContainerStyle={styles.modalCard}>
					<Text style={styles.modalTitle}>{editingContent?.id ? "编辑维护内容" : "新增维护内容"}</Text>
					<Text style={styles.fieldLabel}>显示界面</Text>
					<View style={styles.roleRow}>{PAGE_OPTIONS.map((page) => <TouchableOpacity key={page.key} style={[styles.roleButton, editingContent?.pageKey === page.key && styles.roleButtonActive]} onPress={() => setEditingContent((value) => ({ ...value, pageKey: page.key }))}><Text style={[styles.roleButtonText, editingContent?.pageKey === page.key && styles.roleButtonTextActive]}>{page.label}</Text></TouchableOpacity>)}</View>
					<Text style={styles.fieldLabel}>内容类型</Text>
					<View style={styles.roleRow}>{Object.entries(CONTENT_TYPE_LABELS).map(([type, label]) => <TouchableOpacity key={type} style={[styles.roleButton, editingContent?.contentType === type && styles.roleButtonActive]} onPress={() => setEditingContent((value) => ({ ...value, contentType: type }))}><Text style={[styles.roleButtonText, editingContent?.contentType === type && styles.roleButtonTextActive]}>{label}</Text></TouchableOpacity>)}</View>
					<Text style={styles.fieldLabel}>标题</Text><TextInput style={styles.input} value={editingContent?.title || ""} onChangeText={(title) => setEditingContent((value) => ({ ...value, title }))} />
					<Text style={styles.fieldLabel}>{editingContent?.contentType === "video" ? "YouTube 视频 ID 或网址" : editingContent?.contentType === "feature" ? "APP 路由或网页地址" : "文字内容"}</Text>
					<TextInput style={[styles.input, { minHeight: 82 }]} multiline value={editingContent?.value || ""} onChangeText={(value) => setEditingContent((current) => ({ ...current, value }))} />
					<Text style={styles.fieldLabel}>显示顺序（数字越小越靠前）</Text><TextInput style={styles.input} keyboardType="numeric" value={String(editingContent?.sortOrder ?? 0)} onChangeText={(sortOrder) => setEditingContent((value) => ({ ...value, sortOrder }))} />
					<TouchableOpacity style={[styles.statusButton, !editingContent?.isActive && styles.statusButtonInactive]} onPress={() => setEditingContent((value) => ({ ...value, isActive: !value.isActive }))}><Text style={styles.statusButtonText}>{editingContent?.isActive ? "已上架（点击下架）" : "已下架（点击上架）"}</Text></TouchableOpacity>
					<View style={styles.modalActions}><TouchableOpacity style={styles.cancelButton} onPress={() => setEditingContent(null)}><Text style={styles.cancelButtonText}>取消</Text></TouchableOpacity><TouchableOpacity style={[styles.primaryButton, styles.saveButton]} onPress={handleSaveContent} disabled={saving}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>保存并发布</Text>}</TouchableOpacity></View>
				</ScrollView></View>
			</Modal>

			<Modal visible={!!editingPersonnel} transparent animationType="fade" onRequestClose={() => setEditingPersonnel(null)}>
				<View style={styles.modalOverlay}>
					<ScrollView style={styles.personnelModalScroll} contentContainerStyle={styles.modalCard}>
						<Text style={styles.modalTitle}>{editingPersonnel?.userId ? "设置后台权限" : "新增后台人员"}</Text>
						{!editingPersonnel?.userId && (
							<>
								<Text style={styles.fieldLabel}>已注册用户的手机号或电邮</Text>
								<TextInput
									style={styles.input}
									value={editingPersonnel?.identifier || ""}
									onChangeText={(identifier) => setEditingPersonnel((value) => ({ ...value, identifier }))}
									autoCapitalize="none"
									placeholder="例如：admin@example.com"
								/>
							</>
						)}
						<Text style={styles.fieldLabel}>后台角色</Text>
						<View style={styles.roleRow}>
							{["operator", ...(adminAccess?.admin.systemRole === "super_admin" ? ["admin"] : [])].map((role) => (
								<TouchableOpacity
									key={role}
									style={[styles.roleButton, editingPersonnel?.systemRole === role && styles.roleButtonActive]}
									onPress={() => setEditingPersonnel((value) => ({ ...value, systemRole: role }))}
								>
									<Text style={[styles.roleButtonText, editingPersonnel?.systemRole === role && styles.roleButtonTextActive]}>{SYSTEM_ROLE_LABELS[role]}</Text>
								</TouchableOpacity>
							))}
						</View>
						{editingPersonnel?.systemRole === "operator" && (
							<>
								<Text style={styles.fieldLabel}>操作员权限</Text>
								<View style={styles.permissionGrid}>
									{Object.entries(PERMISSION_LABELS).map(([permission, label]) => {
										const selected = editingPersonnel.permissions.includes(permission);
										return (
											<TouchableOpacity key={permission} style={[styles.permissionItem, selected && styles.permissionItemActive]} onPress={() => togglePersonnelPermission(permission)}>
												<Text style={[styles.permissionText, selected && styles.permissionTextActive]}>{selected ? "✓ " : ""}{label}</Text>
											</TouchableOpacity>
										);
									})}
								</View>
							</>
						)}
						{!!editingPersonnel?.userId && (
							<TouchableOpacity
								style={[styles.statusButton, !editingPersonnel.isActive && styles.statusButtonInactive]}
								onPress={() => setEditingPersonnel((value) => ({ ...value, isActive: !value.isActive }))}
							>
								<Text style={styles.statusButtonText}>{editingPersonnel.isActive ? "账号已启用（点击停用）" : "账号已停用（点击启用）"}</Text>
							</TouchableOpacity>
						)}
						<View style={styles.modalActions}>
							<TouchableOpacity style={styles.cancelButton} onPress={() => setEditingPersonnel(null)}><Text style={styles.cancelButtonText}>取消</Text></TouchableOpacity>
							<TouchableOpacity style={[styles.primaryButton, styles.saveButton]} onPress={handleSavePersonnel} disabled={saving}>
								{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>保存权限</Text>}
							</TouchableOpacity>
						</View>
					</ScrollView>
				</View>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	loginPage: { flex: 1, minHeight: "100vh", backgroundColor: "#F4F1F2", alignItems: "center", justifyContent: "center", padding: 24 },
	loginCard: { width: "100%", maxWidth: 430, backgroundColor: "#fff", borderRadius: 18, padding: 32, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 18, elevation: 4 },
	brand: { color: "#840B1C", fontSize: 14, fontWeight: "800", letterSpacing: 2, textAlign: "center" },
	loginTitle: { color: "#222", fontSize: 28, fontWeight: "800", textAlign: "center", marginTop: 8 },
	loginHint: { color: "#666", fontSize: 14, lineHeight: 21, textAlign: "center", marginVertical: 20 },
	input: { borderWidth: 1, borderColor: "#D8D4D5", borderRadius: 10, backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#222", marginBottom: 12 },
	primaryButton: { backgroundColor: "#840B1C", borderRadius: 10, minHeight: 46, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
	primaryButtonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
	errorText: { color: "#B42318", fontSize: 13, marginBottom: 12 },
	page: { flex: 1, minHeight: "100vh", backgroundColor: "#E9EDF3" },
	topbar: { minHeight: 76, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#DDE2E8", paddingHorizontal: 28, flexDirection: "row", alignItems: "center", justifyContent: "space-between", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, zIndex: 3 },
	topbarBrand: { color: "#17181A", fontWeight: "900", fontSize: 22, letterSpacing: 1.2 },
	topbarSubtitle: { color: "#777", fontSize: 12, marginTop: 2 },
	adminArea: { flexDirection: "row", alignItems: "center", gap: 14 },
	adminName: { color: "#333", fontWeight: "600" },
	adminRole: { color: "#840B1C", backgroundColor: "#F5EDEF", borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4, fontSize: 12, fontWeight: "700" },
	logout: { color: "#840B1C", fontWeight: "700" },
	body: { flex: 1, flexDirection: "row", alignItems: "stretch" },
	bodyCompact: { flexDirection: "row" },
	primarySidebar: { width: 112, backgroundColor: "#1D1E20", paddingTop: 16, paddingBottom: 30 },
	primarySidebarCompact: { display: "none" },
	primaryNavItem: { minHeight: 74, alignItems: "center", justifyContent: "center", paddingHorizontal: 8, borderLeftWidth: 4, borderLeftColor: "transparent" },
	primaryNavItemActive: { backgroundColor: "#292B2F", borderLeftColor: "#840B1C" },
	primaryNavIcon: { color: "#C8CBD1", fontSize: 22, marginBottom: 5 },
	primaryNavText: { color: "#C8CBD1", fontSize: 13, fontWeight: "600", textAlign: "center" },
	primaryNavTextActive: { color: "#fff" },
	secondarySidebar: { width: 196, backgroundColor: "#fff", borderRightWidth: 1, borderRightColor: "#E0E4EA", paddingHorizontal: 16, paddingTop: 24 },
	secondarySidebarCompact: { width: 138, paddingHorizontal: 8 },
	secondaryTitle: { color: "#25272B", fontSize: 16, fontWeight: "800", marginBottom: 18, paddingHorizontal: 10 },
	secondaryItem: { borderRadius: 7, paddingHorizontal: 13, paddingVertical: 12, marginBottom: 7 },
	secondaryItemActive: { backgroundColor: "#F2E8EA" },
	secondaryItemText: { color: "#4F535A", fontSize: 14, fontWeight: "600" },
	secondaryItemTextActive: { color: "#840B1C", fontWeight: "800" },
	mainArea: { flex: 1, minWidth: 0 },
	breadcrumb: { minHeight: 60, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 28 },
	breadcrumbHome: { color: "#69717D", fontSize: 14 },
	breadcrumbDivider: { color: "#B1B7C0" },
	breadcrumbCurrent: { color: "#840B1C", fontSize: 15, fontWeight: "800" },
	tabs: { paddingHorizontal: 24, paddingTop: 18, gap: 8 },
	tab: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 22, backgroundColor: "#ECEDEF" },
	tabActive: { backgroundColor: "#840B1C" },
	tabText: { color: "#555", fontSize: 14, fontWeight: "600" },
	tabTextActive: { color: "#fff" },
	content: { width: "100%", maxWidth: 1380, alignSelf: "center", paddingHorizontal: 28, paddingBottom: 70 },
	sectionTitle: { color: "#202124", fontSize: 24, fontWeight: "800", marginBottom: 16 },
	sectionHint: { color: "#666", fontSize: 13, marginTop: -8, marginBottom: 16 },
	sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
	statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 22 },
	statCard: { flexGrow: 1, flexBasis: 160, minWidth: 150, backgroundColor: "#fff", borderRadius: 14, padding: 18, overflow: "hidden", borderWidth: 1, borderColor: "#ECEDEF" },
	statAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 5 },
	statValue: { color: "#222", fontSize: 28, fontWeight: "800" },
	statLabel: { color: "#73757A", fontSize: 13, marginTop: 4 },
	panelRow: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
	panel: { flexGrow: 1, flexBasis: 350, minWidth: 280, backgroundColor: "#fff", borderRadius: 14, padding: 20, borderWidth: 1, borderColor: "#ECEDEF" },
	panelTitle: { color: "#222", fontSize: 17, fontWeight: "700", marginBottom: 14 },
	dataLine: { color: "#4A4A4A", fontSize: 14, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
	barRow: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 6 },
	barLabel: { width: 120, color: "#555", fontSize: 12 },
	barTrack: { flex: 1, height: 9, borderRadius: 5, backgroundColor: "#EEE" },
	barFill: { height: 9, borderRadius: 5, backgroundColor: "#840B1C" },
	barCount: { width: 30, color: "#555", fontSize: 12, textAlign: "right" },
	searchRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
	searchInput: { flex: 1, marginBottom: 0 },
	searchButton: { backgroundColor: "#840B1C", borderRadius: 10, minWidth: 82, alignItems: "center", justifyContent: "center" },
	exportButton: { borderWidth: 1, borderColor: "#840B1C", borderRadius: 9, paddingHorizontal: 14, paddingVertical: 9 },
	exportButtonText: { color: "#840B1C", fontWeight: "700" },
	listCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 3, paddingHorizontal: 18, paddingVertical: 15, marginBottom: 1, borderBottomWidth: 1, borderBottomColor: "#E7E8EA" },
	userTableHeader: { flexDirection: "row", alignItems: "center", backgroundColor: "#F7F8FA", borderBottomWidth: 1, borderBottomColor: "#DDE1E6", paddingHorizontal: 18, paddingVertical: 15, marginTop: 8 },
	tableHeadText: { color: "#303238", fontSize: 13, fontWeight: "800" },
	userNameCell: { width: 150 },
	userContactCell: { flex: 1, minWidth: 190 },
	userRoleCell: { width: 110 },
	userDateCell: { width: 190 },
	userActionCell: { width: 150, flexDirection: "row", justifyContent: "flex-end", gap: 6 },
	listMain: { flex: 1, minWidth: 0 },
	listTitle: { color: "#252525", fontSize: 15, fontWeight: "700" },
	listDetail: { color: "#4F5155", fontSize: 13, marginTop: 5 },
	listMeta: { color: "#8A8C90", fontSize: 12, marginTop: 5 },
	editButton: { backgroundColor: "#F5EDEF", borderRadius: 8, paddingHorizontal: 15, paddingVertical: 9, marginLeft: 12 },
	editButtonText: { color: "#840B1C", fontWeight: "700" },
	empty: { color: "#888", fontSize: 14, backgroundColor: "#fff", borderRadius: 12, padding: 24, textAlign: "center" },
	errorBanner: { color: "#B42318", backgroundColor: "#FEECEB", borderRadius: 8, padding: 12, marginBottom: 14 },
	modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", padding: 20 },
	modalCard: { width: "100%", maxWidth: 500, backgroundColor: "#fff", borderRadius: 16, padding: 24 },
	personnelModalScroll: { width: "100%", maxWidth: 540, maxHeight: "90%", borderRadius: 16 },
	modalTitle: { color: "#222", fontSize: 22, fontWeight: "800", marginBottom: 18 },
	fieldLabel: { color: "#444", fontSize: 13, fontWeight: "700", marginBottom: 6 },
	roleRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 22 },
	roleButton: { borderWidth: 1, borderColor: "#CCC", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
	roleButtonActive: { borderColor: "#840B1C", backgroundColor: "#840B1C" },
	roleButtonText: { color: "#555", fontWeight: "600" },
	roleButtonTextActive: { color: "#fff" },
	permissionGrid: { gap: 8, marginBottom: 18 },
	permissionItem: { borderWidth: 1, borderColor: "#D7D7D7", backgroundColor: "#F8F8F8", borderRadius: 9, paddingHorizontal: 13, paddingVertical: 11 },
	permissionItemActive: { borderColor: "#840B1C", backgroundColor: "#F5EDEF" },
	permissionText: { color: "#555", fontSize: 14 },
	permissionTextActive: { color: "#840B1C", fontWeight: "700" },
	statusButton: { backgroundColor: "#E8F5EE", borderRadius: 9, padding: 12, alignItems: "center", marginBottom: 18 },
	statusButtonInactive: { backgroundColor: "#FDECEC" },
	statusButtonText: { color: "#444", fontWeight: "700" },
	modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
	cancelButton: { borderWidth: 1, borderColor: "#CCC", borderRadius: 10, minHeight: 46, justifyContent: "center", paddingHorizontal: 18 },
	cancelButtonText: { color: "#555", fontWeight: "700" },
	saveButton: { minWidth: 120 },
});
