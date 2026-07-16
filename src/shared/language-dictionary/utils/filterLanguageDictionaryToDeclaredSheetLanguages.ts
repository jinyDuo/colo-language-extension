import { SHEET_LANGUAGE_CODE_ITEMS } from '../constants/sheetLanguageCodes';
import type { LanguageDictionary, LanguageEntry } from '../types';

/** Lowercase column keys that appear in at least one row (sheet column union). */
export const collectPresentSheetColumnKeysLower = (
	languageDictionary: LanguageDictionary
): Set<string> => {
	const presentLowerItems = new Set<string>();
	for (const entry of Object.values(languageDictionary)) {
		for (const rawKey of Object.keys(entry)) {
			presentLowerItems.add(rawKey.toLowerCase());
		}
	}
	return presentLowerItems;
};

const buildDeclaredLanguageEntry = (
	entry: LanguageEntry,
	orderedExportCodes: readonly string[]
): LanguageEntry => {
	const lowerKeyToValue = new Map<string, string>();
	for (const [rawKey, rawValue] of Object.entries(entry)) {
		lowerKeyToValue.set(rawKey.toLowerCase(), rawValue);
	}
	const nextEntry: LanguageEntry = {};
	for (const declaredCode of orderedExportCodes) {
		nextEntry[declaredCode] = lowerKeyToValue.get(declaredCode) ?? '';
	}
	return nextEntry;
};

/**
 * Export JSON: only keys for columns that exist in the synced sheet data (union across rows),
 * and only if that column is allowed by the extension. Unknown columns (e.g. `xx`) are dropped.
 * Order follows `allowedSheetLanguageCodes` (e.g. ko, en, ja, zh, …).
 */
export const filterLanguageDictionaryToDeclaredSheetLanguages = (
	languageDictionary: LanguageDictionary,
	allowedSheetLanguageCodes: readonly string[] = SHEET_LANGUAGE_CODE_ITEMS
): LanguageDictionary => {
	const presentLowerItems = collectPresentSheetColumnKeysLower(languageDictionary);
	const orderedExportCodes = allowedSheetLanguageCodes.filter((code) =>
		presentLowerItems.has(code.toLowerCase())
	);
	const filtered: LanguageDictionary = {};
	for (const codeKey of Object.keys(languageDictionary)) {
		filtered[codeKey] = buildDeclaredLanguageEntry(languageDictionary[codeKey], orderedExportCodes);
	}
	return filtered;
};
