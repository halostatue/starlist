//// GitHub Actions entrypoint that executes the full workflow.
////
//// 1. Resolve configuration
//// 2. Git setup and pull
//// 3. Fetch (or load) stars
//// 4. Write star data and stage
//// 5. Resolve template variables
//// 6. Compile and render templates
//// 7. Write output files and stage
//// 8. Commit and push

import envoy
import gleam/int
import gleam/javascript/promise.{type Promise}
import gleam/list
import gleam/option.{None, Some}
import gleam/result
import pontil
import starlist
import starlist/config
import starlist/errors.{type StarlistError}
import starlist/star_data.{type StarData}
import starlist/types
import starlist_action/action_config
import starlist_action/action_setup

const action_name = "halostatue/starlist"

const action_version = "3.0.0"

const auto_partition_threshold = 2000

pub fn main() -> Nil {
  pontil.register_default_process_handlers()

  pontil.info(
    action_name
    <> " v"
    <> action_version
    <> "\nRunning "
    <> env_or_unset("GITHUB_ACTION_REPOSITORY")
    <> " on "
    <> env_or_unset("GITHUB_REPOSITORY"),
  )

  promise.map(run_pipeline(), fn(response) {
    case response {
      Ok(Nil) -> pontil.info("Done.")
      Error(error) -> pontil.set_failed(errors.to_string(error))
    }
    Nil
  })

  Nil
}

