import gleam/int

/// The main Starlist error
pub type StarlistError {
  /// Configuration parsing or validation failed.
  ConfigError(message: String)
  /// GitHub API request failed after retries.
  GitHubApiError(message: String)
  /// File I/O error (read/write data JSON, templates, output).
  FileError(message: String)
  /// Template compilation or rendering failed.
  TemplateError(message: String)
  /// Markdown processing failed.
  RenderError(message: String)
  /// Git command failed with non-zero exit code.
  GitError(command: String, exit_code: Int, message: String)
  /// Security violation (path outside allowed roots).
  SecurityError(message: String)
  /// Data version mismatch when loading from file.
  VersionMismatchError(expected: Int, found: Int)
}

pub fn to_string(err: StarlistError) -> String {
  case err {
    ConfigError(msg) -> "Configuration error: " <> msg
    GitHubApiError(msg) -> "GitHub API error: " <> msg
    FileError(msg) -> "File error: " <> msg
    TemplateError(msg) -> "Template error: " <> msg
    RenderError(msg) -> "Markdown error: " <> msg
    GitError(command:, exit_code:, message:) ->
      "Git error (exit "
      <> int.to_string(exit_code)
      <> ") running '"
      <> command
      <> "': "
      <> message
    SecurityError(msg) -> "Security error: " <> msg
    VersionMismatchError(expected:, found:) ->
      "Data version mismatch: expected "
      <> int.to_string(expected)
      <> ", found "
      <> int.to_string(found)
  }
}
