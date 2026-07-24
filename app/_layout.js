import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useContext, useEffect } from "react";
import { View } from "react-native";
import "react-native-reanimated";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { AuthProvider, AuthContext } from "@/contexts/AuthContext";
import { ensurePlaybackAudioMode } from "@/utils/audioMode";

// Captures every touch to reset the 1.5h inactivity auto-logout timer (App Upgrade #4)
function ActivityTracker({ children }) {
	const { recordActivity } = useContext(AuthContext);
	return (
		<View
			style={{ flex: 1 }}
			onStartShouldSetResponderCapture={() => {
				recordActivity();
				return false;
			}}
		>
			{children}
		</View>
	);
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const [loaded] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
	});

	useEffect(() => {
		if (loaded) {
			SplashScreen.hideAsync();
			ensurePlaybackAudioMode();
		}
	}, [loaded]);

	if (!loaded) {
		return null;
	}

	return (
		<LocaleProvider>
			<AuthProvider>
				<ThemeProvider value={DefaultTheme}>
					<ActivityTracker>
						<Stack>
							<Stack.Screen name="index" options={{ headerShown: false, headerTitle: "Home" }} />
							{/* gestureEnabled: false prevents the iOS swipe-back gesture from
							    returning to the onboarding / Start screens */}
							<Stack.Screen name="(tabs)" options={{ headerShown: false, headerTitle: "Home", gestureEnabled: false }} />
							<Stack.Screen name="login" options={{ headerShown: false, gestureEnabled: false }} />
							<Stack.Screen name="register" options={{ headerShown: false }} />
							<Stack.Screen name="forgot-password" options={{ headerShown: false }} />
							<Stack.Screen name="firstdisclaimer" options={{ headerShown: false, gestureEnabled: false }} />
							<Stack.Screen name="firstsafety" options={{ headerShown: false, gestureEnabled: false }} />
							<Stack.Screen name="firstquestionnaire" options={{ title: "PAR-Q", gestureEnabled: false, headerBackVisible: false }} />
							<Stack.Screen name="+not-found" />
						</Stack>
					</ActivityTracker>
					<StatusBar style="auto" />
				</ThemeProvider>
			</AuthProvider>
		</LocaleProvider>
	);
}
