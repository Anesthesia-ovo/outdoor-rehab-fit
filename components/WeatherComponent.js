import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { fetchWeatherData, unavailableWeather } from "../utils/weather";

const WeatherComponent = ({ i18n }) => {
	const [weather, setWeather] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchWeatherData()
			.then(setWeather)
			.catch((error) => {
				console.error("Error fetching weather data:", error);
				setWeather(unavailableWeather);
			})
			.finally(() => setLoading(false));
	}, []);

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#0000ff" />
			</View>
		);
	}

	if (!weather) {
		return (
			<View style={styles.outerContainer}>
				<View style={styles.container}>
					<Text style={styles.title}>{i18n.t("weatherInfo")}</Text>
					<Text style={styles.text}>N/A</Text>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.outerContainer}>
			<View style={styles.container}>
				<Text style={styles.title}>{i18n.t("weatherInfo")}</Text>
				<View style={styles.infoContainer}>
					<MaterialCommunityIcons name="thermometer" size={RFValue(18)} color="black" />
					<Text style={styles.text}>
						{i18n.t("tempature")}: {weather.temperature}
					</Text>
				</View>
				<View style={styles.infoContainer}>
					<MaterialCommunityIcons name="weather-sunny" size={RFValue(18)} color="black" />
					<Text style={styles.text}>
						{i18n.t("uv")}: {weather.uvIndex}
					</Text>
				</View>
				<View style={styles.infoContainer}>
					<MaterialCommunityIcons name="water-percent" size={RFValue(18)} color="black" />
					<Text style={styles.text}>
						{i18n.t("humidity")}: {weather.humidity}
					</Text>
				</View>
			</View>
			<View style={styles.container}>
				<Text style={styles.suggestion}>{i18n.t("uvWarn")}</Text>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	loadingContainer: {
		minHeight: hp("8%"),
		justifyContent: "center",
		alignItems: "center",
		width: "100%",
	},
	outerContainer: {
		width: "100%",
		flexDirection: "row",
		alignItems: "stretch",
		gap: wp("2%"),
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
		elevation: 5,
	},
	container: {
		flex: 1,
		minWidth: 0,
		padding: RFValue(10),
		borderRadius: 10,
		backgroundColor: "rgba(255, 255, 255, 0.8)",
		justifyContent: "center",
	},
	title: {
		fontSize: RFValue(12),
		fontWeight: "bold",
		marginBottom: RFValue(5),
	},
	infoContainer: {
		flexDirection: "row",
		alignItems: "center",
		flexShrink: 1,
	},
	text: {
		fontSize: RFValue(12),
		marginLeft: wp("1%"),
		flexShrink: 1,
	},
	suggestion: {
		fontSize: RFValue(10),
		color: "#ff6600",
		fontWeight: "bold",
		textAlign: "center",
		flexShrink: 1,
	},
});

export default WeatherComponent;
