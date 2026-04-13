import * as assert from 'assert';
import * as vscode from 'vscode';
import { provideInlineHints } from '../features/inline-hints/inlineHints';
import type { LanguageDictionary } from '../shared/language-dictionary/types';

suite('Inlay Hints Provider Test Suite', () => {
	const createTestDocument = async (
		content: string,
		language: string = 'typescript'
	): Promise<vscode.TextDocument> => {
		return await vscode.workspace.openTextDocument({
			language,
			content
		});
	};

	const createTestLanguageDictionary = (): LanguageDictionary => {
		return {
			WD000001: {
				ko: '안녕하세요',
				en: 'Hello'
			},
			ST000044: {
				ko: '반품을 진행할 수 없는 건입니다.',
				en: 'It is not possible to proceed with the return.'
			},
			'프로그램 등록': {
				ko: '프로그램 등록',
				en: 'Program Registration',
				jp: 'プログラム登録'
			}
		};
	};

	const updateInlineTranslationLanguage = async (
		language: string | undefined
	): Promise<void> => {
		const config = vscode.workspace.getConfiguration('languageHelper');
		await config.update(
			'inlineTranslationLanguage',
			language,
			vscode.ConfigurationTarget.Global
		);
	};

	test('Inlay hints should return empty when no match exists in range', async () => {
		const document = await createTestDocument('const value = "NOT_MATCHED";');
		const range = new vscode.Range(
			new vscode.Position(0, 0),
			new vscode.Position(0, document.lineAt(0).text.length)
		);

		const languageDictionary = createTestLanguageDictionary();
		const hints = provideInlineHints(document, range, languageDictionary);

		assert.strictEqual(hints.length, 0);
	});

	test('Inlay hints should work for multiple lines in a single range', async () => {
		const document = await createTestDocument(
			['t("WD000001");', 't("ST000044");'].join('\n')
		);
		const range = new vscode.Range(
			new vscode.Position(0, 0),
			new vscode.Position(1, document.lineAt(1).text.length)
		);

		const languageDictionary = createTestLanguageDictionary();
		const hints = provideInlineHints(document, range, languageDictionary);

		assert.strictEqual(hints.length, 2);
		const hintTexts = hints.map((hint) => String(hint.label));
		assert.ok(hintTexts.some((text) => text.includes('안녕하세요')));
		assert.ok(hintTexts.some((text) => text.includes('반품을 진행할 수 없는 건입니다.')));
	});

	test('Inlay hints should follow selected language from settings (ko/en)', async () => {
		const previous = vscode.workspace
			.getConfiguration('languageHelper')
			.get<string>('inlineTranslationLanguage');

		try {
			const document = await createTestDocument('t("WD000001");');
			const range = new vscode.Range(
				new vscode.Position(0, 0),
				new vscode.Position(0, document.lineAt(0).text.length)
			);
			const languageDictionary = createTestLanguageDictionary();

			await updateInlineTranslationLanguage('en');
			const enHints = provideInlineHints(document, range, languageDictionary);
			assert.strictEqual(enHints.length, 1);
			assert.ok(String(enHints[0].label).includes('Hello'));

			await updateInlineTranslationLanguage('ko');
			const koHints = provideInlineHints(document, range, languageDictionary);
			assert.strictEqual(koHints.length, 1);
			assert.ok(String(koHints[0].label).includes('안녕하세요'));
		} finally {
			await updateInlineTranslationLanguage(previous);
		}
	});

	test('Inlay hints should work for Korean string key in translation function', async () => {
		const previous = vscode.workspace
			.getConfiguration('languageHelper')
			.get<string>('inlineTranslationLanguage');

		try {
			await updateInlineTranslationLanguage('en');

			const document = await createTestDocument('t("프로그램 등록");');
			const range = new vscode.Range(
				new vscode.Position(0, 0),
				new vscode.Position(0, document.lineAt(0).text.length)
			);
			const languageDictionary = createTestLanguageDictionary();

			const hints = provideInlineHints(document, range, languageDictionary);

			assert.strictEqual(hints.length, 1);
			assert.ok(String(hints[0].label).includes('Program Registration'));
		} finally {
			await updateInlineTranslationLanguage(previous);
		}
	});
});

