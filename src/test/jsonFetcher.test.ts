import * as assert from 'assert';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import {
	fetchDictionaryFromJsonUrl,
	parseJsonToDictionary
} from '../features/sheet-api/jsonFetcher';
const resolveFixturePath = (filename: string): string => {
	const fromCwd = path.join(process.cwd(), 'src', 'test', 'fixtures', filename);
	if (fs.existsSync(fromCwd)) {
		return fromCwd;
	}
	const fromDirname = path.join(__dirname, 'fixtures', filename);
	return fromDirname;
};

const loadFixtureJson = (filename: string): unknown => {
	const filePath = resolveFixturePath(filename);
	const content = fs.readFileSync(filePath, 'utf-8');
	return JSON.parse(content) as unknown;
};

const PARSE_OPTIONS_JA = { expectedJapaneseColumn: 'ja' as const };
const PARSE_OPTIONS_JP = { expectedJapaneseColumn: 'jp' as const };

suite('JSON Fetcher Test Suite', () => {
	suite('parseJsonToDictionary', () => {
		test('배열 형식 JSON을 LanguageDictionary로 변환한다', () => {
			const arrayJson = [
				{ key: 'WD001', ko: '한국어', en: 'English' },
				{ key: 'ST002', ko: '텍스트', en: 'Text' }
			];
			const result = parseJsonToDictionary(arrayJson, PARSE_OPTIONS_JA);

			assert.strictEqual(Object.keys(result).length, 2);
			assert.deepStrictEqual(result.WD001, { ko: '한국어', en: 'English' });
			assert.deepStrictEqual(result.ST002, { ko: '텍스트', en: 'Text' });
		});

		test('객체 형식 JSON을 LanguageDictionary로 변환한다', () => {
			const objectJson = {
				WD001: { ko: '한국어', en: 'English' },
				ST002: { ko: '텍스트', en: 'Text' }
			};
			const result = parseJsonToDictionary(objectJson, PARSE_OPTIONS_JA);

			assert.strictEqual(Object.keys(result).length, 2);
			assert.deepStrictEqual(result.WD001, { ko: '한국어', en: 'English' });
			assert.deepStrictEqual(result.ST002, { ko: '텍스트', en: 'Text' });
		});

		test('빈 배열은 빈 딕셔너리를 반환한다', () => {
			const result = parseJsonToDictionary([], PARSE_OPTIONS_JA);
			assert.strictEqual(Object.keys(result).length, 0);
		});

		test('key가 없는 배열 항목은 건너뛴다', () => {
			const arrayJson = [
				{ key: 'WD001', ko: '값' },
				{ ko: '키없음' },
				{ key: '', en: 'Empty' }
			];
			const result = parseJsonToDictionary(arrayJson, PARSE_OPTIONS_JA);

			assert.strictEqual(Object.keys(result).length, 1);
			assert.deepStrictEqual(result.WD001, { ko: '값' });
		});

		test('배열 항목에서 key 필드는 entry에 포함하지 않는다', () => {
			const arrayJson = [{ key: 'WD001', ko: '한국어', en: 'English' }];
			const result = parseJsonToDictionary(arrayJson, PARSE_OPTIONS_JA);

			assert.ok(!('key' in result.WD001));
			assert.strictEqual(result.WD001.ko, '한국어');
			assert.strictEqual(result.WD001.en, 'English');
		});

		test('숫자/문자열 등 배열·객체가 아니면 에러를 던진다', () => {
			assert.throws(
				() => parseJsonToDictionary('invalid', PARSE_OPTIONS_JA),
				/JSON 응답은 배열 또는 객체 형태여야 합니다/
			);
			assert.throws(
				() => parseJsonToDictionary(123, PARSE_OPTIONS_JA),
				/JSON 응답은 배열 또는 객체 형태여야 합니다/
			);
			assert.throws(
				() => parseJsonToDictionary(null, PARSE_OPTIONS_JA),
				/JSON 응답은 배열 또는 객체 형태여야 합니다/
			);
		});

		test('값은 문자열로 변환되고 trim 된다', () => {
			const arrayJson = [
				{ key: 'WD001', ko: '  공백  ', en: 100 }
			];
			const result = parseJsonToDictionary(arrayJson, PARSE_OPTIONS_JA);

			assert.strictEqual(result.WD001.ko, '공백');
			assert.strictEqual(result.WD001.en, '100');
		});

		test('japaneseLanguageCode가 ja인데 데이터에 jp만 있으면 에러', () => {
			assert.throws(
				() =>
					parseJsonToDictionary([{ key: 'WD001', ko: 'k', jp: 'j' }], PARSE_OPTIONS_JA),
				/ja`인데/
			);
		});

		test('japaneseLanguageCode가 jp인데 데이터에 ja만 있으면 에러', () => {
			assert.throws(
				() =>
					parseJsonToDictionary([{ key: 'WD001', ko: 'k', ja: 'j' }], PARSE_OPTIONS_JP),
				/jp`인데/
			);
		});
	});

	suite('JSON 파일 업로드(로컬 파일) 시뮬레이션', () => {
		test('배열 형식 fixture JSON 파일을 읽어 파싱하면 올바른 딕셔너리가 된다', () => {
			const data = loadFixtureJson('sheet-array.json');
			const result = parseJsonToDictionary(data, PARSE_OPTIONS_JA);

			assert.strictEqual(Object.keys(result).length, 3);
			assert.strictEqual(result.WD001?.ko, '안녕하세요');
			assert.strictEqual(result.WD001?.en, 'Hello');
			assert.strictEqual(result.WD001?.ja, 'こんにちは');
			assert.strictEqual(result.WD001?.jp, undefined);
			assert.strictEqual(result.ST002?.ko, '반품 불가');
			assert.strictEqual(result.ST002?.zh, '不可退货');
			assert.strictEqual(result.CD003?.ko, '테스트');
			assert.strictEqual(result.CD003?.en, 'Test');
		});

		test('객체 형식 fixture JSON 파일을 읽어 파싱하면 올바른 딕셔너리가 된다', () => {
			const data = loadFixtureJson('sheet-object.json');
			const result = parseJsonToDictionary(data, PARSE_OPTIONS_JA);

			assert.strictEqual(Object.keys(result).length, 3);
			assert.strictEqual(result.WD001?.ko, '안녕하세요');
			assert.strictEqual(result.WD001?.en, 'Hello');
			assert.strictEqual(result.WD001?.ja, 'こんにちは');
			assert.strictEqual(result.ST002?.zh, '不可退货');
			assert.strictEqual(result.CD003?.en, 'Test');
		});

		test('배열/객체 형식 fixture 파싱 결과가 동일한 구조를 갖는다', () => {
			const arrayData = loadFixtureJson('sheet-array.json');
			const objectData = loadFixtureJson('sheet-object.json');

			const fromArray = parseJsonToDictionary(arrayData, PARSE_OPTIONS_JA);
			const fromObject = parseJsonToDictionary(objectData, PARSE_OPTIONS_JA);

			assert.deepStrictEqual(fromArray, fromObject);
		});
	});

	suite('fetchDictionaryFromJsonUrl', () => {
		test('빈 URL이면 에러를 던진다', async () => {
			await assert.rejects(
				async () => fetchDictionaryFromJsonUrl('', PARSE_OPTIONS_JA),
				/JSON API URL을 입력해주세요/
			);
			await assert.rejects(
				async () => fetchDictionaryFromJsonUrl('   ', PARSE_OPTIONS_JA),
				/JSON API URL을 입력해주세요/
			);
		});

		test('URL 요청 후 배열 형식 JSON 응답을 LanguageDictionary로 반환한다', async () => {
			const mockArrayData = [
				{ key: 'WD001', ko: '한국어', en: 'English' },
				{ key: 'ST002', ko: '텍스트', en: 'Text' }
			];
			const originalGet = axios.get;
			(axios as { get: (url: string) => Promise<{ data: unknown }> }).get = async () => ({
				data: mockArrayData
			});

			try {
				const result = await fetchDictionaryFromJsonUrl(
					'https://example.com/sheet.json',
					PARSE_OPTIONS_JA
				);
				assert.strictEqual(Object.keys(result).length, 2);
				assert.deepStrictEqual(result.WD001, { ko: '한국어', en: 'English' });
				assert.deepStrictEqual(result.ST002, { ko: '텍스트', en: 'Text' });
			} finally {
				axios.get = originalGet;
			}
		});

		test('URL 요청 후 객체 형식 JSON 응답을 LanguageDictionary로 반환한다', async () => {
			const mockObjectData = {
				WD001: { ko: '한국어', en: 'English' },
				ST002: { ko: '텍스트', en: 'Text' }
			};
			const originalGet = axios.get;
			(axios as { get: (url: string) => Promise<{ data: unknown }> }).get = async () => ({
				data: mockObjectData
			});

			try {
				const result = await fetchDictionaryFromJsonUrl(
					'https://api.example.com/lang',
					PARSE_OPTIONS_JA
				);
				assert.strictEqual(Object.keys(result).length, 2);
				assert.deepStrictEqual(result.WD001, { ko: '한국어', en: 'English' });
				assert.deepStrictEqual(result.ST002, { ko: '텍스트', en: 'Text' });
			} finally {
				axios.get = originalGet;
			}
		});
	});
});
