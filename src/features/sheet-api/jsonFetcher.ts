import axios from 'axios';
import type { LanguageDictionary, LanguageEntry } from '../../shared/language-dictionary/types';
import { normalizeLanguageDictionaryFromSheet } from '../../shared/language-dictionary/utils/normalizeLanguageDictionaryFromSheet';
import { normalizeAndValidateUrl } from '../../shared/http-url/utils/urlHelper';
import { handleApiError } from './errorHandler';

const KEY_FIELD_LOWER = 'key';

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const toStringEntry = (raw: Record<string, unknown>): LanguageEntry => {
	const entry: LanguageEntry = {};
	Object.keys(raw).forEach((langKey) => {
		if (langKey.toLowerCase() === KEY_FIELD_LOWER) {
			return;
		}
		const rawValue = raw[langKey];
		entry[langKey] = rawValue !== undefined && rawValue !== null ? String(rawValue).trim() : '';
	});
	return entry;
};

const parseArrayFormat = (rows: unknown[]): LanguageDictionary => {
	const dictionary: LanguageDictionary = {};
	for (const row of rows) {
		if (!isRecord(row)) {
			continue;
		}
		const key = row[KEY_FIELD_LOWER];
		if (key === undefined || key === null || String(key).trim() === '') {
			continue;
		}
		const keyStr = String(key).trim();
		dictionary[keyStr] = toStringEntry(row as Record<string, unknown>);
	}
	return dictionary;
};

const parseObjectFormat = (data: Record<string, unknown>): LanguageDictionary => {
	const dictionary: LanguageDictionary = {};
	for (const key of Object.keys(data)) {
		const value = data[key];
		if (!isRecord(value)) {
			continue;
		}
		dictionary[key] = toStringEntry(value);
	}
	return dictionary;
};

export const parseJsonToDictionary = (data: unknown): LanguageDictionary => {
	let parsed: LanguageDictionary;
	if (Array.isArray(data)) {
		parsed = parseArrayFormat(data);
	} else if (isRecord(data)) {
		parsed = parseObjectFormat(data);
	} else {
		throw new Error('JSON 응답은 배열 또는 객체 형태여야 합니다.');
	}
	return normalizeLanguageDictionaryFromSheet(parsed);
};

export const fetchDictionaryFromJsonUrl = async (
	url: string
): Promise<LanguageDictionary> => {
	if (!url || url.trim() === '') {
		throw new Error('JSON API URL을 입력해주세요.');
	}

	const validUrl = normalizeAndValidateUrl(url);

	try {
		const response = await axios.get<unknown>(validUrl);
		return parseJsonToDictionary(response.data);
	} catch (error) {
		throw handleApiError(error);
	}
};
