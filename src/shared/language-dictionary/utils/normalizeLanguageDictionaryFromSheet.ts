import type { LanguageDictionary, LanguageEntry } from '../types';

/**
 * Maps legacy `ja` column/key to `jp`. Prefers a non-empty `jp` value when both exist.
 */
export const normalizeLanguageEntryFromSheet = (entry: LanguageEntry): LanguageEntry => {
	const lowerKeyToCell = new Map<string, { originalKey: string; value: string }>();
	for (const [rawKey, rawValue] of Object.entries(entry)) {
		lowerKeyToCell.set(rawKey.toLowerCase(), { originalKey: rawKey, value: rawValue });
	}
	const jaCell = lowerKeyToCell.get('ja');
	const jpCell = lowerKeyToCell.get('jp');
	const result: LanguageEntry = {};
	for (const [lower, { originalKey, value }] of lowerKeyToCell) {
		if (lower === 'ja' || lower === 'jp') {
			continue;
		}
		result[originalKey] = value;
	}
	if (jaCell || jpCell) {
		const jpText =
			jpCell !== undefined && jpCell.value.trim() !== ''
				? jpCell.value
				: jaCell !== undefined
					? jaCell.value
					: jpCell !== undefined
						? jpCell.value
						: '';
		result.jp = jpText;
	}
	return result;
};

export const normalizeLanguageDictionaryFromSheet = (
	languageDictionary: LanguageDictionary
): LanguageDictionary => {
	const normalized: LanguageDictionary = {};
	for (const codeKey of Object.keys(languageDictionary)) {
		normalized[codeKey] = normalizeLanguageEntryFromSheet(languageDictionary[codeKey]);
	}
	return normalized;
};
