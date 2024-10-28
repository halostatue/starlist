//// Top-level error type for starlist.

pub type StarlistError {
  /// Configuration parsing or validation failed.
  ConfigError(message: String)
  /// GitHub API request failed after retries.
  GitHubApiError(message: String)
  /// File I/O error (read/write data.json, templates, output).
  FileError(message: String)
  /// Template compilation or rendering failed.
  TemplateError(message: String)
  /// Markdown processing failed.
  MarkdownError(message: String)
  /// Git command failed with non-zero exit code.
  GitError(command: String, exit_code: Int, message: String)
  /// Security violation (path outside allowed roots).
  SecurityError(message: String)
  /// Data version mismatch when loading from file.
  VersionMismatchError(expected: Int, found: Int)
}
