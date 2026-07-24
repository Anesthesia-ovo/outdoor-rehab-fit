import { PropsWithChildren, useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export function Collapsible({ children, title, onOpen }: PropsWithChildren & { title: string; onOpen?: () => void }) {
	const [isOpen, setIsOpen] = useState(false);
	const theme = useColorScheme() ?? "light";

	return (
		<ThemedView>
			<TouchableOpacity
				style={styles.heading}
				onPress={() => {
					setIsOpen((value) => {
						if (!value && onOpen) onOpen();
						return !value;
					});
				}}
				activeOpacity={0.8}
			>
				<IconSymbol name="chevron.right" size={18} weight="medium" color={Colors.light.icon} style={{ transform: [{ rotate: isOpen ? "90deg" : "0deg" }] }} />

				<ThemedText type="defaultSemiBold">{title}</ThemedText>
			</TouchableOpacity>
			{isOpen && <ThemedView style={styles.content}>{children}</ThemedView>}
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	heading: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 12,
		paddingVertical: 20,
		backgroundColor: Colors.light.background,
	},
	content: {
		marginTop: 6,
		marginLeft: 24,
	},
});
