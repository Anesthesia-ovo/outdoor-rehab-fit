import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { goBackOrHome } from "../utils/navigation";

/**
 * Header / in-page back control that falls back to home when stack is empty.
 */
export default function HeaderBackButton({ color = "#000", label, size = 22 }) {
	return (
		<TouchableOpacity style={styles.button} onPress={goBackOrHome} hitSlop={12}>
			<Ionicons name="chevron-back" size={RFValue(size)} color={color} />
			{!!label && <Text style={[styles.label, { color }]}>{label}</Text>}
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	button: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 4,
		paddingVertical: 4,
		minWidth: 40,
	},
	label: {
		marginLeft: 2,
		fontSize: RFValue(14),
		fontWeight: "600",
	},
});
