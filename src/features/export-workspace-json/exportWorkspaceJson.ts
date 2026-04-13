import * as vscode from 'vscode';
import type { LanguageDictionary } from '../../shared/language-dictionary/types';
import {
	buildExportFileNameFromSheetPrefix,
	mergeDictionaryFromPrefixBuckets,
	splitDictionaryByConfiguredSheetPrefixes
} from '../../shared/language-dictionary/utils/languageDictionaryExportBuckets';
import { filterLanguageDictionaryToDeclaredSheetLanguages } from '../../shared/language-dictionary/utils/filterLanguageDictionaryToDeclaredSheetLanguages';
import { normalizeLanguageDictionaryFromSheet } from '../../shared/language-dictionary/utils/normalizeLanguageDictionaryFromSheet';
import { parseWorkspaceExportPathSegments } from '../../shared/workspace-export/utils/workspaceExportPath';

const ALL_LANGUAGE_FILE_NAME = 'all_language.json';

const CONFIG_EXPORT_PATH_KEY = 'workspaceExportJsonPath';

const resolveExportDirectoryUri = async (
	workspaceRootUri: vscode.Uri,
	pathSegmentItems: string[]
): Promise<vscode.Uri> => {
	let currentUri = workspaceRootUri;
	for (const segment of pathSegmentItems) {
		currentUri = vscode.Uri.joinPath(currentUri, segment);
		try {
			await vscode.workspace.fs.stat(currentUri);
		} catch {
			await vscode.workspace.fs.createDirectory(currentUri);
		}
	}
	return currentUri;
};

const writeJsonFile = async (
	exportDirectoryUri: vscode.Uri,
	fileName: string,
	payload: LanguageDictionary,
	textEncoder: TextEncoder
): Promise<void> => {
	const targetUri = vscode.Uri.joinPath(exportDirectoryUri, fileName);
	const jsonText = `${JSON.stringify(payload, null, 2)}\n`;
	await vscode.workspace.fs.writeFile(targetUri, textEncoder.encode(jsonText));
};

export const exportLanguageDictionaryToWorkspaceJson = async (
	languageDictionary: LanguageDictionary
): Promise<void> => {
	const keyCount = Object.keys(languageDictionary).length;
	if (keyCount === 0) {
		vscode.window.showWarningMessage(
			'보낼 언어 데이터가 없습니다. 먼저 동기화(Sheet Connect Sync)를 실행하세요.'
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
	const rawExportPath = config.get<string>(CONFIG_EXPORT_PATH_KEY, '').trim();

	if (rawExportPath.length === 0) {
		vscode.window.showErrorMessage(
			'설정에 JSON보내기 폴더 경로를 입력하세요. (설정: Sheet Language Global Helper → Workspace Export Json Path / languageHelper.workspaceExportJsonPath, 예: language)'
		);
		return;
	}

	let pathSegmentItems: string[];
	try {
		pathSegmentItems = parseWorkspaceExportPathSegments(rawExportPath);
	} catch (error) {
		const code = error instanceof Error ? error.message : '';
		if (code === 'INVALID_SEGMENT') {
			vscode.window.showErrorMessage(
				'JSON보내기 경로에 `.` 또는 `..` 를 사용할 수 없습니다. 워크스페이스 루트 기준 상대 경로만 입력하세요.'
			);
		} else {
			vscode.window.showErrorMessage('JSON보내기 경로가 비어 있거나 올바르지 않습니다.');
		}
		return;
	}

	const targetSheetNamesConfig = config.get<string>('targetSheetNames', '');
	const { prefixBucketItems } = splitDictionaryByConfiguredSheetPrefixes(
		languageDictionary,
		targetSheetNamesConfig
	);
	const allLanguageDictionary = filterLanguageDictionaryToDeclaredSheetLanguages(
		normalizeLanguageDictionaryFromSheet(mergeDictionaryFromPrefixBuckets(prefixBucketItems))
	);
	const matchedKeyCount = Object.keys(allLanguageDictionary).length;

	if (matchedKeyCount === 0) {
		vscode.window.showWarningMessage(
			'설정한 targetSheetNames 접두와 일치하는 키가 없습니다. 접두를 확인한 뒤 다시 시도하세요.'
		);
		return;
	}

	const workspaceRootUri = workspaceFolders[0].uri;

	let exportDirectoryUri: vscode.Uri;
	try {
		exportDirectoryUri = await resolveExportDirectoryUri(workspaceRootUri, pathSegmentItems);
	} catch {
		vscode.window.showErrorMessage(
			`JSON보내기 폴더를 만들 수 없습니다: ${pathSegmentItems.join('/')}`
		);
		return;
	}

	const exportPathDisplay = pathSegmentItems.join('/');
	const textEncoder = new TextEncoder();
	const writtenSummaryItems: string[] = [];

	await writeJsonFile(exportDirectoryUri, ALL_LANGUAGE_FILE_NAME, allLanguageDictionary, textEncoder);
	writtenSummaryItems.push(`${exportPathDisplay}/${ALL_LANGUAGE_FILE_NAME} (${matchedKeyCount}개)`);

	for (const { sheetPrefix, dictionary } of prefixBucketItems) {
		const partialKeyCount = Object.keys(dictionary).length;
		if (partialKeyCount === 0) {
			continue;
		}
		const fileName = buildExportFileNameFromSheetPrefix(sheetPrefix);
		const exportDictionary = filterLanguageDictionaryToDeclaredSheetLanguages(
			normalizeLanguageDictionaryFromSheet(dictionary)
		);
		await writeJsonFile(exportDirectoryUri, fileName, exportDictionary, textEncoder);
		writtenSummaryItems.push(`${exportPathDisplay}/${fileName} (${partialKeyCount}개)`);
	}

	const successMessage = `언어 데이터를 저장했습니다: ${writtenSummaryItems.join(', ')}`;
	vscode.window.showInformationMessage(successMessage);

	const outputChannel = vscode.window.createOutputChannel('Sheet Language Global Helper');
	outputChannel.appendLine(`[${new Date().toISOString()}] ${successMessage}`);
	outputChannel.show();
};
