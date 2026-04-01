const NEEDS_QUOTING = /[,\n"]/;

const escapeCellForCsv = (cell: string): string => {
	const value = String(cell ?? '');
	if (!NEEDS_QUOTING.test(value)) {
		return value;
	}
	const escaped = value.replace(/"/g, '""');
	return `"${escaped}"`;
};

export const padRowToMatchHeader = (row: string[], headerLength: number): string[] => {
	const paddedRow = [...row];
	while (paddedRow.length < headerLength) {
		paddedRow.push('');
	}
	return paddedRow;
};

export const rowToCsvLine = (row: string[]): string => {
	return row.map(escapeCellForCsv).join(',');
};
