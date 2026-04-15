import * as vscode from 'vscode';
import { fetchDictionaryData } from '../sheet-api/fetcher';
import { getAccessTokenFromServiceAccountJson } from '../sheet-api/googleAuth';
import { fetchDictionaryFromJsonUrl } from '../sheet-api/jsonFetcher';
import { fetchMultipleSheetsByApi } from '../sheet-api/multiSheetFetcher';
import { fetchAllSheetNames } from '../sheet-api/sheetListFetcher';
import {
	resolveJapaneseLanguageCodeFromSetting,
	type JapaneseSheetLanguageCode
} from '../../shared/language-dictionary/constants/sheetLanguageCodes';
import { DEFAULT_TARGET_SHEET_NAMES } from '../../shared/sheet-data/constants';
import type { LanguageDictionary } from '../../shared/language-dictionary/types';
import type { SheetsCredential } from '../../shared/sheet-data/types';
import { parseCsvToDictionary } from '../../shared/sheet-data/utils/parser';
import { extractSheetIdFromUrl } from '../../shared/sheet-data/utils/sheetIdExtractor';
import { parseSheetNames } from '../../shared/sheet-data/utils/sheetNameParser';

const resolveSheetId = (
	sheetId: string | undefined,
	sheetUrl: string | undefined
): string | undefined => {
	if (!sheetId && !sheetUrl) {
		return undefined;
	}

	if (sheetId) {
		const extractedFromId = extractSheetIdFromUrl(sheetId);
		if (extractedFromId) {
			return extractedFromId;
		}
		return sheetId;
	}

	if (sheetUrl) {
		const extractedId = extractSheetIdFromUrl(sheetUrl);
		return extractedId || undefined;
	}

	return undefined;
};

const fetchCsvDataByApi = async (
	credential: SheetsCredential,
	finalSheetId: string,
	isAllSheetNames: boolean,
	targetSheetNamesConfig: string
): Promise<string> => {
	if (isAllSheetNames) {
		const sheetNames = await fetchAllSheetNames(credential, finalSheetId);

		if (sheetNames.length === 0) {
			throw new Error('가져올 시트가 없습니다.');
		}

		return await fetchMultipleSheetsByApi(credential, finalSheetId, sheetNames);
	}

	const sheetNames = parseSheetNames(targetSheetNamesConfig);

	if (sheetNames.length === 0) {
		throw new Error(
			`targetSheetNames 설정에 시트 이름을 쉼표(,)로 구분하여 입력해주세요. 예: ${DEFAULT_TARGET_SHEET_NAMES}`
		);
	}

	return await fetchMultipleSheetsByApi(credential, finalSheetId, sheetNames);
};

const fetchCsvDataByUrl = async (sheetUrl: string): Promise<string> => {
	if (!sheetUrl) {
		throw new Error('CSV URL을 입력해주세요!');
	}

	return await fetchDictionaryData(sheetUrl);
};

const fetchCsvDataBySheetsApi = async (
	credential: SheetsCredential,
	sheetId: string | undefined,
	sheetUrl: string | undefined,
	isAllSheetNames: boolean,
	targetSheetNamesConfig: string
): Promise<string> => {
	const finalSheetId = resolveSheetId(sheetId, sheetUrl);

	if (!finalSheetId) {
		throw new Error(
			'시트 ID를 입력하거나, 시트 URL에서 자동 추출할 수 있도록 URL을 입력해주세요!'
		);
	}

	return await fetchCsvDataByApi(
		credential,
		finalSheetId,
		isAllSheetNames,
		targetSheetNamesConfig
	);
};

export type SyncLanguageDataOptions = {
	/**
	 * When true: no green “동기화 완료” toast, and no toast for missing remote config / incomplete API setup
	 * (used when Export runs the same fetch pipeline immediately before writing JSON).
	 */
	suppressSuccessToast?: boolean;
	/** When true, rethrow after logging so callers (e.g. Export) can abort instead of writing stale JSON. */
	throwOnFetchFailure?: boolean;
};

const saveDictionaryAndShowMessage = async (
	context: vscode.ExtensionContext,
	csvData: string,
	method: string,
	expectedJapaneseColumn: JapaneseSheetLanguageCode,
	syncOptions?: SyncLanguageDataOptions
): Promise<LanguageDictionary> => {
	const freshDictionary = await parseCsvToDictionary(csvData, {
		expectedJapaneseColumn
	});
	await persistDictionaryAndNotify(context, freshDictionary, method, syncOptions);
	return freshDictionary;
};

