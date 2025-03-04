import React from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

const Research = () => {
	return <WebView style={styles.container} source={{ uri: "https://sites.google.com/view/rselderly/戶外健體樂應用程式介紹?authuser=0" }} />;
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});

export default Research;
