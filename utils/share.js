// App Upgrade #7: share a logged session to the in-app group or external apps
import { Share } from "react-native";
import { router } from "expo-router";
import { showAlert } from "./alert";
import { appendMessage, getMessages } from "./chat";
import { getWeeklyProgress } from "./goals";
import { formatDuration, formatDateTime } from "./dates";

export const buildSessionSummary = async (session, i18n, locale) => {
	const weekly = await getWeeklyProgress();
	const lines = [];
	lines.push(`🏃 ${i18n.t("sharedSessionTitle")}`);
	lines.push(`📅 ${formatDateTime(session.date, locale)}`);
	lines.push(`⏱️ ${i18n.t("totalDuration")}: ${formatDuration(session.durationSec)}`);
	lines.push(`📍 ${i18n.t(session.mode === "home" ? "homeSession" : "outdoorSession")}`);
	if (session.emotion != null) {
		lines.push(`😊 ${i18n.t("emotionScale")}: ${session.emotion}`);
	}
	if (session.rpe != null) {
		lines.push(`💪 ${i18n.t("rpeScale")}: ${session.rpe}`);
	}
	if (session.journal) {
		lines.push(`📝 ${i18n.t("sessionJournal")}: ${session.journal}`);
	}
	if (session.exercises?.length) {
		lines.push(`💪 ${i18n.t("exercisesDone")}:`);
		session.exercises.forEach((ex) => {
			lines.push(`  • ${ex.name}${ex.reps ? ` × ${ex.reps}` : ""}`);
		});
	}
	lines.push(`🎯 ${i18n.t("weeklyGoalProgress")}:`);
	lines.push(`  • ${i18n.t("aerobicGoal")}: ${weekly.progress.aerobic}/${weekly.targets.aerobic} ${i18n.t("days")}`);
	lines.push(`  • ${i18n.t("balanceGoal")}: ${weekly.progress.balance}/${weekly.targets.balance} ${i18n.t("days")}`);
	lines.push(`  • ${i18n.t("muscleGoal")}: ${weekly.progress.muscle}/${weekly.targets.muscle} ${i18n.t("days")}`);
	return lines.join("\n");
};

export const shareSession = async (session, i18n, locale) => {
	const summary = await buildSessionSummary(session, i18n, locale);
	showAlert(i18n.t("share"), "", [
		{ text: i18n.t("cancel"), style: "cancel" },
		{
			text: i18n.t("shareToGroup"),
			onPress: async () => {
				await appendMessage({
					sender: "me",
					senderName: i18n.t("meName"),
					type: "session",
					text: summary,
					timestamp: new Date().toISOString(),
				});
				showAlert("", i18n.t("sessionSharedToGroup"), [
					{
						text: "OK",
						onPress: () => router.push("/chat"),
					},
				]);
			},
		},
		{
			text: i18n.t("shareToExternal"),
			onPress: () => Share.share({ message: summary }),
		},
	]);
};

export { getMessages };
