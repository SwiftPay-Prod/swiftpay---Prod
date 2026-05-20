const GUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

export function isGuid(value: string): boolean {
	if (!value) {
		return false;
	}

	return GUID_REGEX.test(value.trim());
}
