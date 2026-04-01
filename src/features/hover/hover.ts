import * as vscode from 'vscode';
import { KOREAN_CHARACTER_PATTERN, STRING_LITERAL_PATTERN, TRANSLATION_FUNCTION_PATTERN } from '../../shared/code-inspection/constants';
import type { LanguageDictionary } from '../../shared/language-dictionary/types';
import { getCodePattern } from '../../shared/code-inspection/utils/codePatternHelper';
import { createHoverContent } from '../../shared/code-inspection/utils/markdown';

const extractCodeFromPosition = (
	document: vscode.TextDocument,
	position: vscode.Position,
	pattern: RegExp
): string | null => {
	const line = document.lineAt(position.line);
	const lineText = line.text;

	const wordRange = document.getWordRangeAtPosition(position, pattern);
	if (!wordRange) {
		return null;
	}

	const code = document.getText(wordRange);
	return code;
};

const extractCodeFromStringLiteral = (
	document: vscode.TextDocument,
	position: vscode.Position,
	pattern: RegExp
): string | null => {
	const line = document.lineAt(position.line);
	const lineText = line.text;

	const stringPatterns = [
		TRANSLATION_FUNCTION_PATTERN,
		STRING_LITERAL_PATTERN
	];

	for (const stringPattern of stringPatterns) {
		let match;
		while ((match = stringPattern.exec(lineText)) !== null) {
			const stringValue = match[1];
			const codeMatch = stringValue.match(pattern);

			if (codeMatch) {
				const matchStart = match.index + match[0].indexOf(stringValue);
				const matchEnd = matchStart + stringValue.length;

				if (position.character >= matchStart && position.character <= matchEnd) {
					return codeMatch[0];
				}
			}
		}
	}

	return null;
};

const extractKoreanStringFromPosition = (
	document: vscode.TextDocument,
	position: vscode.Position
): string | null => {
	const line = document.lineAt(position.line);
	const lineText = line.text;

	let match;
	while ((match = TRANSLATION_FUNCTION_PATTERN.exec(lineText)) !== null) {
		const stringValue = match[1];

		if (KOREAN_CHARACTER_PATTERN.test(stringValue)) {
			const matchStart = match.index + match[0].indexOf(stringValue);
			const matchEnd = matchStart + stringValue.length;

			if (position.character >= matchStart && position.character <= matchEnd) {
				return stringValue.trim();
			}
		}
	}

	return null;
};

export const provideHover = (
	document: vscode.TextDocument,
	position: vscode.Position,
	languageDictionary: LanguageDictionary
): vscode.Hover | null => {
	const pattern = getCodePattern();

	let code: string | null = null;

	code = extractCodeFromPosition(document, position, pattern);

	if (!code) {
		code = extractCodeFromStringLiteral(document, position, pattern);
	}

	if (!code) {
		code = extractKoreanStringFromPosition(document, position);
	}

	if (!code) {
		return null;
	}

	const entry = languageDictionary[code];
	if (!entry) {
		return null;
	}

	const languagesWithData = Object.keys(entry).filter(
		(langCode) => entry[langCode] && entry[langCode].trim().length > 0
	);

	if (languagesWithData.length === 0) {
		return null;
	}

	const hoverContent = createHoverContent(code, entry);
	return new vscode.Hover(hoverContent);
};
