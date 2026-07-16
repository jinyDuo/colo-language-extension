/**
 * Extension-supported sheet / inline translation language codes.
 * Japanese always uses the `ja` sheet column / JSON key.
 */
export const SHEET_LANGUAGE_CODE_ITEMS = ['ko', 'en', 'ja', 'zh', 'es', 'fr', 'de', 'pt', 'ru', 'it'] as const;

export type SheetLanguageCode = (typeof SHEET_LANGUAGE_CODE_ITEMS)[number];
