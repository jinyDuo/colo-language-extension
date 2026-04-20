import type { ParseConfig, ParseResult } from 'papaparse';
import { parse } from 'papaparse';
import type { JapaneseSheetLanguageCode } from '../../language-dictionary/constants/sheetLanguageCodes';
import type { LanguageDictionary } from '../../language-dictionary/types';
import { assertExpectedJapaneseSheetColumnPresent } from '../../language-dictionary/utils/assertExpectedJapaneseSheetColumn';
import { normalizeLanguageDictionaryFromSheet } from '../../language-dictionary/utils/normalizeLanguageDictionaryFromSheet';

export type ParseCsvToDictionaryOptions = {
	expectedJapaneseColumn: JapaneseSheetLanguageCode;
};

const hasCriticalErrors = (errors: ParseResult<any>['errors']): boolean => {
	return errors.some(
		(error) => error.type === 'Quotes' || error.type === 'Delimiter'
	);
};

const createLanguageEntry = (row: any): Record<string, string> => {
	const entry: Record<string, string> = {};

	Object.keys(row).forEach((key) => {
		if (key.toLowerCase() !== 'key') {
			entry[key] = row[key] || '';
		}
	});

	return entry;
};

const processRowToDictionary = (
	dictionary: LanguageDictionary,
	row: any
): void => {
	if (row.key) {
		dictionary[row.key] = createLanguageEntry(row);
	}
};

const buildDictionaryFromRows = (rows: any[]): LanguageDictionary => {
	const dictionary: LanguageDictionary = {};

	rows.forEach((row) => {
		processRowToDictionary(dictionary, row);
	});

	return dictionary;
};

const transformHeaderValue = (header: string): string => {
	return header.trim();
};

const transformCellValue = (value: string): string => {
	return value.trim();
};

const createParseCompleteHandler = (
	resolve: (value: LanguageDictionary) => void,
	reject: (reason?: any) => void,
	options: ParseCsvToDictionaryOptions
) => {
	return (parseResults: ParseResult<any>): void => {
		if (hasCriticalErrors(parseResults.errors)) {
			reject(new Error(parseResults.errors[0].message));
			return;
		}

		const rawDictionary = buildDictionaryFromRows(parseResults.data);
		try {
			assertExpectedJapaneseSheetColumnPresent(rawDictionary, options.expectedJapaneseColumn);
		} catch (error) {
			reject(error);
			return;
		}
		const dictionary = normalizeLanguageDictionaryFromSheet(
			rawDictionary,
			options.expectedJapaneseColumn
		);
		resolve(dictionary);
	};
};

export const parseCsvToDictionary = (
	csvData: string,
	options: ParseCsvToDictionaryOptions
): Promise<LanguageDictionary> => {
	return new Promise((resolve, reject) => {
		const config: ParseConfig<any> = {
			header: true,
			skipEmptyLines: 'greedy',
			transformHeader: transformHeaderValue,
			transform: transformCellValue,
			complete: createParseCompleteHandler(resolve, reject, options)
		};

		parse(csvData, config);
	});
};
