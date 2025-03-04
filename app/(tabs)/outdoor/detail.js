import React, { useEffect, useContext, useState } from "react";
import { StyleSheet, View, Text, ScrollView, Modal, TouchableOpacity, Image } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Collapsible } from "@/components/Collapsible";
import { ThemedText } from "@/components/ThemedText";
import { useNavigation } from "expo-router";
import { LocaleContext } from "../../../contexts/LocaleContext";
import YoutubePlayer from "react-native-youtube-iframe";
import AudioPlayer from "@/components/AudioPlayer";
import { Ionicons } from "@expo/vector-icons";
import { enSoundFiles, zhSoundFiles, gifFiles1, gifFiles2 } from "../../../constants/Equipments";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";

const Detail = () => {
	const { i18n, locale } = useContext(LocaleContext);
	const item = useLocalSearchParams();
	const navigation = useNavigation();

	const [modalVisible, setModalVisible] = useState(false);
	const [selectedImage, setSelectedImage] = useState(null);

	const openModal = (image) => {
		setSelectedImage(image);
		setModalVisible(true);
	};

	const closeModal = () => {
		setModalVisible(false);
		setSelectedImage(null);
	};

	const soundFile = locale === "en" ? enSoundFiles : zhSoundFiles;

	useEffect(() => {
		navigation.setOptions({ headerTitle: item.name });
	}, [navigation, item.name]);

	if (!item) {
		return <Text>Item not found</Text>;
	}

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<Modal visible={modalVisible} transparent={true} onRequestClose={closeModal}>
				<View style={styles.modalContainer}>
					<View style={styles.modalContent}>
						<Image source={selectedImage} style={styles.modalImage} />
						<TouchableOpacity style={styles.modalCloseButton} onPress={closeModal}>
							<Text style={styles.modalCloseText}>{i18n.t("close")}</Text>
							<Ionicons name="close" size={24} color="black" />
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
			<Image source={item.horizontalPic} style={styles.image} />
			<View style={styles.section}>
				<ThemedText style={styles.text}>{i18n.t("introduction")}</ThemedText>
				<Collapsible title={i18n.t("tip1")}>
					<ThemedText style={styles.text}>{item.kinesiologyTip}</ThemedText>
				</Collapsible>
				<Collapsible title={i18n.t("tip2")}>
					<ThemedText style={styles.text}>{item.ptTip}</ThemedText>
				</Collapsible>
				<Collapsible title={i18n.t("tip3")}>
					<ThemedText style={styles.text}>{item.otTip}</ThemedText>
				</Collapsible>
				<Collapsible title={i18n.t("tip4")}>
					<ThemedText style={styles.text}>{item.careTip}</ThemedText>
				</Collapsible>
			</View>
			<View style={styles.section}>
				<ThemedText style={styles.text}>{i18n.t("outdoorPractice")}</ThemedText>
				<View style={styles.gifContainer}>
					<TouchableOpacity style={styles.gifButton} onPress={() => openModal(gifFiles1[item.id])}>
						<Image source={gifFiles1[item.id]} style={styles.gif} />
					</TouchableOpacity>
					<TouchableOpacity style={styles.gifButton} onPress={() => openModal(gifFiles2[item.id])}>
						<Image source={gifFiles2[item.id]} style={styles.gif} />
					</TouchableOpacity>
				</View>
				<Collapsible title={i18n.t("useTips")}>
					<ThemedText style={styles.text}>{item.details}</ThemedText>
				</Collapsible>
			</View>
			<View style={styles.section}>
				<ThemedText style={styles.text}>{i18n.t("audioTitle")}</ThemedText>
				<View style={styles.section}>
					<AudioPlayer audioFile={soundFile[item.id]} />
				</View>
			</View>
			<View style={styles.section}>
				<ThemedText style={styles.text}>{i18n.t("reminderAndTips")}</ThemedText>
				<YoutubePlayer height={hp("35%")} play={false} videoId={item.youtubeKey} />
			</View>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		marginBottom: RFValue(16),
	},
	titleContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	stepContainer: {
		gap: 8,
		marginBottom: 8,
	},
	section: {
		padding: wp("5%"),
		marginBottom: hp("2%"),
		backgroundColor: "#fff",
	},
	image: {
		width: "100%",
		height: hp("35%"),
		resizeMode: "contain",
	},
	text: {
		fontSize: RFValue(16),
		lineHeight: RFValue(24),
		color: "#333",
		marginBottom: RFValue(16),
	},
	gifContainer: {
		flex: 1,
		flexDirection: "row",
		justifyContent: "space-between",
	},
	gifButton: {
		width: "40%",
	},
	gif: {
		width: "100%", // Adjust the width as needed
		height: hp("40%"), // Adjust the height as needed
		resizeMode: "cover",
	},
	modalContainer: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.8)",
		justifyContent: "center",
		alignItems: "center",
	},
	modalContent: {
		marginTop: 80,
		width: wp("90%"),
		height: hp("70%"),
		flexDirection: "column",
		justifyContent: "center",
		alignItems: "center",
	},
	modalImage: {
		width: "100%",
		height: "100%",
		resizeMode: "contain",
	},
	modalCloseButton: {
		position: "absolute",
		top: hp("0%"),
		right: wp("0%"),
		padding: 10,
		backgroundColor: "white",
		borderRadius: 5,
		flexDirection: "row",
		alignItems: "center",
	},
	modalCloseText: {
		color: "black",
		fontSize: 16,
		fontWeight: "bold",
	},
});

export default Detail;
