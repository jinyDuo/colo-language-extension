/**
 * Extension-supported sheet / inline translation language codes.
 * `japaneseLanguageCode` picks exactly one Japanese key (`ja` or `jp`) for sync storage and JSON export.
 */
const SHEET_LANGUAGE_TAIL_CODE_ITEMS = ['zh', 'es', 'fr', 'de', 'pt', 'ru', 'it'] as const;

export type JapaneseSheetLanguageCode = 'ja' | 'jp';

export const DEFAULT_JAPANESE_LANGUAGE_CODE: JapaneseSheetLanguageCode = 'ja';

export const resolveJapaneseLanguageCodeFromSetting = (
	raw: string | undefined
): JapaneseSheetLanguageCode => (raw === 'jp' ? 'jp' : 'ja');

export const resolveSheetLanguageCodeItems = (
	expectedJapanese: JapaneseSheetLanguageCode
): readonly string[] => {
	const japaneseKey = expectedJapanese === 'ja' ? 'ja' : 'jp';
	return ['ko', 'en', japaneseKey, ...SHEET_LANGUAGE_TAIL_CODE_ITEMS];
};

/** Default list for tests / filter fallback; matches `DEFAULT_JAPANESE_LANGUAGE_CODE`. */
export const SHEET_LANGUAGE_CODE_ITEMS = resolveSheetLanguageCodeItems(DEFAULT_JAPANESE_LANGUAGE_CODE);

export type SheetLanguageCode =
	| 'ko'
	| 'en'
	| 'ja'
	| 'jp'
	| (typeof SHEET_LANGUAGE_TAIL_CODE_ITEMS)[number];
