const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// IDs and invite tokens in URLs are UUIDs. Anything else cannot match a row,
// and sending it to the database only returns an error message in English.
export const isUuid = (value: string) => UUID_PATTERN.test(value)
