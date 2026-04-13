import { SHEET_LANGUAGE_CODE_ITEMS } from '../constants/sheetLanguageCodes';
import type { LanguageDictionary, LanguageEntry } from '../types';

const buildDeclaredLanguageEntry = (entry: LanguageEntry): LanguageEntry => {
	const lowerKeyToValue = new Map<string, string>();
	for (const [rawKey, rawValue] of Object.entries(entry)) {
		lowerKeyToValue.set(rawKey.toLowerCase(), rawValue);
	}
	const nextEntry: LanguageEntry = {};
	for (const declaredCode of SHEET_LANGUAGE_CODE_ITEMS) {
		nextEntry[declaredCode] = lowerKeyToValue.get(declaredCode) ?? '';
	}
	return nextEntry;
};

/**
 * Keeps only languages declared for this extension (see SHEET_LANGUAGE_CODE_ITEMS).
 * Used for workspace JSON export.
 */
export const filterLanguageDictionaryToDeclaredSheetLanguages = (
	languageDictionary: LanguageDictionary
): LanguageDictionary => {
	const filtered: LanguageDictionary = {};
	for (const codeKey of Object.keys(languageDictionary)) {
		filtered[codeKey] = buildDeclaredLanguageEntry(languageDictionary[codeKey]);
	}
	return filtered;
};
