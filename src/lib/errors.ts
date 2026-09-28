export const getErrorMessage = (error: unknown, fallback = '処理に失敗しました。') => {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'object' && error && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message) return message
  }
  return fallback
}
