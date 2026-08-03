export const buildQueryParams = (params: { [key: string]: unknown }): string => {
	Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

	const query: string[] = [];

	Object.entries(params).forEach(([key, value]) =>
		Array.isArray(value)
			? value.forEach((i) => query.push(`${key}=${encodeURIComponent(i)}`))
			: query.push(`${key}=${String(value)}`),
	);

	return query.join('&');
};

