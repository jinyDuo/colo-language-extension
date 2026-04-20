export type GoogleSheetsApiResponse = {
	values: string[][];
	error?: {
		code: number;
		message: string;
		status: string;
	};
};

export type SheetsCredential =
	| { type: 'apiKey'; apiKey: string }
	| { type: 'oauth'; accessToken: string };

/** Per-tab stats when merging multiple Google Sheet tabs into one CSV for sync. */
export type SheetTabFetchSummary = {
	sheetTitle: string;
	dataRowCount: number;
	nonEmptyKeyRowCount: number;
};
