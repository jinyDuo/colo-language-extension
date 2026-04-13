import {
	DEFAULT_JAPANESE_LANGUAGE_CODE,
	resolveSheetLanguageCodeItems
} from '../constants/sheetLanguageCodes';
import type { LanguageDictionary, LanguageEntry } from '../types';

const buildDeclaredLanguageEntry = (
	entry: LanguageEntry,
	sheetLanguageCodeItems: readonly string[]
): LanguageEntry => {
	const lowerKeyToValue = new Map<string, string>();
	for (const [rawKey, rawValue] of Object.entries(entry)) {
		lowerKeyToValue.set(rawKey.toLowerCase(), rawValue);
	}
	const nextEntry: LanguageEntry = {};
	for (const declaredCode of sheetLanguageCodeItems) {
		nextEntry[declaredCode] = lowerKeyToValue.get(declaredCode) ?? '';
	}
	return nextEntry;
};

/**
 * Keeps only languages declared for this extension. Japanese uses both `ja` and `jp`; order follows `japaneseLanguageCode`.
 * Used for workspace JSON export.
 */
export const filterLanguageDictionaryToDeclaredSheetLanguages = (
	languageDictionary: LanguageDictionary,
	sheetLanguageCodeItems: readonly string[] = resolveSheetLanguageCodeItems(
		DEFAULT_JAPANESE_LANGUAGE_CODE
	)
): LanguageDictionary => {
	const filtered: LanguageDictionary = {};
	for (const codeKey of Object.keys(languageDictionary)) {
		filtered[codeKey] = buildDeclaredLanguageEntry(languageDictionary[codeKey], sheetLanguageCodeItems);
	}
	return filtered;
};
