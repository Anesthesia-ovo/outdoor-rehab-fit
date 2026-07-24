import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import Slider from "@react-native-community/slider";
import { MaterialIcons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { ensurePlaybackAudioMode } from "../utils/audioMode";

const AudioPlayer = ({ audioFile, onPlayStart }) => {
	const player = useAudioPlayer(audioFile);
	const status = useAudioPlayerStatus(player);

	const isPlaying = status.playing;

	useEffect(() => {
		ensurePlaybackAudioMode();
		if (player) {
			player.volume = 1;
		}
	}, [player]);

	async function playSound() {
		try {
			await Speech.stop();
			await ensurePlaybackAudioMode();
			if (onPlayStart) onPlayStart();
			if (player) {
				player.volume = 1;
			}
			// Replay from start if the audio has finished
			if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration - 0.25)) {
				await player.seekTo(0);
			}
			player.play();
		} catch (error) {
			console.warn("Audio play failed", error);
		}
	}

	function pauseSound() {
		player.pause();
	}

	function stopSound() {
		player.pause();
		player.seekTo(0);
	}

	const seekSound = (value) => {
		player.seekTo(value);
	};

	const formatTime = (seconds) => {
		if (!seconds || seconds < 0) seconds = 0;
		const minutes = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
	};

	if (!audioFile) {
		return (
			<View style={styles.container}>
				<Text style={styles.missingText}>Audio not available</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.buttonContainer}>
				<TouchableOpacity style={styles.button} onPress={isPlaying ? pauseSound : playSound}>
					<MaterialIcons name={isPlaying ? "pause-circle-filled" : "play-circle-filled"} size={50} color="#1E90FF" />
				</TouchableOpacity>
				<TouchableOpacity style={styles.button} onPress={stopSound}>
					<MaterialIcons name="stop-circle" size={50} color="#1E90FF" />
				</TouchableOpacity>
			</View>
			<Slider
				style={styles.slider}
				minimumValue={0}
				maximumValue={status.duration || 0}
				value={status.currentTime || 0}
				onSlidingComplete={seekSound}
			/>
			<View style={styles.timeContainer}>
				<Text style={styles.timeText}>{formatTime(status.currentTime)}</Text>
				<Text style={styles.timeText}>{formatTime(status.duration)}</Text>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		padding: 20,
	},
	buttonContainer: {
		flexDirection: "row",
		justifyContent: "space-around",
		marginBottom: 20,
	},
	button: {},
	buttonText: {
		color: "#fff",
		fontSize: 16,
	},
	slider: {
		width: "100%",
		height: 40,
	},
	timeContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: 10,
	},
	timeText: {
		fontSize: 16,
		color: "#000",
	},
	missingText: {
		fontSize: 14,
		color: "#999",
		textAlign: "center",
	},
});

export default AudioPlayer;
