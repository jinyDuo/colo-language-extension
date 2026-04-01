import axios from 'axios';
import type { GoogleSheetsApiResponse, SheetsCredential } from '../../shared/sheet-data/types';
import { padRowToMatchHeader, rowToCsvLine } from '../../shared/sheet-data/utils/csvHelper';
import { handleApiError } from './errorHandler';

const buildSheetsRequestConfig = (credential: SheetsCredential) => {
	if (credential.type === 'oauth') {
		return {
			urlSuffix: '',
			headers: { Authorization: `Bearer ${credential.accessToken}` }
		};
	}
	return {
		urlSuffix: `?key=${credential.apiKey}`,
		headers: {}
	};
};

const convertRowsToCsv = (rows: string[][]): string => {
	if (rows.length === 0) {
		throw new Error('시트 데이터가 비어있습니다.');
	}

	const headerRow = rows[0];
	const dataRows = rows.slice(1);

	const csvLines: string[] = [rowToCsvLine(headerRow)];

	const processDataRowToCsv = (row: string[]): void => {
		const paddedRow = padRowToMatchHeader(row, headerRow.length);
		csvLines.push(rowToCsvLine(paddedRow));
	};

	dataRows.forEach(processDataRowToCsv);

	return csvLines.join('\n');
};

export const fetchDictionaryDataByApi = async (
	credential: SheetsCredential,
	sheetId: string,
	sheetName: string = ''
): Promise<string> => {
	const range = sheetName ? `${sheetName}!A:Z` : 'A:Z';
	const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;
	const { urlSuffix, headers } = buildSheetsRequestConfig(credential);
	const url = `${baseUrl}${urlSuffix}`;

	try {
		const response = await axios.get<GoogleSheetsApiResponse>(url, { headers });

		if (response.data.error) {
			throw new Error(
				`구글 시트 API 오류: ${response.data.error.message} (${response.data.error.status})`
			);
		}

		if (!response.data.values || response.data.values.length === 0) {
			throw new Error('시트 데이터가 비어있습니다.');
		}

		return convertRowsToCsv(response.data.values);
	} catch (error) {
		throw handleApiError(error);
	}
};
