export function registerProcessHandlers(errorFn, setFailedFn) {
  process.on("unhandledRejection", (reason) => {
    const msg = reason instanceof Error ? reason.message : String(reason);
    errorFn("Unhandled rejection: " + msg);
    setFailedFn("Unhandled rejection: " + msg);
  });
  process.on("uncaughtException", (err) => {
    const msg = err instanceof Error ? err.message : String(err);
    errorFn("Uncaught exception: " + msg);
    setFailedFn("Uncaught exception: " + msg);
  });
}
