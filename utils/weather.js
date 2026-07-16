export const HKO_WEATHER_URL =
	"https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc";

export const OPEN_METEO_URL =
	"https://api.open-meteo.com/v1/forecast?latitude=22.3193&longitude=114.1694&current=temperature_2m,relative_humidity_2m,uv_index";

export const unavailableWeather = {
	temperature: "N/A",
	uvIndex: "N/A",
	humidity: "N/A",
};

export const parseHkoWeather = (data) => {
	const temperatureData =
		data.temperature?.data?.find((entry) => entry.place === "京士柏") ?? data.temperature?.data?.[0];
	const uvData = Array.isArray(data.uvindex?.data)
		? data.uvindex.data.find((entry) => entry.place === "京士柏") ?? data.uvindex.data[0]
		: null;
	const humidityData =
		data.humidity?.data?.find((entry) => entry.place === "香港天文台") ?? data.humidity?.data?.[0];

	return {
		temperature: temperatureData ? `${temperatureData.value}°${temperatureData.unit}` : "N/A",
		uvIndex: uvData ? `${uvData.value} (${uvData.desc})` : "N/A",
		humidity: humidityData ? `${humidityData.value}%` : "N/A",
	};
};

export const parseOpenMeteoWeather = (data) => {
	const current = data.current ?? {};

	return {
		temperature: current.temperature_2m != null ? `${current.temperature_2m}°C` : "N/A",
		uvIndex: current.uv_index != null ? `${Math.round(current.uv_index)}` : "N/A",
		humidity: current.relative_humidity_2m != null ? `${current.relative_humidity_2m}%` : "N/A",
	};
};

export const fetchWeatherData = async () => {
	try {
		const response = await fetch(HKO_WEATHER_URL);
		if (!response.ok) {
			throw new Error(`HKO weather API responded with ${response.status}`);
		}

		const data = await response.json();
		return parseHkoWeather(data);
	} catch (hkoError) {
		const response = await fetch(OPEN_METEO_URL);
		if (!response.ok) {
			throw new Error(`Open-Meteo responded with ${response.status}`);
		}

		const data = await response.json();
		return parseOpenMeteoWeather(data);
	}
};
