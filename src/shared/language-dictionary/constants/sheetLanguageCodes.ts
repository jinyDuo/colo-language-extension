/**
 * Extension-supported sheet / inline translation language codes.
 * Keep in sync with `languageHelper.inlineTranslationLanguage` enum in package.json.
 */
export const SHEET_LANGUAGE_CODE_ITEMS = [
	'ko',
	'en',
	'jp',
	'zh',
	'es',
	'fr',
	'de',
	'pt',
	'ru',
	'it'
] as const;

export type SheetLanguageCode = (typeof SHEET_LANGUAGE_CODE_ITEMS)[number];
