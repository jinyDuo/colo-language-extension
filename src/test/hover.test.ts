import * as assert from 'assert';
import * as vscode from 'vscode';
import { provideHover } from '../features/hover/hover';
import type { LanguageDictionary } from '../shared/language-dictionary/types';

suite('Hover Provider Test Suite', () => {
	const createTestDocument = async (
		content: string,
		language: string = 'typescript'
	): Promise<vscode.TextDocument> => {
		const uri = vscode.Uri.parse('untitled:test.ts');
		return await vscode.workspace.openTextDocument({
			language,
			content
		});
	};

	const createTestLanguageDictionary = (): LanguageDictionary => {
		return {
			WD000001: {
				ko: '안녕하세요',
				en: 'Hello',
				ja: 'こんにちは'
			},
			ST000044: {
				ko: '반품을 진행할 수 없는 건입니다.',
				en: 'It is not possible to proceed with the return.'
			},
			CD000123: {
				ko: '테스트',
				en: 'Test',
				es: 'Prueba',
				zh: '测试'
			}
		};
	};

	test('Hover should return null when code pattern does not match', async () => {
		const document = await createTestDocument('const code = "INVALID123";');
		const position = new vscode.Position(0, 15);
		const languageDictionary = createTestLanguageDictionary();

		const hover = provideHover(document, position, languageDictionary);

		assert.strictEqual(hover, null);
	});

	test('Hover should return null when code is not in dictionary', async () => {
		const document = await createTestDocument('const code = "WD999999";');
		const position = new vscode.Position(0, 15);
		const languageDictionary = createTestLanguageDictionary();

		const hover = provideHover(document, position, languageDictionary);

		assert.strictEqual(hover, null);
	});

	test('Hover should return hover content for valid WD code', async () => {
		const document = await createTestDocument('const code = "WD000001";');
		const position = new vscode.Position(0, 15);
		const languageDictionary = createTestLanguageDictionary();

		const hover = provideHover(document, position, languageDictionary);

		assert.notStrictEqual(hover, null);
		if (hover) {
			const contents = hover.contents;
			assert.strictEqual(Array.isArray(contents), true);
			if (Array.isArray(contents) && contents.length > 0) {
				const markdownString = contents[0] as vscode.MarkdownString;
				assert.strictEqual(typeof markdownString.value, 'string');
				assert.ok(markdownString.value.includes('WD000001'));
				assert.ok(markdownString.value.includes('안녕하세요'));
				assert.ok(markdownString.value.includes('Hello'));
				assert.ok(markdownString.value.includes('こんにちは'));
			}
		}
	});

	test('Hover should return hover content for valid ST code', async () => {
		const document = await createTestDocument('getLang("ST000044");');
		const position = new vscode.Position(0, 10);
		const languageDictionary = createTestLanguageDictionary();

		const hover = provideHover(document, position, languageDictionary);

		assert.notStrictEqual(hover, null);
		if (hover) {
			const contents = hover.contents;
			assert.strictEqual(Array.isArray(contents), true);
			if (Array.isArray(contents) && contents.length > 0) {
				const markdownString = contents[0] as vscode.MarkdownString;
				assert.strictEqual(typeof markdownString.value, 'string');
				assert.ok(markdownString.value.includes('ST000044'));
				assert.ok(markdownString.value.includes('반품을 진행할 수 없는 건입니다.'));
				assert.ok(markdownString.value.includes('It is not possible to proceed with the return.'));
			}
		}
	});

	test('Hover should return hover content for valid CD code with multiple languages', async () => {
		const document = await createTestDocument('const code = "CD000123";');
		const position = new vscode.Position(0, 15);
		const languageDictionary = createTestLanguageDictionary();

		const hover = provideHover(document, position, languageDictionary);

		assert.notStrictEqual(hover, null);
		if (hover) {
			const contents = hover.contents;
			assert.strictEqual(Array.isArray(contents), true);
			if (Array.isArray(contents) && contents.length > 0) {
				const markdownString = contents[0] as vscode.MarkdownString;
				assert.strictEqual(typeof markdownString.value, 'string');
				assert.ok(markdownString.value.includes('CD000123'));
				assert.ok(markdownString.value.includes('테스트'));
				assert.ok(markdownString.value.includes('Test'));
				assert.ok(markdownString.value.includes('Prueba'));
				assert.ok(markdownString.value.includes('测试'));
			}
		}
	});

	test('Hover should return null when entry has no valid language data', async () => {
		const emptyDictionary: LanguageDictionary = {
			WD000001: {
				ko: '',
				en: '',
				ja: '   '
			}
		};

		const document = await createTestDocument('const code = "WD000001";');
		const position = new vscode.Position(0, 15);

		const hover = provideHover(document, position, emptyDictionary);

		assert.strictEqual(hover, null);
	});

	test('Hover should work with string literal in function call', async () => {
		const document = await createTestDocument('t("WD000001");');
		const position = new vscode.Position(0, 3);
		const languageDictionary = createTestLanguageDictionary();

		const hover = provideHover(document, position, languageDictionary);

		assert.notStrictEqual(hover, null);
		if (hover) {
			const contents = hover.contents;
			assert.strictEqual(Array.isArray(contents), true);
			if (Array.isArray(contents) && contents.length > 0) {
				const markdownString = contents[0] as vscode.MarkdownString;
				assert.ok(markdownString.value.includes('WD000001'));
			}
		}
	});

	test('Hover should work with i18n function call', async () => {
		const document = await createTestDocument('i18n("ST000044");');
		const position = new vscode.Position(0, 6);
		const languageDictionary = createTestLanguageDictionary();

		const hover = provideHover(document, position, languageDictionary);

		assert.notStrictEqual(hover, null);
		if (hover) {
			const contents = hover.contents;
			assert.strictEqual(Array.isArray(contents), true);
			if (Array.isArray(contents) && contents.length > 0) {
				const markdownString = contents[0] as vscode.MarkdownString;
				assert.ok(markdownString.value.includes('ST000044'));
			}
		}
	});

	test('Hover should filter out empty language values', async () => {
		const dictionaryWithEmptyValues: LanguageDictionary = {
			WD000001: {
				ko: '안녕하세요',
				en: '',
				ja: '   ',
				es: 'Hola'
			}
		};

		const document = await createTestDocument('const code = "WD000001";');
		const position = new vscode.Position(0, 15);

		const hover = provideHover(document, position, dictionaryWithEmptyValues);

		assert.notStrictEqual(hover, null);
		if (hover) {
			const contents = hover.contents;
			assert.strictEqual(Array.isArray(contents), true);
			if (Array.isArray(contents) && contents.length > 0) {
				const markdownString = contents[0] as vscode.MarkdownString;
				assert.ok(markdownString.value.includes('안녕하세요'));
				assert.ok(markdownString.value.includes('Hola'));
				assert.ok(!markdownString.value.includes('EN'));
				assert.ok(!markdownString.value.includes('JA'));
			}
		}
	});
});
