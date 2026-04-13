import * as assert from 'assert';
import { SHEET_LANGUAGE_CODE_ITEMS } from '../shared/language-dictionary/constants/sheetLanguageCodes';
import { filterLanguageDictionaryToDeclaredSheetLanguages } from '../shared/language-dictionary/utils/filterLanguageDictionaryToDeclaredSheetLanguages';
import {
	normalizeLanguageDictionaryFromSheet,
	normalizeLanguageEntryFromSheet
} from '../shared/language-dictionary/utils/normalizeLanguageDictionaryFromSheet';

suite('sheet language normalization and export filter', () => {
	test('normalizeLanguageEntryFromSheet maps ja to jp', () => {
		assert.deepStrictEqual(normalizeLanguageEntryFromSheet({ ko: 'a', ja: 'b' }), {
			ko: 'a',
			jp: 'b'
		});
	});

	test('normalizeLanguageEntryFromSheet prefers non-empty jp over ja', () => {
		assert.deepStrictEqual(
			normalizeLanguageEntryFromSheet({ jp: 'JP', ja: 'JA' }),
			{ jp: 'JP' }
		);
	});

	test('normalizeLanguageDictionaryFromSheet applies per entry', () => {
		const input = {
			W1: { ja: 'x', extra: 'y' }
		};
		const out = normalizeLanguageDictionaryFromSheet(input);
		assert.strictEqual(out.W1.jp, 'x');
		assert.strictEqual(out.W1.extra, 'y');
		assert.strictEqual(out.W1.ja, undefined);
	});

	test('filterLanguageDictionaryToDeclaredSheetLanguages drops undeclared columns', () => {
		const input = {
			WD1: { ko: 'k', en: 'e', xx: 'drop', jp: 'j' }
		};
		const out = filterLanguageDictionaryToDeclaredSheetLanguages(input);
		assert.strictEqual(Object.keys(out.WD1).length, SHEET_LANGUAGE_CODE_ITEMS.length);
		assert.strictEqual(out.WD1.ko, 'k');
		assert.strictEqual(out.WD1.en, 'e');
		assert.strictEqual(out.WD1.jp, 'j');
		assert.strictEqual('xx' in out.WD1, false);
	});
});
