import * as assert from 'assert';
import {
	DEFAULT_JAPANESE_LANGUAGE_CODE,
	resolveSheetLanguageCodeItems
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

	test('filterLanguageDictionaryToDeclaredSheetLanguages keeps only sheet columns allowed by extension', () => {
		const input = {
			WD1: { ko: 'k', en: 'e', xx: 'drop', ja: 'j' }
		};
		const out = filterLanguageDictionaryToDeclaredSheetLanguages(input);
		assert.deepStrictEqual(Object.keys(out.WD1).sort(), ['en', 'ja', 'ko']);
		assert.strictEqual(out.WD1.ko, 'k');
		assert.strictEqual(out.WD1.en, 'e');
		assert.strictEqual(out.WD1.ja, 'j');
		assert.strictEqual('xx' in out.WD1, false);
		assert.strictEqual('jp' in out.WD1, false);
		assert.strictEqual('zh' in out.WD1, false);
	});

	test('filterLanguageDictionaryToDeclaredSheetLanguages omits keys for columns absent from sheet data', () => {
		const input = { WD1: { ko: 'a', en: 'b' } };
		const out = filterLanguageDictionaryToDeclaredSheetLanguages(input);
		assert.deepStrictEqual(Object.keys(out.WD1).sort(), ['en', 'ko']);
		assert.strictEqual('ja' in out.WD1, false);
		assert.strictEqual('zh' in out.WD1, false);
	});

	test('filterLanguageDictionaryToDeclaredSheetLanguages unions columns across rows then fills each row', () => {
		const input = {
			A: { ko: '1', en: '2' },
			B: { ko: '3', zh: '四' }
		};
		const out = filterLanguageDictionaryToDeclaredSheetLanguages(input);
		assert.deepStrictEqual(Object.keys(out.A).sort(), ['en', 'ko', 'zh']);
		assert.strictEqual(out.A.zh, '');
		assert.deepStrictEqual(Object.keys(out.B).sort(), ['en', 'ko', 'zh']);
		assert.strictEqual(out.B.en, '');
		assert.strictEqual(out.B.zh, '四');
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
