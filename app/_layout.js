import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { AuthProvider } from "@/contexts/AuthContext";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const [loaded] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
	});

	useEffect(() => {
		if (loaded) {
			SplashScreen.hideAsync();
		}
	}, [loaded]);

	if (!loaded) {
		return null;
	}

	return (
		<LocaleProvider>
			<AuthProvider>
				<ThemeProvider value={DefaultTheme}>
					<Stack
						screenOptions={{
							gestureEnabled: true,
							fullScreenGestureEnabled: true,
							animation: "slide_from_right",
						}}
					>
						<Stack.Screen
							name="index"
							options={{ headerShown: false, headerTitle: "Home", gestureEnabled: false }}
						/>
						<Stack.Screen name="login" options={{ headerShown: false, gestureEnabled: false }} />
						<Stack.Screen name="register" options={{ headerShown: false }} />
						<Stack.Screen name="forgot-password" options={{ headerShown: false }} />
						{/* Prevent swipe-back from main app to Start/Login cover */}
						<Stack.Screen
							name="(tabs)"
							options={{ headerShown: false, headerTitle: "Home", gestureEnabled: false }}
						/>
						<Stack.Screen name="firstdisclaimer" options={{ headerShown: false, gestureEnabled: false }} />
						<Stack.Screen name="firstsafety" options={{ headerShown: false, gestureEnabled: false }} />
						<Stack.Screen name="firstquestionnaire" options={{ title: "PAR-Q", gestureEnabled: false }} />
						<Stack.Screen name="+not-found" />
					</Stack>
					<StatusBar style="auto" />
				</ThemeProvider>
			</AuthProvider>
		</LocaleProvider>
	);
}
