import * as assert from 'assert';
import axios from 'axios';
import * as vscode from 'vscode';
import { syncLanguageData } from '../features/sync/sync';
import type { LanguageDictionary } from '../shared/language-dictionary/types';

const CONFIG_SECTION = 'languageHelper';

const CONFIG_KEYS_FOR_SYNC_JSON_URL = [
	'sheetServiceAccountJson',
	'sheetApiKey',
	'sheetId',
	'sheetJsonUrl',
	'sheetUrl',
	'japaneseLanguageCode'
] as const;

const readLanguageHelperSnapshot = (): Map<string, unknown> => {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
	const snapshot = new Map<string, unknown>();
	for (const key of CONFIG_KEYS_FOR_SYNC_JSON_URL) {
		snapshot.set(key, config.get(key));
	}
	return snapshot;
};

const restoreLanguageHelperSnapshot = async (snapshot: Map<string, unknown>): Promise<void> => {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
	for (const [key, value] of snapshot) {
		await config.update(key, value, vscode.ConfigurationTarget.Global);
	}
};

const createInMemoryExtensionContext = (): vscode.ExtensionContext => {
	const backing = new Map<string, unknown>();
	const globalState = {
		keys: () => [...backing.keys()],
		get: <T>(key: string, defaultValue?: T): T => {
			if (backing.has(key)) {
				return backing.get(key) as T;
			}
			return defaultValue as T;
		},
		update: async (key: string, value: unknown): Promise<void> => {
			backing.set(key, value);
		}
	} as vscode.Memento;
	return { globalState } as vscode.ExtensionContext;
};

suite('syncLanguageData — Export와 동일한 시트 반영 파이프라인', () => {
	test('JSON URL 응답이면 메모리에 있던 옛 사전을 덮어쓴 값을 반환하고 globalState에 동일하게 저장한다', async () => {
		const snapshot = readLanguageHelperSnapshot();
		const originalGet = axios.get;
		try {
			const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
			await config.update('sheetServiceAccountJson', '', vscode.ConfigurationTarget.Global);
			await config.update('sheetApiKey', '', vscode.ConfigurationTarget.Global);
			await config.update(
				'sheetJsonUrl',
				'https://example.com/sync-export-pipeline.json',
				vscode.ConfigurationTarget.Global
			);
			await config.update('sheetUrl', '', vscode.ConfigurationTarget.Global);
			await config.update('japaneseLanguageCode', 'ja', vscode.ConfigurationTarget.Global);

			const expectedFromRemote: LanguageDictionary = {
				WD_EXPORT_TEST: { ko: '시트반영', en: 'FromSheet', ja: 'シート' }
			};

			(axios as { get: (url: string) => Promise<{ data: unknown }> }).get = async () => ({
				data: [
					{
						key: 'WD_EXPORT_TEST',
						ko: '시트반영',
						en: 'FromSheet',
						ja: 'シート'
					}
				]
			});

			const staleDictionary: LanguageDictionary = {
				WD_STALE: { ko: '옛날', en: 'Stale', ja: '古い' }
			};
			const context = createInMemoryExtensionContext();

			const result = await syncLanguageData(context, staleDictionary, {
				suppressSuccessToast: true,
				throwOnFetchFailure: true
			});

			assert.deepStrictEqual(result, expectedFromRemote);
			const persistedDictionary = context.globalState.get<LanguageDictionary>('langData', {});
			assert.deepStrictEqual(persistedDictionary, expectedFromRemote);
			assert.strictEqual('WD_STALE' in result, false);
		} finally {
			axios.get = originalGet;
			await restoreLanguageHelperSnapshot(snapshot);
		}
	});

	test('throwOnFetchFailure가 없을 때 JSON 요청이 실패하면 빈 사전을 반환하고 globalState도 비운다', async () => {
		const snapshot = readLanguageHelperSnapshot();
		const originalGet = axios.get;
		try {
			const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
			await config.update('sheetServiceAccountJson', '', vscode.ConfigurationTarget.Global);
			await config.update('sheetApiKey', '', vscode.ConfigurationTarget.Global);
			await config.update(
				'sheetJsonUrl',
				'https://example.com/sync-will-fail-soft.json',
				vscode.ConfigurationTarget.Global
			);
			await config.update('sheetUrl', '', vscode.ConfigurationTarget.Global);

			(axios as { get: (url: string) => Promise<{ data: unknown }> }).get = async () => {
				throw new Error('network down');
			};

			const context = createInMemoryExtensionContext();
			await context.globalState.update('langData', {
				WD_KEEP: { ko: '이전', en: 'prev', ja: '前' }
			});
			const staleDictionary: LanguageDictionary = {
				WD_STALE: { ko: '옛', en: 'old', ja: '古' }
			};

			const result = await syncLanguageData(context, staleDictionary, {
				suppressSuccessToast: true
			});

			assert.deepStrictEqual(result, {});
			const persistedDictionary = context.globalState.get<LanguageDictionary>('langData', {});
			assert.deepStrictEqual(persistedDictionary, {});
		} finally {
			axios.get = originalGet;
			await restoreLanguageHelperSnapshot(snapshot);
		}
	});

	test('throwOnFetchFailure일 때 JSON 요청이 실패하면 예외를 던져 Export가 JSON 쓰기를 막을 수 있다', async () => {
		const snapshot = readLanguageHelperSnapshot();
		const originalGet = axios.get;
		try {
			const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
			await config.update('sheetServiceAccountJson', '', vscode.ConfigurationTarget.Global);
			await config.update('sheetApiKey', '', vscode.ConfigurationTarget.Global);
			await config.update(
				'sheetJsonUrl',
				'https://example.com/sync-will-fail.json',
				vscode.ConfigurationTarget.Global
			);
			await config.update('sheetUrl', '', vscode.ConfigurationTarget.Global);

			(axios as { get: (url: string) => Promise<{ data: unknown }> }).get = async () => {
				throw new Error('network down');
			};

			const context = createInMemoryExtensionContext();
			await assert.rejects(
				async () =>
					syncLanguageData(
						context,
						{ WD001: { ko: 'k', en: 'e', ja: 'j' } },
						{ throwOnFetchFailure: true }
					),
				/network down/
			);
		} finally {
			axios.get = originalGet;
			await restoreLanguageHelperSnapshot(snapshot);
		}
	});
});
