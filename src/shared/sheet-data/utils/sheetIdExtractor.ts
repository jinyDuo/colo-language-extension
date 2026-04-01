export const extractSheetIdFromUrl = (url: string): string | null => {
	const patterns = [
		/d\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
		/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
		/d\/([a-zA-Z0-9-_]+)/
	];

	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match && match[1]) {
			return match[1];
		}
	}

	return null;
};
