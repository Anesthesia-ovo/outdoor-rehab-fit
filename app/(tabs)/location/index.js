import React, { useContext } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { LocaleContext } from "../../../contexts/LocaleContext";

const Location = () => {
	const { i18n } = useContext(LocaleContext);
	const url = i18n.t("url");
	return <WebView style={styles.container} source={{ uri: url }} />;
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});

export default Location;
