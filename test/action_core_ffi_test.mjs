import { Result$Ok, Result$Error } from "./gleam.mjs";

export function simulateThrowingFfi(message) {
  try {
    throw new globalThis.Error(message);
  } catch (e) {
    return Result$Error(e.message);
  }
}

export function simulateSuccessFfi(value) {
  try {
    return Result$Ok(value);
  } catch (e) {
    return Result$Error(e.message);
  }
}
