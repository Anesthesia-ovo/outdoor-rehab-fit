import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";

const WeatherComponent = ({ i18n }) => {
	const [weather, setWeather] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch("https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc")
			.then((response) => response.json())
			.then((data) => {
				const temperatureData = data.temperature?.data?.find((entry) => entry.place === "京士柏");
				const uvData = Array.isArray(data.uvindex?.data) ? data.uvindex.data.find((entry) => entry.place === "京士柏") : null;
				const humidityData = data.humidity?.data?.find((entry) => entry.place === "香港天文台");

				setWeather({
					temperature: temperatureData ? `${temperatureData.value}°${temperatureData.unit}` : "N/A",
					uvIndex: uvData ? `${uvData.value} (${uvData.desc})` : "N/A",
					humidity: humidityData ? `${humidityData.value}%` : "N/A",
				});
			})
			.catch((error) => console.error("Error fetching weather data:", error))
			.finally(() => setLoading(false));
	}, []);

	if (loading) {
		return <ActivityIndicator size="large" color="#0000ff" />;
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
	outerContainer: {
		flex: 1,
		flexDirection: "row",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
		elevation: 5,
	},
	container: {
		padding: RFValue(12),
		borderRadius: 10,
		marginHorizontal: wp("1%"),
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
	},
	text: {
		fontSize: RFValue(12),
		marginLeft: wp("1%"),
	},
	suggestion: {
		fontSize: RFValue(10),
		color: "#ff6600",
		fontWeight: "bold",
		textAlign: "center",
		width: wp("40%"),
	},
});

export default WeatherComponent;
