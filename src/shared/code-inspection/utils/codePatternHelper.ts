import * as vscode from 'vscode';
import { DEFAULT_HOVER_KEY_PATTERNS } from '../constants';
import { createCodePattern } from './codePatternExtractor';
import { parseSheetNames } from '../../sheet-data/utils/sheetNameParser';

export const getCodePattern = (): RegExp => {
	const config = vscode.workspace.getConfiguration('languageHelper');
	const hoverKeyPatternsConfig = config.get<string>('hoverKeyPatterns') || DEFAULT_HOVER_KEY_PATTERNS;
	const keyPatterns = parseSheetNames(hoverKeyPatternsConfig);
	return createCodePattern(keyPatterns);
};
