import * as vscode from 'vscode';
import type { LanguageEntry } from '../../language-dictionary/types';

const getLanguageFlag = (langCode: string): string => {
	const flags: Record<string, string> = {
		ko: '🇰🇷',
		en: '🇺🇸',
		jp: '🇯🇵',
		ja: '🇯🇵',
		es: '🇪🇸',
		zh: '🇨🇳',
		fr: '🇫🇷',
		de: '🇩🇪',
		pt: '🇵🇹',
		ru: '🇷🇺',
		it: '🇮🇹'
	};
	return flags[langCode.toLowerCase()] || '🌐';
};

const formatLanguageName = (langCode: string): string => {
	const names: Record<string, string> = {
		ko: 'KO',
		en: 'EN',
		jp: 'JP',
		ja: 'JP',
		es: 'ES',
		zh: 'ZH',
		fr: 'FR',
		de: 'DE',
		pt: 'PT',
		ru: 'RU',
		it: 'IT'
	};
	return names[langCode.toUpperCase()] || langCode.toUpperCase();
};

export const createHoverContent = (code: string, entry: LanguageEntry): vscode.MarkdownString => {
	const markdownContent = new vscode.MarkdownString();
	markdownContent.isTrusted = true;

	const languages = Object.keys(entry)
		.filter((langCode) => {
			const value = entry[langCode];
			return value && value.trim().length > 0;
		})
		.sort();

	if (languages.length === 0) {
		return markdownContent;
	}

	markdownContent.appendMarkdown(`#### 🌐 **${code}**\n\n`);

	languages.forEach((langCode) => {
		const flag = getLanguageFlag(langCode);
		const langName = formatLanguageName(langCode);
		const value = entry[langCode];
		markdownContent.appendMarkdown(`- ${flag} **${langName}**: ${value}\n`);
	});

	return markdownContent;
};
