import React from "react";
import { TouchableOpacity, StyleSheet, Text } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { goBackOrHome } from "../utils/navigation";

const CustomBackButton = ({ text }) => {
	return (
		<TouchableOpacity style={styles.button} onPress={goBackOrHome}>
			<Ionicons name="chevron-back" size={30} color="black" />
			{!!text && <Text style={styles.text}>{text}</Text>}
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	button: {
		flexDirection: "row",
		alignItems: "center",
		padding: 10,
	},
	text: {
		marginLeft: 5,
		fontSize: 16,
		fontWeight: "bold",
		color: "black",
	},
});

export default CustomBackButton;
