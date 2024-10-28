/// Property test for FFI Exception Boundary (P1).
///
/// Validates: Requirement 3.5 — when the underlying runtime API throws an
/// exception, the FFI layer catches it and returns an Error variant with the
/// exception message, never propagating uncaught.
import qcheck

// FFI bindings to test helpers that replicate the try/catch pattern
// from action_ffi.mjs with controllable throw/success paths.

@external(javascript, "./action_core_ffi_test.mjs", "simulateThrowingFfi")
fn simulate_throwing_ffi(message: String) -> Result(String, String)

@external(javascript, "./action_core_ffi_test.mjs", "simulateSuccessFfi")
fn simulate_success_ffi(value: String) -> Result(String, String)

/// P1: For any string used as an exception message, the FFI boundary
/// catches the exception and returns Error(message) — never propagates.
pub fn ffi_exception_boundary_returns_error_test() {
  use message <- qcheck.given(qcheck.string())
  let result = simulate_throwing_ffi(message)
  assert result == Error(message)
}

/// P1 (converse): For any string value, the FFI boundary returns Ok(value)
/// when no exception is thrown.
pub fn ffi_success_boundary_returns_ok_test() {
  use value <- qcheck.given(qcheck.string())
  let result = simulate_success_ffi(value)
  assert result == Ok(value)
}
