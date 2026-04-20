import axios from 'axios';
import type {
	GoogleSheetsApiResponse,
	SheetTabFetchSummary,
	SheetsCredential
} from '../../shared/sheet-data/types';
import { padRowToMatchHeader, rowToCsvLine } from '../../shared/sheet-data/utils/csvHelper';
import { createSheetError } from './errorHandler';

const buildSheetsRequestConfig = (credential: SheetsCredential) => {
	if (credential.type === 'oauth') {
		return { urlSuffix: '', headers: { Authorization: `Bearer ${credential.accessToken}` } };
	}
	return { urlSuffix: `?key=${credential.apiKey}`, headers: {} };
};

const fetchSingleSheet = async (
	credential: SheetsCredential,
	sheetId: string,
	sheetName: string
): Promise<string[][]> => {
	const range = `${sheetName}!A:Z`;
	const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;
	const { urlSuffix, headers } = buildSheetsRequestConfig(credential);
	const url = `${baseUrl}${urlSuffix}`;

	try {
		const response = await axios.get<GoogleSheetsApiResponse>(url, { headers });

		if (response.data.error) {
			throw new Error(
				`시트 "${sheetName}" 오류: ${response.data.error.message}`
			);
		}

		if (!response.data.values || response.data.values.length === 0) {
			return [];
		}

		return response.data.values;
	} catch (error) {
		throw createSheetError(sheetName, error);
	}
};

const countDataRowsWithNonEmptyFirstCell = (rows: string[][]): number => {
	if (rows.length <= 1) {
		return 0;
	}
	const dataRows = rows.slice(1);
	return dataRows.filter((row) => (row[0] ?? '').trim() !== '').length;
};

const processSheetRows = (
	rows: string[][],
	headerRow: string[] | null,
	allRows: string[][]
): string[] => {
	if (rows.length === 0) {
		return headerRow || [];
	}

	const newHeaderRow = headerRow || rows[0];
	if (!headerRow) {
		allRows.push(newHeaderRow);
	}

	const dataRows = rows.slice(1);

	const processDataRow = (row: string[]): void => {
		const paddedRow = padRowToMatchHeader(row, newHeaderRow.length);
		allRows.push(paddedRow);
	};

	dataRows.forEach(processDataRow);

	return newHeaderRow;
};

export type FetchMultipleSheetsResult = {
	mergedCsv: string;
	sheetTabFetchSummaries: SheetTabFetchSummary[];
};

export const fetchMultipleSheetsByApi = async (
	credential: SheetsCredential,
	sheetId: string,
	sheetNames: string[]
): Promise<FetchMultipleSheetsResult> => {
	if (sheetNames.length === 0) {
		throw new Error('시트 이름 목록이 비어있습니다.');
	}

	const allRows: string[][] = [];
	let headerRow: string[] | null = null;
	const sheetTabFetchSummaries: SheetTabFetchSummary[] = [];

	for (const sheetName of sheetNames) {
		try {
			const rows = await fetchSingleSheet(credential, sheetId, sheetName);
			const dataRowCount = Math.max(0, rows.length - 1);
			const nonEmptyKeyRowCount = countDataRowsWithNonEmptyFirstCell(rows);
			sheetTabFetchSummaries.push({
				sheetTitle: sheetName,
				dataRowCount,
				nonEmptyKeyRowCount
			});
			headerRow = processSheetRows(rows, headerRow, allRows);
		} catch (error) {
			throw createSheetError(sheetName, error);
		}
	}

	if (allRows.length === 0) {
		throw new Error('가져온 시트 데이터가 비어있습니다.');
	}

	const csvLines: string[] = allRows.map(rowToCsvLine);
	return {
		mergedCsv: csvLines.join('\n'),
		sheetTabFetchSummaries
	};
};
