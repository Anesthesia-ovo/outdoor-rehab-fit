// App Upgrade #7: custom SMS/group chat (text, photos, emoji reactions)
// App Upgrade #8: chatbot as group leader (Monday message) + enquiry handler (FAQ)
import React, { useCallback, useContext, useRef, useState } from "react";
import {
	StyleSheet,
	View,
	Text,
	TextInput,
	TouchableOpacity,
	FlatList,
	Image,
	KeyboardAvoidingView,
	Platform,
	Modal,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { LocaleContext } from "../../../contexts/LocaleContext";
import { AuthContext } from "../../../contexts/AuthContext";
import { getMessages, appendMessage, addReaction, ensureWeeklyBotMessage, getBotReply } from "../../../utils/chat";

const REACTION_EMOJIS = ["👍", "❤️", "💪", "👏", "😄", "🎉"];

const GroupChat = () => {
	const { i18n, locale } = useContext(LocaleContext);
	const { user } = useContext(AuthContext);
	const insets = useSafeAreaInsets();
	const [messages, setMessages] = useState([]);
	const [text, setText] = useState("");
	const [reactionTarget, setReactionTarget] = useState(null);
	const listRef = useRef(null);

	const myName = () =>
		user?.isGuest || user?.name === "guest" ? i18n.t("guestUser") : user?.name || user?.username || i18n.t("meName");

	const load = useCallback(async () => {
		let msgs = await getMessages();
		if (msgs.length === 0) {
			msgs = await appendMessage({
				sender: "staff",
				senderName: i18n.t("staffName"),
				type: "text",
				text: i18n.t("chatWelcome"),
				timestamp: new Date().toISOString(),
			});
		}
		const posted = await ensureWeeklyBotMessage(i18n);
		if (posted) msgs = await getMessages();
		setMessages(msgs);
	}, [i18n]);

	useFocusEffect(
		useCallback(() => {
			load();
		}, [load])
	);

	const scrollToEnd = () => {
		setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
	};

	const handleSend = async () => {
		const content = text.trim();
		if (!content) return;
		setText("");
		let msgs = await appendMessage({
			sender: "me",
			senderName: myName(),
			type: "text",
			text: content,
			timestamp: new Date().toISOString(),
		});
		setMessages([...msgs]);
		scrollToEnd();

		// Chatbot enquiry handler: reply only when FAQ keywords match
		const reply = getBotReply(content, locale);
		if (reply) {
			setTimeout(async () => {
				const next = await appendMessage({
					sender: "bot",
					senderName: i18n.t("chatbotName"),
					type: "text",
					text: reply,
					timestamp: new Date().toISOString(),
				});
				setMessages([...next]);
				scrollToEnd();
			}, 600);
		}
	};

	const handleSendPhoto = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.5 });
		if (!result.canceled && result.assets?.length) {
			const msgs = await appendMessage({
				sender: "me",
				senderName: myName(),
				type: "image",
				imageUri: result.assets[0].uri,
				timestamp: new Date().toISOString(),
			});
			setMessages([...msgs]);
			scrollToEnd();
		}
	};

	const handleReaction = async (emoji) => {
		if (!reactionTarget) return;
		const msgs = await addReaction(reactionTarget, emoji);
		setMessages([...msgs]);
		setReactionTarget(null);
	};

	const renderMessage = ({ item }) => {
		const isMe = item.sender === "me";
		const isBot = item.sender === "bot";
		const isSession = item.type === "session";
		return (
			<TouchableOpacity
				activeOpacity={0.8}
				onLongPress={() => setReactionTarget(item.id)}
				style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}
			>
				<View
					style={[
						styles.bubble,
						isMe ? styles.bubbleMe : isBot ? styles.bubbleBot : styles.bubbleOther,
						isSession && styles.bubbleSession,
					]}
				>
					{!isMe && (
						<Text style={[styles.sender, isBot && { color: "#840B1C" }]}>
							{isBot ? `🤖 ${item.senderName}` : item.senderName}
						</Text>
					)}
					{isSession && (
						<View style={styles.sessionTag}>
							<Ionicons name="fitness" size={RFValue(12)} color="#840B1C" />
							<Text style={styles.sessionTagText}>{i18n.t("sharedSessionTag")}</Text>
						</View>
					)}
					{item.type === "image" ? (
						<Image source={{ uri: item.imageUri }} style={styles.msgImage} />
					) : (
						<Text style={[styles.msgText, isMe && !isSession && { color: "#fff" }]}>{item.text}</Text>
					)}
					<Text style={[styles.time, isMe && !isSession && { color: "#f0d0d0" }]}>
						{new Date(item.timestamp).toLocaleTimeString(locale === "zh" ? "zh-HK" : "en-US", {
							hour: "2-digit",
							minute: "2-digit",
						})}
					</Text>
					{item.reactions && Object.keys(item.reactions).length > 0 && (
						<View style={styles.reactionRow}>
							{Object.entries(item.reactions).map(([emoji, count]) => (
								<View key={emoji} style={styles.reactionChip}>
									<Text style={styles.reactionText}>
										{emoji} {count}
									</Text>
								</View>
							))}
						</View>
					)}
				</View>
			</TouchableOpacity>
		);
	};

	const bottomPad = Math.max(insets.bottom, 12) + 8;

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : undefined}
			style={styles.container}
			keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
		>
			<FlatList
				ref={listRef}
				data={messages}
				keyExtractor={(item) => item.id}
				renderItem={renderMessage}
				contentContainerStyle={{ padding: wp("4%"), paddingBottom: hp("2%") }}
				onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
			/>

			<View style={[styles.inputBar, { paddingBottom: bottomPad }]}>
				<TouchableOpacity style={styles.photoBtn} onPress={handleSendPhoto}>
					<Ionicons name="image" size={RFValue(24)} color="#840B1C" />
				</TouchableOpacity>
				<TextInput
					style={styles.input}
					placeholder={i18n.t("messagePlaceholder")}
					value={text}
					onChangeText={setText}
					multiline
				/>
				<TouchableOpacity
					style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
					onPress={handleSend}
					disabled={!text.trim()}
					accessibilityLabel={i18n.t("send")}
				>
					<Ionicons name="send" size={RFValue(18)} color="#fff" />
				</TouchableOpacity>
			</View>

			<Modal visible={!!reactionTarget} transparent animationType="fade" onRequestClose={() => setReactionTarget(null)}>
				<TouchableOpacity style={styles.reactionOverlay} activeOpacity={1} onPress={() => setReactionTarget(null)}>
					<View style={styles.reactionPicker}>
						{REACTION_EMOJIS.map((emoji) => (
							<TouchableOpacity key={emoji} style={styles.reactionOption} onPress={() => handleReaction(emoji)}>
								<Text style={styles.reactionOptionText}>{emoji}</Text>
							</TouchableOpacity>
						))}
					</View>
				</TouchableOpacity>
			</Modal>
		</KeyboardAvoidingView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F5F1EA",
	},
	msgRow: {
		marginBottom: 12,
		flexDirection: "row",
	},
	msgRowMe: {
		justifyContent: "flex-end",
	},
	msgRowOther: {
		justifyContent: "flex-start",
	},
	bubble: {
		maxWidth: "80%",
		borderRadius: 16,
		padding: 12,
	},
	bubbleMe: {
		backgroundColor: "#840B1C",
		borderBottomRightRadius: 4,
	},
	bubbleOther: {
		backgroundColor: "#fff",
		borderBottomLeftRadius: 4,
	},
	bubbleBot: {
		backgroundColor: "#FFF3E6",
		borderWidth: 1,
		borderColor: "#F0C9A0",
		borderBottomLeftRadius: 4,
	},
	bubbleSession: {
		backgroundColor: "#EEF7F0",
		borderWidth: 1,
		borderColor: "#B7D9C0",
	},
	sessionTag: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 6,
		gap: 4,
	},
	sessionTagText: {
		fontSize: RFValue(11),
		color: "#840B1C",
		fontWeight: "600",
	},
	sender: {
		fontSize: RFValue(12),
		fontWeight: "bold",
		color: "#666",
		marginBottom: 4,
	},
	msgText: {
		fontSize: RFValue(15),
		color: "#333",
		lineHeight: RFValue(22),
	},
	msgImage: {
		width: wp("55%"),
		height: wp("55%"),
		borderRadius: 10,
		resizeMode: "cover",
	},
	time: {
		fontSize: RFValue(10),
		color: "#999",
		marginTop: 6,
		alignSelf: "flex-end",
	},
	reactionRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		marginTop: 6,
		gap: 4,
	},
	reactionChip: {
		backgroundColor: "rgba(0,0,0,0.06)",
		borderRadius: 10,
		paddingHorizontal: 8,
		paddingVertical: 3,
		marginRight: 4,
	},
	reactionText: {
		fontSize: RFValue(12),
	},
	inputBar: {
		flexDirection: "row",
		alignItems: "flex-end",
		paddingHorizontal: 10,
		paddingTop: 10,
		backgroundColor: "#fff",
		borderTopWidth: 1,
		borderTopColor: "#eee",
	},
	photoBtn: {
		padding: 10,
		marginBottom: 2,
	},
	input: {
		flex: 1,
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 20,
		paddingHorizontal: 14,
		paddingVertical: 10,
		fontSize: RFValue(15),
		maxHeight: hp("12%"),
		minHeight: 42,
		backgroundColor: "#f8f9fa",
	},
	sendBtn: {
		backgroundColor: "#840B1C",
		borderRadius: 22,
		width: 44,
		height: 44,
		justifyContent: "center",
		alignItems: "center",
		marginLeft: 8,
		marginBottom: 2,
	},
	sendBtnDisabled: {
		opacity: 0.45,
	},
	reactionOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.3)",
		justifyContent: "center",
		alignItems: "center",
	},
	reactionPicker: {
		flexDirection: "row",
		backgroundColor: "#fff",
		borderRadius: 30,
		padding: 10,
	},
	reactionOption: {
		padding: 8,
	},
	reactionOptionText: {
		fontSize: RFValue(26),
	},
});

export default GroupChat;
