import * as vscode from 'vscode';
import type { LanguageDictionary } from '../../shared/types';

const DEFAULT_EXPORT_FILE_NAME = 'sheet-language-dictionary.json';

const buildExportFileName = (rawFromConfig: string | undefined): string => {
	const trimmed = (rawFromConfig ?? '').trim().replace(/[/\\]/g, '');
	return trimmed.length > 0 ? trimmed : DEFAULT_EXPORT_FILE_NAME;
};

export const exportLanguageDictionaryToWorkspaceJson = async (
	languageDictionary: LanguageDictionary
): Promise<void> => {
	const keyCount = Object.keys(languageDictionary).length;
	if (keyCount === 0) {
		vscode.window.showWarningMessage(
			'내보낼 언어 데이터가 없습니다. 먼저 동기화(Sheet Connect Sync)를 실행하세요.'
		);
		return;
	}

	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders || workspaceFolders.length === 0) {
		vscode.window.showErrorMessage(
			'워크스페이스 폴더가 열려 있지 않습니다. 폴더를 연 뒤 다시 시도하세요.'
		);
		return;
	}

	const config = vscode.workspace.getConfiguration('languageHelper');
	const exportFileName = buildExportFileName(
		config.get<string>('workspaceExportJsonFileName')
	);

	const workspaceRootUri = workspaceFolders[0].uri;
	const targetUri = vscode.Uri.joinPath(workspaceRootUri, exportFileName);
	const jsonText = `${JSON.stringify(languageDictionary, null, 2)}\n`;
	const textEncoder = new TextEncoder();

	await vscode.workspace.fs.writeFile(targetUri, textEncoder.encode(jsonText));

	const successMessage = `언어 데이터를 저장했습니다: ${exportFileName} (${keyCount}개 항목)`;
	vscode.window.showInformationMessage(successMessage);

	const outputChannel = vscode.window.createOutputChannel('Sheet Language Global Helper');
	outputChannel.appendLine(`[${new Date().toISOString()}] ${successMessage}`);
	outputChannel.show();
};
