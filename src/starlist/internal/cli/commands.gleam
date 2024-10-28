//// CLI command definitions — clip command builders and arg types.

import clip
import clip/flag
import clip/help
import clip/opt

// ---------------------------------------------------------------------------
// Arg types
// ---------------------------------------------------------------------------

pub type FetchArgs {
  FetchArgs(
    credentials_command: Result(String, Nil),
    max_stars: Result(Int, Nil),
    output: String,
  )
}

pub type GenerateArgs {
  GenerateArgs(
    input: String,
    template: String,
    dir: String,
    partition: Result(String, Nil),
    group: Result(String, Nil),
    index_template: String,
    output: String,
    partition_output: String,
    time_zone: Result(String, Nil),
    locale: Result(String, Nil),
    date_style: Result(String, Nil),
    time_style: Result(String, Nil),
  )
}

pub type CommitArgs {
  CommitArgs(message: String, push: Bool)
}

pub type Command {
  Fetch(FetchArgs)
  Generate(GenerateArgs)
  Run(fetch: FetchArgs, generate: GenerateArgs)
  Commit(CommitArgs)
}

// ---------------------------------------------------------------------------
// CLI builder
// ---------------------------------------------------------------------------

pub fn cli() -> clip.Command(Command) {
  clip.subcommands([
    #("fetch", fetch_command()),
    #("generate", generate_command()),
    #("run", run_command()),
    #("commit", commit_command()),
  ])
  |> clip.help(help.simple("starlist", "Manage GitHub star lists"))
}

// ---------------------------------------------------------------------------
// Subcommands
// ---------------------------------------------------------------------------

fn fetch_command() -> clip.Command(Command) {
  clip.command({
    use credentials_command <- clip.parameter
    use max_stars <- clip.parameter
    use output <- clip.parameter
    Fetch(FetchArgs(credentials_command:, max_stars:, output:))
  })
  |> clip.opt(
    opt.new("github-credentials-command")
    |> opt.optional
    |> opt.help("Command to run to get GitHub token"),
  )
  |> clip.opt(
    opt.new("max-stars") |> opt.int |> opt.optional |> opt.help("Max stars"),
  )
  |> clip.opt(
    opt.new("output")
    |> opt.default("data.json")
    |> opt.help("Output file"),
  )
}

fn generate_command() -> clip.Command(Command) {
  clip.command({
    use input <- clip.parameter
    use template <- clip.parameter
    use dir <- clip.parameter
    use partition <- clip.parameter
    use group <- clip.parameter
    use index_template <- clip.parameter
    use output <- clip.parameter
    use partition_output <- clip.parameter
    use time_zone <- clip.parameter
    use locale <- clip.parameter
    use date_style <- clip.parameter
    use time_style <- clip.parameter
    Generate(GenerateArgs(
      input:,
      template:,
      dir:,
      partition:,
      group:,
      index_template:,
      output:,
      partition_output:,
      time_zone:,
      locale:,
      date_style:,
      time_style:,
    ))
  })
  |> gen_opts
}

fn run_command() -> clip.Command(Command) {
  clip.command({
    use credentials_command <- clip.parameter
    use max_stars <- clip.parameter
    use input <- clip.parameter
    use template <- clip.parameter
    use dir <- clip.parameter
    use partition <- clip.parameter
    use group <- clip.parameter
    use index_template <- clip.parameter
    use output <- clip.parameter
    use partition_output <- clip.parameter
    use time_zone <- clip.parameter
    use locale <- clip.parameter
    use date_style <- clip.parameter
    use time_style <- clip.parameter
    Run(
      fetch: FetchArgs(credentials_command:, max_stars:, output: input),
      generate: GenerateArgs(
        input:,
        template:,
        dir:,
        partition:,
        group:,
        index_template:,
        output:,
        partition_output:,
        time_zone:,
        locale:,
        date_style:,
        time_style:,
      ),
    )
  })
  |> clip.opt(
    opt.new("github-credentials-command")
    |> opt.optional
    |> opt.help("Command to run to get GitHub token"),
  )
  |> clip.opt(
    opt.new("max-stars") |> opt.int |> opt.optional |> opt.help("Max stars"),
  )
  |> gen_opts
}

fn commit_command() -> clip.Command(Command) {
  clip.command({
    use message <- clip.parameter
    use push <- clip.parameter
    Commit(CommitArgs(message:, push:))
  })
  |> clip.opt(
    opt.new("message")
    |> opt.default("chore(updates): updated entries in files")
    |> opt.short("m")
    |> opt.help("Commit message"),
  )
  |> clip.flag(flag.new("push") |> flag.help("Push after commit"))
}

// ---------------------------------------------------------------------------
// Shared generate opts
// ---------------------------------------------------------------------------

fn gen_opts(cmd) {
  cmd
  |> clip.opt(
    opt.new("input") |> opt.default("data.json") |> opt.help("Input data file"),
  )
  |> clip.opt(
    opt.new("template")
    |> opt.default("templates/TEMPLATE.md.glemp")
    |> opt.help("Template file"),
  )
  |> clip.opt(opt.new("dir") |> opt.default(".") |> opt.help("Output root dir"))
  |> clip.opt(
    opt.new("partition")
    |> opt.optional
    |> opt.help("Partition: off, language, topic, year, year-month"),
  )
  |> clip.opt(
    opt.new("group")
    |> opt.optional
    |> opt.help("Group by: language, topic, licence"),
  )
  |> clip.opt(
    opt.new("index-template")
    |> opt.default("templates/INDEX.md.glemp")
    |> opt.help("Index template for multi-file"),
  )
  |> clip.opt(
    opt.new("output") |> opt.default("README.md") |> opt.help("Output filename"),
  )
  |> clip.opt(
    opt.new("partition-output")
    |> opt.default("stars/{key}.md")
    |> opt.help("Per-partition filename pattern"),
  )
  |> clip.opt(
    opt.new("time-zone") |> opt.optional |> opt.help("Timezone for timestamps"),
  )
  |> clip.opt(
    opt.new("locale")
    |> opt.optional
    |> opt.help("Locale (enables locale formatting)"),
  )
  |> clip.opt(
    opt.new("date-style") |> opt.optional |> opt.help("Date style for locale"),
  )
  |> clip.opt(
    opt.new("time-style") |> opt.optional |> opt.help("Time style for locale"),
  )
}
