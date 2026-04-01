import * as assert from 'assert';
import { parseWorkspaceExportPathSegments } from '../shared/workspace-export/utils/workspaceExportPath';

suite('workspaceExportPath', () => {
	test('빈 문자열이면 EMPTY', () => {
		assert.throws(() => parseWorkspaceExportPathSegments(''), (error: Error) => error.message === 'EMPTY');
		assert.throws(() => parseWorkspaceExportPathSegments('   '), (error: Error) => error.message === 'EMPTY');
	});

	test('.. 또는 . 세그먼트면 INVALID_SEGMENT', () => {
		assert.throws(() => parseWorkspaceExportPathSegments('foo/../bar'), (error: Error) => error.message === 'INVALID_SEGMENT');
		assert.throws(() => parseWorkspaceExportPathSegments('lang/./x'), (error: Error) => error.message === 'INVALID_SEGMENT');
	});

	test('language 단일 세그먼트', () => {
		assert.deepStrictEqual(parseWorkspaceExportPathSegments('language'), ['language']);
	});

	test('src/locales 형태', () => {
		assert.deepStrictEqual(parseWorkspaceExportPathSegments('src/locales'), ['src', 'locales']);
		assert.deepStrictEqual(parseWorkspaceExportPathSegments('src\\locales'), ['src', 'locales']);
	});
});
