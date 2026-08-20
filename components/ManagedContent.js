import React, { useContext, useEffect, useRef, useState } from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import YoutubePlayer from "react-native-youtube-iframe";
import { AuthContext } from "../contexts/AuthContext";
import { getPublicContent, sendResearchEvent } from "../utils/api";

function videoId(value) {
	const match = String(value || "").match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{6,})/);
	return match?.[1] || String(value || "").trim();
}

export default function ManagedContent({ pageKey }) {
	const { user } = useContext(AuthContext);
	const [items, setItems] = useState([]);
	const startedAt = useRef({});
	useEffect(() => {
		let active = true;
		getPublicContent(pageKey).then((result) => active && setItems(result.items || [])).catch(() => {});
		return () => { active = false; };
	}, [pageKey]);
	const track = (eventName, item, metadata = {}) => user?.token && sendResearchEvent(user.token, eventName, { screen: pageKey, contentId: item.id, contentType: item.contentType, title: item.title, ...metadata }).catch(() => {});
	const openFeature = async (item) => {
		track("content.click", item);
		if (/^https?:\/\//i.test(item.value)) await Linking.openURL(item.value);
		else router.push(item.value.startsWith("/") ? item.value : `/${item.value}`);
	};
	if (!items.length) return null;
	return <View style={styles.container}>{items.map((item) => <View key={item.id} style={styles.card}>
		<Text style={styles.title}>{item.title}</Text>
		{item.contentType === "text" && <TouchableOpacity onPress={() => track("content.click", item)}><Text style={styles.body}>{item.value}</Text></TouchableOpacity>}
		{item.contentType === "feature" && <TouchableOpacity style={styles.button} onPress={() => openFeature(item)}><Text style={styles.buttonText}>打开功能</Text></TouchableOpacity>}
		{item.contentType === "video" && <YoutubePlayer height={220} videoId={videoId(item.value)} onChangeState={(state) => {
			if (state === "playing") { startedAt.current[item.id] = Date.now(); track("video.play", item, { videoId: videoId(item.value) }); }
			if (state === "paused" || state === "ended") { const watchedMs = startedAt.current[item.id] ? Date.now() - startedAt.current[item.id] : 0; track(state === "ended" ? "video.completed" : "video.paused", item, { videoId: videoId(item.value), watchedMs, completed: state === "ended" }); delete startedAt.current[item.id]; }
		}} />}
	</View>)}</View>;
}
const styles = StyleSheet.create({
	container: { width: "100%", paddingHorizontal: 16, paddingBottom: 18 },
	card: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginTop: 12, borderWidth: 1, borderColor: "#E7E1E2" },
	title: { color: "#222", fontSize: 17, fontWeight: "800", marginBottom: 10 },
	body: { color: "#444", fontSize: 15, lineHeight: 22 },
	button: { backgroundColor: "#840B1C", borderRadius: 9, padding: 12, alignItems: "center" },
	buttonText: { color: "#fff", fontWeight: "800" },
});