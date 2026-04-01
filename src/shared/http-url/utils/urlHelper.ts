export const normalizeAndValidateUrl = (url: string): string => {
	const trimmed = url.trim();
	if (!trimmed) {
		throw new Error('URL이 비어있습니다.');
	}

	const withProtocol =
		trimmed.startsWith('http://') || trimmed.startsWith('https://')
			? trimmed
			: `https://${trimmed}`;

	try {
		new URL(withProtocol);
		return withProtocol;
	} catch {
		throw new Error(`올바른 URL 형식이 아닙니다: ${trimmed}`);
	}
};