fn env_or_unset(name: String) -> String {
  name
  |> envoy.get
  |> result.unwrap(or: "<unset>")
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

fn run_pipeline() -> Promise(Result(Nil, StarlistError)) {
  // 1. Resolve configuration
  use config <- pontil.try_promise(action_config.resolve())
  log_config(config)
  let assert Some(token) = config.token

  // 2. Git setup and pull
  use _ <- pontil.try_promise(
    pontil.group("Git setup", fn() { setup_git(config.git, token) }),
  )

  // 3. Fetch (or load) stars
  use response <- promise.try_await(
    pontil.group_async("Fetch stars", fn() {
      fetch_stars(config.fetch, token, config.data.path)
    }),
  )

  // 4. Write star data and stage
  let public = filter_private(response)
  let data_path = config.data.path

  pontil.info(
    "Writing "
    <> data_path
    <> " ("
    <> int.to_string(star_data.fetched(public))
    <> " public)...",
  )
  use _ <- pontil.try_promise(starlist.save_star_data(data_path, public))

  // 5–6. Resolve, compile, and render templates
  let render = starlist.auto_partition(config.render, star_data.fetched(public))
  case render.partition != config.render.partition {
    True ->
      pontil.info(
        "Auto-partitioning by year ("
        <> int.to_string(star_data.fetched(public))
        <> " stars >= "
        <> int.to_string(auto_partition_threshold)
        <> ")",
      )
    False -> Nil
  }
  use files <- pontil.try_promise(
    pontil.group("Render", fn() { starlist.render(render, public) }),
  )

  // 7. Write output files
  pontil.info(
    "Writing " <> int.to_string(list.length(files)) <> " output file(s)...",
  )
  use written <- pontil.try_promise(starlist.write_files(
    files,
    render.output_dir,
  ))

  // 8. Commit and push
  pontil.group_async("Commit", fn() {
    let all_files = [data_path, ..written]
    use committed <- pontil.try_promise(starlist.commit_and_push(
      config.git.commit_message,
      all_files,
    ))
    case committed {
      False -> pontil.info("Nothing to commit, skipping push.")
      True -> Nil
    }
    promise.resolve(Ok(Nil))
  })
}

// ---------------------------------------------------------------------------
// Step helpers
// ---------------------------------------------------------------------------

fn setup_git(
  git_config: config.Git,
  token: String,
) -> Result(Nil, StarlistError) {
  use _ <- result.try(case git_config.committer {
    Some(committer) -> action_setup.setup(committer, token)
    None -> Ok(Nil)
  })
  case git_config.pull {
    Some(flags) -> starlist.pull(flags)
    None -> Ok(Nil)
  }
}

fn fetch_stars(
  fetch: config.Fetch,
  token: String,
  data_path: String,
) -> Promise(Result(StarData, StarlistError)) {
  case fetch.source {
    config.Api -> {
      pontil.info("Fetching stars from API...")
      promise.map(
        starlist.fetch_star_data(
          token,
          fetch.login,
          fetch.max_stars,
          fetch.order,
        ),
        fn(res) {
          result.map(res, fn(data) {
            pontil.info(
              "Fetched "
              <> int.to_string(star_data.fetched(data))
              <> "/"
              <> int.to_string(star_data.total(data))
              <> " stars",
            )
            data
          })
        },
      )
    }
    config.File -> {
      pontil.info("Loading stars from " <> data_path <> "...")
      promise.resolve(
        result.map(starlist.load_star_data(data_path), fn(data) {
          pontil.info(
            "Loaded "
            <> int.to_string(star_data.fetched(data))
            <> "/"
            <> int.to_string(star_data.total(data))
            <> " stars",
          )
          data
        }),
      )
    }
  }
}

fn filter_private(data: StarData) -> StarData {
  starlist.filter_repos(data, fn(r: types.Repo) { !r.is_private })
}

// ---------------------------------------------------------------------------
// starlist logging
// ---------------------------------------------------------------------------

fn log_config(config: config.Config) -> Nil {
  pontil.group("Configuration", fn() {
    pontil.info("data.path: " <> config.data.path)
    let fetch = config.fetch
    pontil.info(
      "fetch.source: "
      <> case fetch.source {
        config.Api -> "api"
        config.File -> "file"
      },
    )
    pontil.info("fetch.login: " <> option.unwrap(fetch.login, or: "@me"))
    pontil.info(
      "fetch.max_stars: "
      <> case fetch.max_stars {
        Some(n) -> int.to_string(n)
        None -> "unlimited"
      },
    )
    pontil.info(
      "fetch.order: "
      <> case fetch.order {
        config.Descending -> "descending"
        config.Ascending -> "ascending"
      },
    )
    let render = config.render
    pontil.info("render.filename: " <> render.filename)
    pontil.info("render.output_dir: " <> render.output_dir)
    pontil.info("render.template: " <> render.template)
    pontil.info("render.index_template: " <> render.index_template)
    pontil.info("render.partition: " <> partition_to_string(render.partition))
    pontil.info("render.group: " <> group_to_string(render.group))
    pontil.info("render.partition_filename: " <> render.partition_filename)
    pontil.info("render.date_time: " <> date_time_to_string(render.date_time))
    let git_config = config.git
    pontil.info("git.commit_message: " <> git_config.commit_message)
    pontil.info(
      "git.pull: "
      <> case git_config.pull {
        Some("") -> "\"\""
        Some(f) -> "\"" <> f <> "\""
        None -> "disabled"
      },
    )
    pontil.info(
      "git.committer: "
      <> case git_config.committer {
        Some(#(name, email)) -> name <> " <" <> email <> ">"
        None -> "not set"
      },
    )
  })
}

fn partition_to_string(p: config.Partition) -> String {
  case p {
    config.PartitionOff -> "off"
    config.PartitionByLanguage -> "language"
    config.PartitionByTopic -> "topic"
    config.PartitionByYear -> "year"
    config.PartitionByYearMonth -> "year-month"
  }
}

fn group_to_string(g: config.Group) -> String {
  case g {
    config.GroupByLanguage -> "language"
    config.GroupByTopic -> "topic"
    config.GroupByLicence -> "licence"
  }
}

fn date_time_to_string(dt: config.DateTimeConfig) -> String {
  case dt {
    config.IsoDateTime(tz) -> "iso (tz: " <> tz <> ")"
    config.LocaleDateTime(locale, tz, ds, ts) ->
      "locale=" <> locale <> " tz=" <> tz <> " date=" <> ds <> " time=" <> ts
  }
}