const OUTPUT_CHANNEL_NAME = 'Sheet Language Global Helper';

const getOutputChannel = (): vscode.OutputChannel => {
	return vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);
};

const persistDictionaryAndNotify = async (
	context: vscode.ExtensionContext,
	freshDictionary: LanguageDictionary,
	method: string,
	syncOptions?: SyncLanguageDataOptions
): Promise<void> => {
	await context.globalState.update('langData', freshDictionary);
	const entryCount = Object.keys(freshDictionary).length;
	const successMessage = `동기화 완료! (${entryCount}개 데이터, ${method} 사용)`;

	if (!syncOptions?.suppressSuccessToast) {
		vscode.window.showInformationMessage(successMessage);
	}

	const outputChannel = getOutputChannel();
	outputChannel.appendLine(`[${new Date().toISOString()}] ${successMessage}`);
	outputChannel.show();
};

export const syncLanguageData = async (
	context: vscode.ExtensionContext,
	languageDictionary: LanguageDictionary,
	syncOptions?: SyncLanguageDataOptions
): Promise<LanguageDictionary> => {
	const config = vscode.workspace.getConfiguration('languageHelper');
	const sheetServiceAccountJson = config.get<string>('sheetServiceAccountJson');
	const sheetApiKey = config.get<string>('sheetApiKey');
	const sheetId = config.get<string>('sheetId');
	const isAllSheetNames = config.get<boolean>('allSheetNames') ?? true;
	const targetSheetNamesConfig = config.get<string>('targetSheetNames') || DEFAULT_TARGET_SHEET_NAMES;
	const sheetJsonUrl = config.get<string>('sheetJsonUrl');
	const sheetUrl = config.get<string>('sheetUrl');

	const useSheetsApi = (sheetServiceAccountJson?.trim() ?? '') !== '' || (sheetApiKey?.trim() ?? '') !== '';

	if (!useSheetsApi && !sheetJsonUrl && !sheetUrl) {
		if (!syncOptions?.suppressSuccessToast) {
			vscode.window.showErrorMessage(
				'설정창에서 서비스 계정 JSON, 구글 시트 API 키, JSON API URL, 또는 CSV URL 중 하나를 입력해주세요!'
			);
		}
		return languageDictionary;
	}

	const expectedJapaneseColumn = resolveJapaneseLanguageCodeFromSetting(
		config.get<string>('japaneseLanguageCode')
	);

	try {
		if (useSheetsApi) {
			let credential: SheetsCredential;
			if (sheetServiceAccountJson?.trim()) {
				const accessToken = await getAccessTokenFromServiceAccountJson(sheetServiceAccountJson);
				credential = { type: 'oauth', accessToken };
			} else if (sheetApiKey?.trim()) {
				credential = { type: 'apiKey', apiKey: sheetApiKey.trim() };
			} else {
				if (!syncOptions?.suppressSuccessToast) {
					vscode.window.showErrorMessage('서비스 계정 JSON 또는 API 키를 입력해주세요.');
				}
				return languageDictionary;
			}
			const csvData = await fetchCsvDataBySheetsApi(
				credential,
				sheetId,
				sheetUrl,
				isAllSheetNames,
				targetSheetNamesConfig
			);
			const method = credential.type === 'oauth' ? '서비스 계정' : 'API';
			return await saveDictionaryAndShowMessage(
				context,
				csvData,
				method,
				expectedJapaneseColumn,
				syncOptions
			);
		}

		if (sheetJsonUrl?.trim()) {
			const freshDictionary = await fetchDictionaryFromJsonUrl(sheetJsonUrl, {
				expectedJapaneseColumn
			});
			await persistDictionaryAndNotify(context, freshDictionary, 'JSON API', syncOptions);
			return freshDictionary;
		}

		const csvData = await fetchCsvDataByUrl(sheetUrl || '');
		return await saveDictionaryAndShowMessage(
			context,
			csvData,
			'CSV URL',
			expectedJapaneseColumn,
			syncOptions
		);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
		const fullMessage = `데이터를 가져오는데 실패했습니다: ${errorMessage}`;

		vscode.window.showErrorMessage(fullMessage);

		const outputChannel = getOutputChannel();
		outputChannel.appendLine(`[${new Date().toISOString()}] ❌ ${fullMessage}`);
		outputChannel.show();

		if (syncOptions?.throwOnFetchFailure) {
			throw error instanceof Error ? error : new Error(String(error));
		}

		return languageDictionary;
	}
};
