import type { JapaneseSheetLanguageCode } from '../constants/sheetLanguageCodes';
import type { LanguageDictionary, LanguageEntry } from '../types';

/**
 * Keeps a single Japanese key (`ja` or `jp`) per setting. Values come only from that column;
 * the other code is not mirrored into storage.
 */
export const normalizeLanguageEntryFromSheet = (
	entry: LanguageEntry,
	expectedJapanese: JapaneseSheetLanguageCode
): LanguageEntry => {
	let jaText = '';
	let jpText = '';
	const rest: LanguageEntry = {};
	for (const [rawKey, rawValue] of Object.entries(entry)) {
		const lower = rawKey.toLowerCase();
		if (lower === 'ja') {
			jaText = rawValue;
		} else if (lower === 'jp') {
			jpText = rawValue;
		} else {
			rest[rawKey] = rawValue;
		}
	}
	const hadJapaneseColumnKey = Object.keys(entry).some((rawKey) => {
		const lower = rawKey.toLowerCase();
		return lower === 'ja' || lower === 'jp';
	});
	if (!hadJapaneseColumnKey) {
		return rest;
	}
	if (expectedJapanese === 'ja') {
		return { ...rest, ja: jaText };
	}
	return { ...rest, jp: jpText };
};

export const normalizeLanguageDictionaryFromSheet = (
	languageDictionary: LanguageDictionary,
	expectedJapanese: JapaneseSheetLanguageCode
): LanguageDictionary => {
	const normalized: LanguageDictionary = {};
	for (const codeKey of Object.keys(languageDictionary)) {
		normalized[codeKey] = normalizeLanguageEntryFromSheet(
			languageDictionary[codeKey],
			expectedJapanese
		);
	}
	return normalized;
};
