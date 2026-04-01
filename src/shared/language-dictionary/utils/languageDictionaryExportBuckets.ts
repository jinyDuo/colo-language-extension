import { DEFAULT_TARGET_SHEET_NAMES } from '../../sheet-data/constants';
import type { LanguageDictionary } from '../types';
import { parseSheetNames } from '../../sheet-data/utils/sheetNameParser';

export type PrefixBucketItem = {
	sheetPrefix: string;
	dictionary: LanguageDictionary;
};

export const buildExportFileNameFromSheetPrefix = (sheetName: string): string => {
	const stem = sheetName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
	const safeStem = stem.length > 0 ? stem : 'sheet';
	return `${safeStem}_lang.json`;
};

export const splitDictionaryByConfiguredSheetPrefixes = (
	languageDictionary: LanguageDictionary,
	targetSheetNamesConfig: string
): { prefixBucketItems: PrefixBucketItem[]; otherDictionary: LanguageDictionary } => {
	const rawConfig = targetSheetNamesConfig.trim() || DEFAULT_TARGET_SHEET_NAMES;
	const sheetPrefixItems = parseSheetNames(rawConfig);

	const uniquePrefixItems: string[] = [];
	const seenUpperItems = new Set<string>();
	for (const name of sheetPrefixItems) {
		const trimmed = name.trim();
		const upper = trimmed.toUpperCase();
		if (trimmed.length === 0 || seenUpperItems.has(upper)) {
			continue;
		}
		seenUpperItems.add(upper);
		uniquePrefixItems.push(trimmed);
	}

	const sortedPrefixesForMatch = [...uniquePrefixItems].sort(
		(a, b) => b.length - a.length
	);

	const bucketByUpperPrefix = new Map<string, LanguageDictionary>();
	for (const prefix of uniquePrefixItems) {
		bucketByUpperPrefix.set(prefix.toUpperCase(), {});
	}

	const otherDictionary: LanguageDictionary = {};

	for (const codeKey of Object.keys(languageDictionary)) {
		const upperKey = codeKey.trim().toUpperCase();
		let matchedUpper: string | null = null;
		for (const prefix of sortedPrefixesForMatch) {
			const upperPrefix = prefix.toUpperCase();
			if (upperKey.startsWith(upperPrefix)) {
				matchedUpper = upperPrefix;
				break;
			}
		}
		if (matchedUpper !== null) {
			const bucket = bucketByUpperPrefix.get(matchedUpper);
			if (bucket) {
				bucket[codeKey] = languageDictionary[codeKey];
			}
		} else {
			otherDictionary[codeKey] = languageDictionary[codeKey];
		}
	}

	const prefixBucketItems: PrefixBucketItem[] = uniquePrefixItems.map((sheetPrefix) => ({
		sheetPrefix,
		dictionary: bucketByUpperPrefix.get(sheetPrefix.toUpperCase()) ?? {}
	}));

	return { prefixBucketItems, otherDictionary };
};
