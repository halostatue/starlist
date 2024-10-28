/// Property test for Path Containment Security.
///
/// Validates that paths outside allowed roots return Error(SecurityError).
import gleam/list
import gleam/string
import qcheck
import starlist/config
import starlist/internal/errors

fn traversal_path_generator() -> qcheck.Generator(String) {
  qcheck.from_generators(qcheck.return("/etc/passwd"), [
    qcheck.return("/tmp/evil"),
    qcheck.return("/var/log/syslog"),
    qcheck.return("../../../etc/passwd"),
    qcheck.return("../../.ssh/id_rsa"),
    qcheck.return("foo/../../.."),
    qcheck.return("templates/../../../outside"),
    {
      use n <- qcheck.bind(qcheck.bounded_int(from: 2, to: 10))
      let dots = string.join(list.repeat("..", n), "/")
      qcheck.return(dots <> "/etc/passwd")
    },
  ])
}

fn safe_path_generator() -> qcheck.Generator(String) {
  qcheck.from_generators(qcheck.return("README.md"), [
    qcheck.return("stars/gleam.md"),
    qcheck.return("TEMPLATE.md.glemp"),
    qcheck.return("src/foo.gleam"),
    qcheck.return("./output/stars.md"),
    qcheck.return("foo/../bar.md"),
    qcheck.return("a/b/../c.md"),
  ])
}

pub fn path_traversal_rejected_test() {
  let repo_root = "/home/user/repo"

  use path <- qcheck.given(traversal_path_generator())
  let result = config.validate_path(path, repo_root, "output")
  case result {
    Error(errors.SecurityError(_)) -> Nil
    _ -> panic as { "Expected SecurityError for path: " <> path }
  }
}

pub fn safe_paths_accepted_test() {
  let repo_root = "/home/user/repo"

  use path <- qcheck.given(safe_path_generator())
  let result = config.validate_path(path, repo_root, "output")
  case result {
    Ok(_) -> Nil
    Error(e) -> {
      let msg = case e {
        errors.SecurityError(m) -> m
        _ -> "unexpected error type"
      }
      panic as { "Expected Ok for path '" <> path <> "', got: " <> msg }
    }
  }
}
