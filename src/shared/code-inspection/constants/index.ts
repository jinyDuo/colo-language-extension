export const DEFAULT_HOVER_KEY_PATTERNS = 'WD,ST,CD';
export const DEFAULT_CODE_PATTERN_REGEX = /(WD|ST|CD)\d+/;
export const DEFAULT_INLINE_TRANSLATION_LANGUAGE = 'en';

export const TRANSLATION_FUNCTION_PATTERN = /(?:getLang|t|i18n|translate|lang)\(['"`]([^'"`]+)['"`]\)/g;
export const STRING_LITERAL_PATTERN = /['"`]([^'"`]+)['"`]/g;
export const KOREAN_CHARACTER_PATTERN = /[가-힣]+/;
