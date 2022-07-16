export const ErrorWithLog = (message: string, outlog = console.warn) => {
  outlog(message)
  return Error(message)
}
