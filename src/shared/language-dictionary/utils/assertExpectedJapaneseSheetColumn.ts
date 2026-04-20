import type { JapaneseSheetLanguageCode } from '../constants/sheetLanguageCodes';
import type { LanguageDictionary } from '../types';

const collectJapaneseKeyPresenceInDictionary = (
	languageDictionary: LanguageDictionary
): { hasJa: boolean; hasJp: boolean } => {
	let hasJa = false;
	let hasJp = false;
	for (const entry of Object.values(languageDictionary)) {
		for (const rawKey of Object.keys(entry)) {
			const lower = rawKey.toLowerCase();
			if (lower === 'ja') {
				hasJa = true;
			}
			if (lower === 'jp') {
				hasJp = true;
			}
		}
	}
	return { hasJa, hasJp };
};

/**
 * Ensures the sheet / JSON source includes the Japanese column matching extension settings.
 * Call on the parsed dictionary **before** `normalizeLanguageDictionaryFromSheet`.
 */
export const assertExpectedJapaneseSheetColumnPresent = (
	languageDictionary: LanguageDictionary,
	expectedJapanese: JapaneseSheetLanguageCode
): void => {
	if (Object.keys(languageDictionary).length === 0) {
		return;
	}
	const { hasJa, hasJp } = collectJapaneseKeyPresenceInDictionary(languageDictionary);
	if (!hasJa && !hasJp) {
		return;
	}
	if (expectedJapanese === 'ja' && !hasJa) {
		throw new Error(
			'설정 `languageHelper.japaneseLanguageCode`가 `ja`인데 시트(또는 JSON)에 `ja` 열·필드가 없습니다. 헤더나 키 이름을 `ja`로 맞추거나 설정을 `jp`로 바꾸세요.'
		);
	}
	if (expectedJapanese === 'jp' && !hasJp) {
		throw new Error(
			'설정 `languageHelper.japaneseLanguageCode`가 `jp`인데 시트(또는 JSON)에 `jp` 열·필드가 없습니다. 헤더나 키 이름을 `jp`로 맞추거나 설정을 `ja`로 바꾸세요.'
		);
	}
};
