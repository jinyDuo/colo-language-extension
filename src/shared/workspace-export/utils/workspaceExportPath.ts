export const parseWorkspaceExportPathSegments = (rawPath: string): string[] => {
	const normalized = rawPath.replace(/\\/g, '/').trim();
	if (normalized.length === 0) {
		throw new Error('EMPTY');
	}

	const pathSegmentItems = normalized.split('/').filter((segment) => segment.length > 0);
	if (pathSegmentItems.length === 0) {
		throw new Error('EMPTY');
	}

	for (const segment of pathSegmentItems) {
		if (segment === '..' || segment === '.') {
			throw new Error('INVALID_SEGMENT');
		}
	}

	return pathSegmentItems;
};
