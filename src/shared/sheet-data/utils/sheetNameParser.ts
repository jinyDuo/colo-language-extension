export const parseSheetNames = (sheetNamesConfig: string): string[] => {
	return sheetNamesConfig
		.split(',')
		.map((name) => name.trim())
		.filter((name) => name.length > 0);
};
