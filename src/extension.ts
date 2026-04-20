import * as vscode from 'vscode';
import { exportLanguageDictionaryToWorkspaceJson } from './features/export-workspace-json/exportWorkspaceJson';
import { provideHover } from './features/hover/hover';
import { provideInlineHints } from './features/inline-hints/inlineHints';
import { syncLanguageData, type SyncLanguageDataOptions } from './features/sync/sync';
import type { LanguageDictionary } from './shared/language-dictionary/types';

export const activate = (context: vscode.ExtensionContext): void => {
	let languageDictionary: LanguageDictionary = context.globalState.get<LanguageDictionary>('langData', {});
	/** Queues sync runs so a slow/in-flight sync finishes before export reads `globalState`. */
	let syncCompletionChain: Promise<unknown> = Promise.resolve();
	const inlayHintsRefreshEmitter = new vscode.EventEmitter<void>();

	const runQueuedSyncJob = async (
		syncOptions?: SyncLanguageDataOptions
	): Promise<LanguageDictionary> => {
		const updatedDictionary = await syncLanguageData(context, languageDictionary, syncOptions);
		languageDictionary = updatedDictionary;
		inlayHintsRefreshEmitter.fire();
		return updatedDictionary;
	};

	const handleSyncCommand = (): void => {
		syncCompletionChain = syncCompletionChain
			.then(() => runQueuedSyncJob())
			.catch(() => {
				// Errors are already surfaced inside syncLanguageData
			});
	};

	const handleExportWorkspaceJsonCommand = (): void => {
		syncCompletionChain = syncCompletionChain
			.then(async () => {
				try {
					const freshDictionary = await runQueuedSyncJob({
						suppressSuccessToast: true,
						throwOnFetchFailure: true
					});
					const dictionarySnapshotForJsonExport =
						context.globalState.get<LanguageDictionary>('langData', freshDictionary);
					try {
						await exportLanguageDictionaryToWorkspaceJson(dictionarySnapshotForJsonExport);
					} catch (error: unknown) {
						const message = error instanceof Error ? error.message : '알 수 없는 오류';
						vscode.window.showErrorMessage(`JSON 저장 실패: ${message}`);
					}
				} catch {
					languageDictionary = {};
					vscode.window.showWarningMessage(
						'시트에서 데이터를 가져오지 못해 JSON 보내기를 취소했습니다. (오류는 동기화 메시지를 참고하세요)'
					);
				}
			})
			.catch(() => {
				// Unhandled rejections in the export job (should be rare)
			});
	};

	const handleProvideHover = (
		document: vscode.TextDocument,
		position: vscode.Position
	): vscode.Hover | null => {
		return provideHover(document, position, languageDictionary);
	};

	const handleProvideInlayHints = (
		document: vscode.TextDocument,
		range: vscode.Range,
		token: vscode.CancellationToken
	): vscode.InlayHint[] => {
		return provideInlineHints(document, range, languageDictionary, token);
	};

	const disposableSyncCommand = vscode.commands.registerCommand(
		'languageHelper.sync',
		handleSyncCommand
	);

	const disposableExportJsonCommand = vscode.commands.registerCommand(
		'languageHelper.exportWorkspaceJson',
		handleExportWorkspaceJsonCommand
	);

	const hoverProvider = vscode.languages.registerHoverProvider(
		['typescript', 'javascript', 'typescriptreact', 'javascriptreact'],
		{ provideHover: handleProvideHover }
	);

	const inlayHintsProvider = vscode.languages.registerInlayHintsProvider(
		['typescript', 'javascript', 'typescriptreact', 'javascriptreact'],
		{
			onDidChangeInlayHints: inlayHintsRefreshEmitter.event,
			provideInlayHints: handleProvideInlayHints
		}
	);

	const handleConfigurationChange = (event: vscode.ConfigurationChangeEvent): void => {
		const isLanguageHelperChange = event.affectsConfiguration('languageHelper');
		if (!isLanguageHelperChange) {
			return;
		}
		inlayHintsRefreshEmitter.fire();
	};

	const disposableConfigurationChange = vscode.workspace.onDidChangeConfiguration(
		handleConfigurationChange
	);

	context.subscriptions.push(
		disposableSyncCommand,
		disposableExportJsonCommand,
		hoverProvider,
		inlayHintsProvider,
		disposableConfigurationChange,
		inlayHintsRefreshEmitter
	);
};

export const deactivate = (): void => {};
