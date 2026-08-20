export const COUNTRY_OPTIONS = [
	{ code: "HK", dialCode: "+852", nameKey: "countryHongKong", min: 8, max: 8 },
	{ code: "CN", dialCode: "+86", nameKey: "countryMainlandChina", min: 11, max: 11 },
	{ code: "MO", dialCode: "+853", nameKey: "countryMacau", min: 8, max: 8 },
	{ code: "TW", dialCode: "+886", nameKey: "countryTaiwan", min: 9, max: 9, stripLeadingZero: true },
	{ code: "SG", dialCode: "+65", nameKey: "countrySingapore", min: 8, max: 8 },
	{ code: "MY", dialCode: "+60", nameKey: "countryMalaysia", min: 9, max: 10, stripLeadingZero: true },
	{ code: "US", dialCode: "+1", nameKey: "countryUsCanada", min: 10, max: 10 },
	{ code: "GB", dialCode: "+44", nameKey: "countryUnitedKingdom", min: 10, max: 10, stripLeadingZero: true },
	{ code: "AU", dialCode: "+61", nameKey: "countryAustralia", min: 9, max: 9, stripLeadingZero: true },
];

export function normalizeNationalPhone(phone, countryCode = "+852") {
	const country = COUNTRY_OPTIONS.find((item) => item.dialCode === countryCode) || COUNTRY_OPTIONS[0];
	let digits = String(phone || "").replace(/\D/g, "");
	const dialDigits = country.dialCode.slice(1);
	if (digits.startsWith(dialDigits) && digits.length > country.max) digits = digits.slice(dialDigits.length);
	if (country.stripLeadingZero) digits = digits.replace(/^0+/, "");
	return digits;
}

export function isValidInternationalPhone(phone, countryCode = "+852") {
	const country = COUNTRY_OPTIONS.find((item) => item.dialCode === countryCode) || COUNTRY_OPTIONS[0];
	const digits = normalizeNationalPhone(phone, countryCode);
	return digits.length >= country.min && digits.length <= country.max;
}
