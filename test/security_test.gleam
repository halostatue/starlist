/// Security and sanitization tests.
import starlist/config
import starlist/internal/errors
import starlist/internal/partitioner

// ---------------------------------------------------------------------------
// sanitize_key: shorthands
// ---------------------------------------------------------------------------

pub fn sanitize_cpp_test() {
  let assert "cpp" = partitioner.sanitize_key("C++")
}

pub fn sanitize_csharp_test() {
  let assert "csharp" = partitioner.sanitize_key("C#")
}

pub fn sanitize_fsharp_test() {
  let assert "fsharp" = partitioner.sanitize_key("F#")
}

pub fn sanitize_fstar_test() {
  let assert "fstar" = partitioner.sanitize_key("F*")
}

pub fn sanitize_qsharp_test() {
  let assert "qsharp" = partitioner.sanitize_key("Q#")
}

pub fn sanitize_objective_cpp_test() {
  let assert "objective-cpp" = partitioner.sanitize_key("Objective-C++")
}

pub fn sanitize_dotnet_test() {
  let assert "dotnet" = partitioner.sanitize_key(".NET")
}

pub fn sanitize_visual_basic_dotnet_test() {
  let assert "visual-basic-dotnet" =
    partitioner.sanitize_key("Visual Basic .NET")
}

// ---------------------------------------------------------------------------
// sanitize_key: general rules
// ---------------------------------------------------------------------------

pub fn sanitize_lowercases_test() {
  let assert "rust" = partitioner.sanitize_key("Rust")
}

pub fn sanitize_spaces_to_hyphens_test() {
  let assert "vim-script" = partitioner.sanitize_key("Vim Script")
}

pub fn sanitize_node_js_test() {
  let assert "node-js" = partitioner.sanitize_key("node.js")
}

// Linguist edge cases (general rule, no shorthands needed)

pub fn sanitize_asn1_test() {
  let assert "asn-1" = partitioner.sanitize_key("ASN.1")
}

pub fn sanitize_asp_dotnet_test() {
  let assert "aspdotnet" = partitioner.sanitize_key("ASP.NET")
}

pub fn sanitize_html_ecr_test() {
  let assert "html-ecr" = partitioner.sanitize_key("HTML+ECR")
}

pub fn sanitize_peg_js_test() {
  let assert "peg-js" = partitioner.sanitize_key("PEG.js")
}

pub fn sanitize_ren_py_test() {
  let assert "renpy" = partitioner.sanitize_key("Ren'Py")
}

pub fn sanitize_capn_proto_test() {
  let assert "capn-proto" = partitioner.sanitize_key("Cap'n Proto")
}

pub fn sanitize_visual_basic_6_test() {
  let assert "visual-basic-6-0" = partitioner.sanitize_key("Visual Basic 6.0")
}

pub fn sanitize_no_leading_hyphen_test() {
  let assert "something" = partitioner.sanitize_key("-something")
}

pub fn sanitize_no_trailing_hyphen_test() {
  let assert "test" = partitioner.sanitize_key("test-")
}

pub fn sanitize_year_test() {
  let assert "2024" = partitioner.sanitize_key("2024")
}

pub fn sanitize_year_month_test() {
  let assert "2024-03" = partitioner.sanitize_key("2024-03")
}

pub fn sanitize_topic_already_clean_test() {
  let assert "machine-learning" = partitioner.sanitize_key("machine-learning")
}

// ---------------------------------------------------------------------------
// make_filename
// ---------------------------------------------------------------------------

pub fn make_filename_substitutes_key_test() {
  let assert "stars/rust.md" =
    partitioner.make_filename("stars/{key}.md", "Rust")
}

pub fn make_filename_cpp_test() {
  let assert "stars/cpp.md" = partitioner.make_filename("stars/{key}.md", "C++")
}

// ---------------------------------------------------------------------------
// validate_path
// ---------------------------------------------------------------------------

pub fn validate_path_rejects_traversal_test() {
  let repo_root = "/home/user/repo"
  let assert Error(errors.SecurityError(_)) =
    config.validate_path("stars/../../etc/passwd", repo_root, "output")
}

pub fn validate_path_rejects_absolute_outside_test() {
  let repo_root = "/home/user/repo"
  let assert Error(errors.SecurityError(_)) =
    config.validate_path("/etc/passwd", repo_root, "output")
}

pub fn validate_path_accepts_normal_test() {
  let repo_root = "/home/user/repo"
  let assert Ok(_) = config.validate_path("stars/rust.md", repo_root, "output")
}

// ---------------------------------------------------------------------------
// Full chain: sanitize_key → make_filename → validate_path
// ---------------------------------------------------------------------------

pub fn full_chain_language_test() {
  let repo_root = "/home/user/repo"
  let filename = partitioner.make_filename("stars/{key}.md", "Rust")
  let assert Ok(_) = config.validate_path(filename, repo_root, "output")
}

pub fn full_chain_cpp_test() {
  let repo_root = "/home/user/repo"
  let filename = partitioner.make_filename("stars/{key}.md", "C++")
  let assert Ok(_) = config.validate_path(filename, repo_root, "output")
}

pub fn full_chain_dotnet_test() {
  let repo_root = "/home/user/repo"
  let filename = partitioner.make_filename("stars/{key}.md", ".NET")
  let assert Ok(_) = config.validate_path(filename, repo_root, "output")
}
