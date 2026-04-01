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
