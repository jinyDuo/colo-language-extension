import * as vscode from 'vscode';
import { DEFAULT_INLINE_TRANSLATION_LANGUAGE, KOREAN_CHARACTER_PATTERN, STRING_LITERAL_PATTERN, TRANSLATION_FUNCTION_PATTERN } from '../../shared/code-inspection/constants';
import type { LanguageDictionary, LanguageEntry } from '../../shared/language-dictionary/types';
import { getCodePattern } from '../../shared/code-inspection/utils/codePatternHelper';

type CodeMatchItem = {
	code: string;
	endCharacter: number;
};

const createGlobalPattern = (pattern: RegExp): RegExp => {
	const hasGlobalFlag = pattern.flags.includes('g');
	return new RegExp(pattern.source, hasGlobalFlag ? pattern.flags : `${pattern.flags}g`);
};

const createCodeMatchItems = (lineText: string, pattern: RegExp): CodeMatchItem[] => {
	const results: CodeMatchItem[] = [];
	const codePattern = createGlobalPattern(pattern);

	for (const match of lineText.matchAll(codePattern)) {
		if (match.index === undefined) {
			continue;
		}
		results.push({
			code: match[0],
			endCharacter: match.index + match[0].length
		});
	}

	const translationFunctionPattern = new RegExp(TRANSLATION_FUNCTION_PATTERN.source, 'g');
	const stringLiteralPattern = new RegExp(STRING_LITERAL_PATTERN.source, 'g');
	const stringPatterns = [translationFunctionPattern, stringLiteralPattern];

	for (const stringPattern of stringPatterns) {
		for (const match of lineText.matchAll(stringPattern)) {
			if (match.index === undefined) {
				continue;
			}
			const stringValue = match[1];
			const codeMatch = stringValue.match(pattern);
			if (!codeMatch) {
				continue;
			}

			const matchStart = match.index + match[0].indexOf(stringValue);
			results.push({
				code: codeMatch[0],
				endCharacter: matchStart + codeMatch[0].length
			});
		}
	}

	const translationFunctionPatternForKorean = new RegExp(TRANSLATION_FUNCTION_PATTERN.source, 'g');
	for (const match of lineText.matchAll(translationFunctionPatternForKorean)) {
		if (match.index === undefined) {
			continue;
		}
		const stringValue = match[1];
		if (!KOREAN_CHARACTER_PATTERN.test(stringValue)) {
			continue;
		}

		const matchStart = match.index + match[0].indexOf(stringValue);
		results.push({
			code: stringValue.trim(),
			endCharacter: matchStart + stringValue.trim().length
		});
	}

	const uniqueMatchKeyItems = new Map<string, CodeMatchItem>();
	for (const matchItem of results) {
		const uniqueKey = `${matchItem.endCharacter}:${matchItem.code}`;
		uniqueMatchKeyItems.set(uniqueKey, matchItem);
	}

	return Array.from(uniqueMatchKeyItems.values());
};

const getTranslationText = (
	entry: LanguageEntry,
	preferredLanguage: string = DEFAULT_INLINE_TRANSLATION_LANGUAGE
): string | null => {
	if (!entry) {
		return null;
	}

	const languages = Object.keys(entry).filter(
		(langCode) => entry[langCode] && entry[langCode].trim().length > 0
	);

	if (languages.length === 0) {
		return null;
	}

	if (preferredLanguage && entry[preferredLanguage]?.trim()) {
		return entry[preferredLanguage];
	}

	if (entry.en?.trim()) {
		return entry.en;
	}

	if (entry.ko?.trim()) {
		return entry.ko;
	}

	return entry[languages[0]];
};

export const provideInlineHints = (
	document: vscode.TextDocument,
	range: vscode.Range,
	languageDictionary: LanguageDictionary,
	_token?: vscode.CancellationToken
): vscode.InlayHint[] => {
	const pattern = getCodePattern();
	const hints: vscode.InlayHint[] = [];
	const config = vscode.workspace.getConfiguration('languageHelper');
	const showInlineTranslation = config.get<boolean>('showInlineTranslation', true);
	const inlineTranslationLanguage = config.get<string>('inlineTranslationLanguage', DEFAULT_INLINE_TRANSLATION_LANGUAGE);

	if (!showInlineTranslation) {
		return hints;
	}

	for (let lineNumber = range.start.line; lineNumber <= range.end.line; lineNumber += 1) {
		const lineText = document.lineAt(lineNumber).text;
		const codeMatchItems = createCodeMatchItems(lineText, pattern);

		for (const matchItem of codeMatchItems) {
			const entry = languageDictionary[matchItem.code];
			if (!entry) {
				continue;
			}

			const translationText = getTranslationText(entry, inlineTranslationLanguage);
			if (!translationText) {
				continue;
			}

			const position = new vscode.Position(lineNumber, matchItem.endCharacter);

			const hint = new vscode.InlayHint(
				position,
				` → ${translationText}`,
				vscode.InlayHintKind.Type
			);

			hint.paddingLeft = true;
			hint.paddingRight = false;

			hints.push(hint);
		}
	}

	return hints;
};
