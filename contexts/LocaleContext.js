// FILE: LocaleContext.js
import React, { createContext, useState } from "react";
import { I18n } from "i18n-js";
import { translations } from "../constants/Languages";
import { getLocales } from "expo-localization";

const deviceLanguage = getLocales()[0].languageCode;
// Initialize I18n with the translations
const i18n = new I18n(translations);
// if not en/zh, then zh
i18n.locale = deviceLanguage === "en" ? "en" : "zh";

export const LocaleContext = createContext();

export const LocaleProvider = ({ children }) => {
	const [locale, setLocale] = useState(i18n.locale);

	const changeLanguage = () => {
		const newLocale = locale === "en" ? "zh" : "en";
		i18n.locale = newLocale;
		setLocale(newLocale);
	};

	return <LocaleContext.Provider value={{ i18n, locale, changeLanguage }}>{children}</LocaleContext.Provider>;
};
