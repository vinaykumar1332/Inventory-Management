/** Error whose message is an i18n key, so the UI can translate it. */
export class ApiError extends Error {
  constructor(
    public readonly key: string,
    public readonly params: Record<string, string | number> = {},
  ) {
    super(key)
    this.name = 'ApiError'
  }
}
