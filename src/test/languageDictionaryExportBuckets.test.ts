import * as assert from 'assert';
import {
	buildExportFileNameFromSheetPrefix,
	mergeDictionaryFromPrefixBuckets,
	splitDictionaryByConfiguredSheetPrefixes
} from '../shared/language-dictionary/utils/languageDictionaryExportBuckets';

suite('languageDictionaryExportBuckets', () => {
	test('buildExportFileNameFromSheetPrefix', () => {
		assert.strictEqual(buildExportFileNameFromSheetPrefix('WD'), 'wd_lang.json');
		assert.strictEqual(buildExportFileNameFromSheetPrefix('  MS  '), 'ms_lang.json');
	});

	test('targetSheetNames 쉼표 기준 버킷 + other', () => {
		const dict = {
			WD001: { ko: 'a', en: 'b' },
			ST002: { ko: 'c', en: 'd' },
			XX999: { ko: 'x', en: 'y' }
		};
		const { prefixBucketItems, otherDictionary } = splitDictionaryByConfiguredSheetPrefixes(
			dict,
			'WD, ST'
		);
		assert.strictEqual(prefixBucketItems.length, 2);
		assert.deepStrictEqual(prefixBucketItems[0].dictionary, { WD001: dict.WD001 });
		assert.deepStrictEqual(prefixBucketItems[1].dictionary, { ST002: dict.ST002 });
		assert.deepStrictEqual(otherDictionary, { XX999: dict.XX999 });
	});

	test('빈 설정이면 DEFAULT_TARGET_SHEET_NAMES 사용', () => {
		const dict = {
			CD001: { ko: 'k', en: 'e' }
		};
		const { prefixBucketItems, otherDictionary } = splitDictionaryByConfiguredSheetPrefixes(dict, '');
		const cdBucket = prefixBucketItems.find((item) => item.sheetPrefix.toUpperCase() === 'CD');
		assert.ok(cdBucket);
		assert.deepStrictEqual(cdBucket?.dictionary, dict);
		assert.deepStrictEqual(otherDictionary, {});
	});

	test('mergeDictionaryFromPrefixBuckets는 접두 버킷만 합친다', () => {
		const dict = {
			WD001: { ko: 'a', en: 'b' },
			ST002: { ko: 'c', en: 'd' },
			XX999: { ko: 'x', en: 'y' }
		};
		const { prefixBucketItems } = splitDictionaryByConfiguredSheetPrefixes(dict, 'WD, ST');
		assert.deepStrictEqual(mergeDictionaryFromPrefixBuckets(prefixBucketItems), {
			WD001: dict.WD001,
			ST002: dict.ST002
		});
	});

	test('긴 접두사 우선 매칭', () => {
		const dict = { WDX1: { ko: '1', en: '1' }, W1: { ko: '2', en: '2' } };
		const { prefixBucketItems, otherDictionary } = splitDictionaryByConfiguredSheetPrefixes(
			dict,
			'W,WDX'
		);
		const wdx = prefixBucketItems.find((item) => item.sheetPrefix === 'WDX');
		const w = prefixBucketItems.find((item) => item.sheetPrefix === 'W');
		assert.deepStrictEqual(wdx?.dictionary, { WDX1: dict.WDX1 });
		assert.deepStrictEqual(w?.dictionary, { W1: dict.W1 });
		assert.deepStrictEqual(otherDictionary, {});
	});
});
