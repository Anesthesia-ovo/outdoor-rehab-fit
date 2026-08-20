import { useContext, useEffect, useRef } from "react";
import { usePathname } from "expo-router";
import { AuthContext } from "../contexts/AuthContext";
import { sendResearchEvent } from "../utils/api";

export default function ResearchInteractionTracker({ children }) {
	const { user } = useContext(AuthContext); const pathname = usePathname();
	const taps = useRef([]); const enteredAt = useRef(Date.now()); const route = useRef(pathname);
	useEffect(() => {
		if (!user?.token) return undefined;
		sendResearchEvent(user.token, "screen.view", { screen: pathname }).catch(() => {});
		const previous = route.current; const started = enteredAt.current; route.current = pathname; enteredAt.current = Date.now(); taps.current = [];
		return () => { sendResearchEvent(user.token, "screen.leave", { screen: previous, durationMs: Date.now() - started, tapCount: taps.current.length }).catch(() => {}); };
	}, [pathname, user?.token]);
	useEffect(() => {
		if (!user?.token) return undefined;
		const timer = setInterval(() => { const interactions = taps.current; if (!interactions.length) return; taps.current = []; sendResearchEvent(user.token, "screen.tap_batch", { screen: route.current, count: interactions.length, interactions }).catch(() => {}); }, 10000);
		return () => clearInterval(timer);
	}, [user?.token]);
	const recordTap = (event) => {
		const nativeEvent = event?.nativeEvent || {};
		taps.current.push({
			target: nativeEvent.target == null ? null : String(nativeEvent.target),
			x: Number.isFinite(nativeEvent.pageX) ? Math.round(nativeEvent.pageX) : null,
			y: Number.isFinite(nativeEvent.pageY) ? Math.round(nativeEvent.pageY) : null,
			at: new Date().toISOString(),
		});
		if (taps.current.length > 100) taps.current = taps.current.slice(-100);
		return false;
	};
	return <>{typeof children === "function" ? children(recordTap) : children}</>;
}
