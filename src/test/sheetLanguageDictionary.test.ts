import * as assert from 'assert';
import {
	DEFAULT_JAPANESE_LANGUAGE_CODE,
	resolveSheetLanguageCodeItems,
	SHEET_LANGUAGE_CODE_ITEMS
} from '../shared/language-dictionary/constants/sheetLanguageCodes';
import { assertExpectedJapaneseSheetColumnPresent } from '../shared/language-dictionary/utils/assertExpectedJapaneseSheetColumn';
import { filterLanguageDictionaryToDeclaredSheetLanguages } from '../shared/language-dictionary/utils/filterLanguageDictionaryToDeclaredSheetLanguages';
import {
	normalizeLanguageDictionaryFromSheet,
	normalizeLanguageEntryFromSheet
} from '../shared/language-dictionary/utils/normalizeLanguageDictionaryFromSheet';

suite('sheet language normalization and export filter', () => {
	test('normalizeLanguageEntryFromSheet keeps only ja when expected ja', () => {
		assert.deepStrictEqual(
			normalizeLanguageEntryFromSheet({ ko: 'a', ja: 'b', jp: 'ignored' }, 'ja'),
			{ ko: 'a', ja: 'b' }
		);
	});

	test('normalizeLanguageEntryFromSheet keeps only jp when expected jp', () => {
		assert.deepStrictEqual(
			normalizeLanguageEntryFromSheet({ ko: 'a', ja: 'ignored', jp: 'c' }, 'jp'),
			{ ko: 'a', jp: 'c' }
		);
	});

	test('normalizeLanguageEntryFromSheet omits Japanese keys when row has none', () => {
		assert.deepStrictEqual(normalizeLanguageEntryFromSheet({ ko: 'a', en: 'b' }, 'ja'), {
			ko: 'a',
			en: 'b'
		});
	});

	test('normalizeLanguageDictionaryFromSheet applies per entry', () => {
		const input = {
			W1: { ja: 'x', extra: 'y' }
		};
		const out = normalizeLanguageDictionaryFromSheet(input, 'ja');
		assert.strictEqual(out.W1.ja, 'x');
		assert.strictEqual(out.W1.extra, 'y');
		assert.strictEqual(out.W1.jp, undefined);
	});

	test('filterLanguageDictionaryToDeclaredSheetLanguages drops undeclared columns', () => {
		const input = {
			WD1: { ko: 'k', en: 'e', xx: 'drop', ja: 'j' }
		};
		const out = filterLanguageDictionaryToDeclaredSheetLanguages(input);
		assert.strictEqual(Object.keys(out.WD1).length, SHEET_LANGUAGE_CODE_ITEMS.length);
		assert.strictEqual(out.WD1.ko, 'k');
		assert.strictEqual(out.WD1.en, 'e');
		assert.strictEqual(out.WD1.ja, 'j');
		assert.strictEqual('xx' in out.WD1, false);
		assert.strictEqual('jp' in out.WD1, false);
	});

	test('resolveSheetLanguageCodeItems includes only one Japanese key', () => {
		const jaItems = resolveSheetLanguageCodeItems(DEFAULT_JAPANESE_LANGUAGE_CODE);
		assert.ok(jaItems.includes('ja'));
		assert.strictEqual(jaItems.includes('jp'), false);
		const jpItems = resolveSheetLanguageCodeItems('jp');
		assert.ok(jpItems.includes('jp'));
		assert.strictEqual(jpItems.includes('ja'), false);
	});

	test('assertExpectedJapaneseSheetColumnPresent skips when no ja/jp columns anywhere', () => {
		assert.doesNotThrow(() =>
			assertExpectedJapaneseSheetColumnPresent(
				{ A: { ko: '1', en: '2' } },
				'ja'
			)
		);
	});

	test('assertExpectedJapaneseSheetColumnPresent throws when ja expected but only jp exists', () => {
		assert.throws(
			() =>
				assertExpectedJapaneseSheetColumnPresent({ A: { ko: '1', jp: 'x' } }, 'ja'),
			/ja`인데/
		);
	});

	test('assertExpectedJapaneseSheetColumnPresent throws when jp expected but only ja exists', () => {
		assert.throws(
			() =>
				assertExpectedJapaneseSheetColumnPresent({ A: { ko: '1', ja: 'x' } }, 'jp'),
			/jp`인데/
		);
	});
});
