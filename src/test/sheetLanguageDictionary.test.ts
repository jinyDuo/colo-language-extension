import * as assert from 'assert';
import { filterLanguageDictionaryToDeclaredSheetLanguages } from '../shared/language-dictionary/utils/filterLanguageDictionaryToDeclaredSheetLanguages';

suite('sheet language export filter', () => {
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
});
