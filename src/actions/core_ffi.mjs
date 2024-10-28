import { ExitCode$isFailure, ExitCode$isSuccess } from "./core.mjs";

export function setExitCode(value) {
  if (ExitCode$isFailure(value)) {
    process.exitCode = 1;
  } else if (ExitCode$isSuccess(value)) {
    process.exitCode = 0;
  } else if (typeof value == "number") {
    process.exitCode = value;
  }
}
