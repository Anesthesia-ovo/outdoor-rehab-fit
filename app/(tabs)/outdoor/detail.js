import React, { useEffect, useContext, useState, useCallback } from "react";
import { StyleSheet, View, Text, ScrollView, Modal, TouchableOpacity, Image, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Collapsible } from "@/components/Collapsible";
import { ThemedText } from "@/components/ThemedText";
import { useNavigation } from "expo-router";
import { LocaleContext } from "../../../contexts/LocaleContext";
import { AuthContext } from "../../../contexts/AuthContext";
import YoutubePlayer from "react-native-youtube-iframe";
import AudioPlayer from "@/components/AudioPlayer";
import TTSButton from "@/components/TTSButton";
import { Ionicons } from "@expo/vector-icons";
import { enSoundFiles, zhSoundFiles, gifFiles1, gifFiles2 } from "../../../constants/Equipments";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { trackIntroLoad, trackAudioPlay } from "../../../utils/usage";
import { markRead, markWatched, markListened } from "../../../utils/learning";
import { showAlert } from "../../../utils/alert";

const Detail = () => {
	const { i18n, locale } = useContext(LocaleContext);
	const { canAccessEquipment, isGuest } = useContext(AuthContext);
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

	// App Upgrade #1: guests can only access some videos and audio instructions
	const hasFullAccess = canAccessEquipment(item.id);

	const promptLogin = () => {
		showAlert(i18n.t("guestRestrictedTitle"), i18n.t("guestRestrictedMessage"), [
			{ text: i18n.t("cancel"), style: "cancel" },
			{ text: i18n.t("loginNow"), onPress: () => router.push({ pathname: "/login", params: { from: "settings" } }) },
		]);
	};

	useEffect(() => {
		navigation.setOptions({ headerTitle: item.name });
	}, [navigation, item.name]);

	// App Upgrade #4: count loads of exercise introduction pages
	useEffect(() => {
		trackIntroLoad();
	}, []);

	// App Upgrade #10: learning progress
	const handleReadOpened = useCallback(() => markRead(item.id), [item.id]);
	const handleAudioPlay = useCallback(() => {
		trackAudioPlay(); // App Upgrade #4: count audio plays
		markListened(item.id);
	}, [item.id]);
	const handleVideoStateChange = useCallback(
		(state) => {
			if (state === "playing") markWatched(item.id);
		},
		[item.id]
	);

	// The text read aloud by TTS (#11)
	const ttsText = `${item.name}. ${item.details || ""}`;

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
				<Collapsible title={i18n.t("useTips")} onOpen={handleReadOpened}>
					<ThemedText style={styles.text}>{item.details}</ThemedText>
					{/* App Upgrade #11: Text to Speech */}
					<TTSButton text={ttsText} locale={locale} i18n={i18n} onPlay={handleReadOpened} />
				</Collapsible>
			</View>
			<View style={styles.section}>
				<ThemedText style={styles.text}>{i18n.t("audioTitle")}</ThemedText>
				<View style={styles.section}>
					{hasFullAccess ? (
						<AudioPlayer
							audioFile={soundFile[Number(item.id)] ?? soundFile[item.id]}
							onPlayStart={handleAudioPlay}
						/>
					) : (
						<TouchableOpacity style={styles.lockedBox} onPress={promptLogin}>
							<Ionicons name="lock-closed" size={RFValue(28)} color="#999" />
							<Text style={styles.lockedText}>{i18n.t("guestRestrictedSection")}</Text>
						</TouchableOpacity>
					)}
				</View>
			</View>
			<View style={styles.section}>
				<ThemedText style={styles.text}>{i18n.t("reminderAndTips")}</ThemedText>
				{hasFullAccess ? (
					<YoutubePlayer height={hp("35%")} play={false} videoId={item.youtubeKey} onChangeState={handleVideoStateChange} />
				) : (
					<TouchableOpacity style={styles.lockedBox} onPress={promptLogin}>
						<Ionicons name="lock-closed" size={RFValue(28)} color="#999" />
						<Text style={styles.lockedText}>{i18n.t("guestRestrictedSection")}</Text>
					</TouchableOpacity>
				)}
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
	lockedBox: {
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#f0f0f0",
		borderRadius: 12,
		padding: 24,
		borderWidth: 1,
		borderColor: "#ddd",
		borderStyle: "dashed",
	},
	lockedText: {
		marginTop: 10,
		fontSize: RFValue(13),
		color: "#888",
		textAlign: "center",
		lineHeight: RFValue(20),
	},
});

export default Detail;
