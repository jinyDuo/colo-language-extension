import * as vscode from 'vscode';
import { exportLanguageDictionaryToWorkspaceJson } from './features/export-workspace-json/exportWorkspaceJson';
import { provideHover } from './features/hover/hover';
import { provideInlineHints } from './features/inline-hints/inlineHints';
import { syncLanguageData } from './features/sync/sync';
import type { LanguageDictionary } from './shared/types';

export const activate = (context: vscode.ExtensionContext): void => {
	let languageDictionary: LanguageDictionary = context.globalState.get<LanguageDictionary>('langData', {});
	const inlayHintsRefreshEmitter = new vscode.EventEmitter<void>();

	const handleSyncCommand = (): void => {
		syncLanguageData(context, languageDictionary).then((updatedDictionary) => {
			languageDictionary = updatedDictionary;
			inlayHintsRefreshEmitter.fire();
		});
	};

	const handleExportWorkspaceJsonCommand = (): void => {
		languageDictionary = context.globalState.get<LanguageDictionary>('langData', languageDictionary);
		exportLanguageDictionaryToWorkspaceJson(languageDictionary).catch((error: unknown) => {
			const message = error instanceof Error ? error.message : '알 수 없는 오류';
			vscode.window.showErrorMessage(`JSON 저장 실패: ${message}`);
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
