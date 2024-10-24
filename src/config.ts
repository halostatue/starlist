import { existsSync } from 'node:fs'
import { resolve as resolvePath } from 'node:path'
import * as core from '@actions/core'
import yaml from 'yaml'

import * as git from './git.js'

export const resolve = async (): Promise<Config> => {
  const token = core.getInput('token', { required: true })
  core.setSecret(token)

  return await resolveConfig(token, core.getInput('config', { trimWhitespace: false }), {
    date_time: core.getInput('date_time', { trimWhitespace: false }),
    git_commit_message: core.getInput('git_commit_message'),
    git_email: core.getInput('git_email'),
    git_name: core.getInput('git_name'),
    git_pull_options: core.getInput('git_pull_options'),
    load_stars_from_json: core.getInput('load_stars_from_json'),
    output_filename: core.getInput('output_filename'),
    template_path: core.getInput('template_path'),
  })
}

/**
 * Resolved configuration for starlist. Most values here will be derived from the `config`
 * parameter or deprecated parameters. See each object or subobject for details.
 */
export interface Config {
  /**
   * The `token` parameter is **required** to fetch stars from the API. The GitHub Actions
   * default token cannot be used, so you must generate a [Personal Access Token][pat] and
   * then add it to the target repository's secrets configuration.
   *
   * Both classic and fine-grained PATs are supported. Classic PATs require no additional
   * OAuth scopes. Fine-grained PATs should be scoped to include the target repository and
   * the permissions `repository:contents:read-write`, `repository:metadata:read-only`,
   * and `account:starring:read-only`.
   *
   * [pat]: https://github.com/settings/tokens/new
   */
  token: string

  /**
   * Resolved general data formatting configuration.
   */
  format: FormatConfig

  /**
   * Resolved git commit configuration.
   */
  git: GitConfig

  /**
   * Resolved output configuration.
   */
  output: OutputConfig

  /**
   * Resolved stars configuration.
   */
  stars: StarsConfig

  /**
   * Resolved template configuration.
   */
  template: TemplateConfig
}

/**
 * Resolved general data formatting configuration.
 */
export interface FormatConfig {
  /**
   * Resolved date and time formatting configuration.
   */
  dateTime: DateTimeConfig
}

/**
 * Resolved date and time formatting configuration, used to change timestamp fields into
 * `Timestamp` objects with `date` and `time` fields.
 *
 * The default behaviour is `iso` mode with `UTC` timestamps.
 *
 * This is configured into one of two modes: `iso` or `locale`. In `iso` mode, timestamp
 * fields will be adjusted to the provided `timeZone` and then split into `date` and
 * `time` parts from `Date#toISOString()`. In `locale` mode, timestamp fields will be
 * formatted using [`Intl.DateTimeFormat`][idtf] objects.
 *
 * These values are pulled from the `config.format.date_time` input field or the
 * deprecated `date_time` input parameter.
 *
 * [idtf]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat
 */
export type DateTimeConfig = ISODateTimeConfig | LocaleDateTimeConfig

/**
 * ISO date time configuration.
 */
export interface ISODateTimeConfig {
  mode: 'iso'
  /**
   * The time zone to use for adjusting timestamps (which are returned as `UTC` by
   * GitHub). Defaults to `UTC`.
   */
  timeZone: string
}

/**
 * Locale date time configuration uses
 */
export interface LocaleDateTimeConfig {
  mode: 'locale'

  /**
   * The configured formatter for dates.
   */
  date: Intl.DateTimeFormat

  /**
   * The configured formatter for times.
   */
  time: Intl.DateTimeFormat
}

/**
 * Resolved git configurtion options.
 */
export interface GitConfig {
  /**
   * The commit message value to use when committing generated files.
   */
  commitMessage: string
  /**
   * The email address to use for git commits.
   */
  email: string
  /**
   * The name ot use for git commits.
   */
  name: string
  /**
   * Additional flags to provide to `git-pull`. Blank by default, supported values are any
   * parameters to `git-pull`. Note that `--tags` and `--unshallow` will be added
   * automatically as required.
   */
  pullFlags: string
}

/**
 * Resolved output configuration.
 */
export interface OutputConfig {
  /**
   * The output filename relative to the git repository or the action root.
   */
  filename: string
}

/**
 * Resolved stars configuration.
 */
export interface StarsConfig {
  /**
   * The source of the star data, either `api` or `file`. If set to `api`, the stargazing
   * data will be loaded from the GitHub API. If set to `file`, the stargazing data will
   * be loaded from the `data.json` file in the repository.
   */
  source: 'api' | 'file'

  filename: string
}

/**
 * Resolved template configuration.
 */
export interface TemplateConfig {
  /**
   * The file reference to the source.
   */
  source: FileReference
}

/**
 * A resolved file reference.
 */
export interface FileReference {
  /**
   * The name of the resolved template.
   */
  name: string

  /**
   * The full path of the resolved template.
   */
  path: string
}

// These are deprecated and will be removed for v2.
interface InputParameters {
  date_time: string
  git_commit_message: string
  git_email: string
  git_name: string
  git_pull_options: string
  load_stars_from_json: string
  output_filename: string
  template_path: string
}

const resolveConfig = async (
  token: string,
  value: string,
  inputs: InputParameters,
): Promise<Config> => {
  let base = yaml.parse(value)

  if ((base != null && typeof base !== 'object') || Array.isArray(base)) {
    core.warning('config input is not a dictionary')
    base = null
  }

  return {
    token,
    format: await resolveFormatConfig(base, inputs),
    git: await resolveGitConfig(base, inputs),
    output: await resolveOutputConfig(base, inputs),
    stars: await resolveStarsConfig(base, inputs),
    template: await resolveTemplateConfig(base, inputs),
  }
}

const resolveFormatConfig = async (
  base: object | null,
  inputs: InputParameters,
): Promise<FormatConfig> => {
  const value: unknown = base == null ? null : 'format' in base ? base.format : null
  const format = typeof value === 'object' ? value : null

  if ((value != null && typeof value !== 'object') || Array.isArray(value)) {
    core.warning('config.format is not a dictionary or null')
  }

  return {
    dateTime: await resolveDateTimeConfig(format, inputs),
  }
}

const resolveDateTimeConfig = async (
  format: object | null,
  { date_time }: InputParameters,
): Promise<DateTimeConfig> => {
  let value: unknown =
    format == null ? null : 'date_time' in format ? format.date_time : null

  if ((value != null && typeof value !== 'object') || Array.isArray(value)) {
    core.warning('config.format.date_time is not a dictionary or null')
  }

  if (value == null && date_time.trim() !== '') {
    core.warning('input date_time is deprecated, use input config format.date_time')

    value = yaml.parse(date_time)

    if ((value != null && typeof value !== 'object') || Array.isArray(value)) {
      core.warning('input date_time is not a dictionary or null')
      value = null
    }
  }

  const object = typeof value === 'object' ? value : null

  if (object == null) {
    return { mode: 'iso', timeZone: 'UTC' }
  }

  if (
    ('mode' in object && object.mode === 'iso') ||
    ('locale' in object && object.locale === 'iso')
  ) {
    return resolveISODateTimeConfig(object)
  }

  return resolveLocaleDateTimeConfig(object)
}

const resolveISODateTimeConfig = (value: object): ISODateTimeConfig => {
  return { mode: 'iso', timeZone: resolveTimeZone(value) }
}

const resolveLocaleDateTimeConfig = (value: object): LocaleDateTimeConfig => {
  let v: unknown

  if ('locale' in value) {
    v = value.locale

    if (typeof v !== 'string' || v.trim() === '') {
      core.warning('locale is not a string')
      v = null
    }
  }

  const locale = typeof v === 'string' ? v.trim() : 'en'

  const dopt: Intl.DateTimeFormatOptions = {}
  const topt: Intl.DateTimeFormatOptions = {}

  dopt.timeZone = topt.timeZone = resolveTimeZone(value)

  if ('calendar' in value) {
    dopt.calendar = topt.calendar = resolveString('calendar', value.calendar)
  }

  let ns: string | undefined

  if ('numbering_system' in value) {
    ns = resolveString('numbering_system', value.numbering_system)
  }

  if (!ns && 'numberingSystem' in value) {
    core.warning('numberingSystem is deprecated, use numbering_system')
    ns = resolveString('numberingSystem', value.numberingSystem)
  }

  dopt.numberingSystem = topt.numberingSystem = ns

  if ('hour12' in value && typeof value.hour12 === 'boolean') {
    dopt.hour12 = topt.hour12 = value.hour12
  }

  let hc: string | undefined

  if ('hour_cycle' in value) {
    hc = resolveString('hour_cycle', value.hour_cycle)
  }

  if (!hc && 'hourCycle' in value) {
    core.warning('hourCycle ihc deprecated, uhce hour_cycle')
    hc = resolveString('hourCycle', value.hourCycle)
  }

  if (hc === undefined || hc === 'h11' || hc === 'h12' || hc === 'h23' || hc === 'h24') {
    dopt.hourCycle = topt.hourCycle = hc
  }

  let ds: string | undefined

  if ('date_style' in value) {
    ds = resolveString('date_style', value.date_style)
  }

  if (!ds && 'dateStyle' in value) {
    core.warning('dateStyle is deprecated, use date_style')
    ds = resolveString('dateStyle', value.dateStyle)
  }

  if (ds === 'full' || ds === 'long' || ds === 'medium' || ds === 'short') {
    dopt.dateStyle = ds
  } else {
    if ('weekday' in value) {
      const wd = resolveString('weekday', value.weekday)
      if (wd === 'long' || wd === 'short' || wd === 'narrow') {
        dopt.weekday = wd
      }
    }

    if ('era' in value) {
      const e = resolveString('era', value.era)
      if (e === 'long' || e === 'short' || e === 'narrow') {
        dopt.era = e
      }
    }

    if ('year' in value) {
      const y = resolveString('year', value.year)
      if (y === 'numeric' || y === '2-digit') {
        dopt.year = y
      }
    }

    if ('month' in value) {
      const m = resolveString('month', value.month)
      if (
        m === 'long' ||
        m === 'short' ||
        m === 'narrow' ||
        m === 'numeric' ||
        m === '2-digit'
      ) {
        dopt.month = m
      }
    }

    if ('day' in value) {
      const d = resolveString('day', value.day)
      if (d === 'numeric' || d === '2-digit') {
        dopt.day = d
      }
    }
  }

  let ts: string | undefined

  if ('time_style' in value) {
    ts = resolveString('time_style', value.time_style)
  }

  if (!ts && 'timeStyle' in value) {
    core.warning('timeStyle is deprecated, use time_style')
    ts = resolveString('timeStyle', value.timeStyle)
  }

  if (ts === 'full' || ts === 'long' || ts === 'medium' || ts === 'short') {
    topt.timeStyle = ts
  } else {
    let dp: string | undefined

    if ('day_period' in value) {
      dp = resolveString('day_period', value.day_period)
    }

    if (!dp && 'dayPeriod' in value) {
      core.warning('dayPeriod is deprecated, use day_period')
      dp = resolveString('dayPeriod', value.dayPeriod)
    }

    if (dp === 'long' || dp === 'short' || dp === 'narrow') {
      topt.dayPeriod = dp
    }

    if ('hour' in value) {
      const h = resolveString('hour', value.hour)
      if (h === 'numeric' || h === '2-digit') {
        topt.hour = h
      }
    }

    if ('minute' in value) {
      const m = resolveString('minute', value.minute)
      if (m === 'numeric' || m === '2-digit') {
        topt.minute = m
      }
    }

    if ('second' in value) {
      const s = resolveString('second', value.second)
      if (s === 'numeric' || s === '2-digit') {
        topt.second = s
      }
    }

    let fsd: unknown

    if ('fractional_second_digits' in value) {
      fsd = value.fractional_second_digits
    }

    if (!fsd && 'fractionalSecondDigits' in value) {
      core.warning('fractionalSecondDigits is deprecated, use fractional_second_digits')
      fsd = value.fractionalSecondDigits
    }

    if (fsd === 1 || fsd === 2 || fsd === 3) {
      topt.fractionalSecondDigits = fsd
    }

    let tzn: string | undefined

    if ('time_zone_name' in value) {
      tzn = resolveString('time_zone_name', value.time_zone_name)
    }

    if (!tzn && 'timeZoneName' in value) {
      tzn = resolveString('timeZoneName', value.timeZoneName)
    }

    if (
      tzn === 'long' ||
      tzn === 'short' ||
      tzn === 'shortOffset' ||
      tzn === 'longOffset' ||
      tzn === 'shortGeneric' ||
      tzn === 'longGeneric'
    ) {
      topt.timeZoneName = tzn
    }
  }

  if (
    !dopt.dateStyle &&
    !dopt.weekday &&
    !dopt.era &&
    !dopt.year &&
    !dopt.month &&
    !dopt.day
  ) {
    dopt.dateStyle = 'short'
  }

  if (
    !topt.timeStyle &&
    !topt.dayPeriod &&
    !topt.hour &&
    !topt.minute &&
    !topt.second &&
    !topt.fractionalSecondDigits &&
    !topt.timeZoneName
  ) {
    topt.timeStyle = 'short'
  }

  const date = new Intl.DateTimeFormat(locale, dopt)
  const time = new Intl.DateTimeFormat(locale, topt)

  return { mode: 'locale', date, time }
}

const resolveTimeZone = (value: object): string => {
  let result: unknown

  if ('time_zone' in value) {
    result = value.time_zone
  }

  if (result && (typeof result !== 'string' || result.trim() === '')) {
    core.warning('time_zone is not a string')
    result = null
  }

  if (!result && 'timeZone' in value) {
    core.warning('timeZone is deprecated, use time_zone instead')
    result = value.timeZone
  }

  if (result && (typeof result !== 'string' || result.trim() === '')) {
    core.warning('timeZone is not a string')
    result = null
  }

  return typeof result === 'string' ? result.trim() : 'UTC'
}

const resolveGitConfig = async (
  base: object,
  inputs: InputParameters,
): Promise<GitConfig> => {
  let git: unknown = base == null ? null : 'git' in base ? base.git : null

  if ((git != null && typeof git !== 'object') || Array.isArray(git)) {
    core.warning('config.git is not a dictionary or null')
    git = null
  }

  let commitMessage: string | undefined
  let email: string | undefined
  let name: string | undefined
  let pullFlags: string | undefined

  if (git && typeof git === 'object' && !Array.isArray(git)) {
    if ('commit_message' in git) {
      commitMessage = resolveString('commit_message', git.commit_message)
    }

    if ('email' in git) {
      email = resolveString('email', git.email)
    }

    if ('name' in git) {
      name = resolveString('name', git.name)
    }

    if ('pull_flags' in git) {
      pullFlags = resolveString('pull_flags', git.pull_flags)
    }
  }

  if (!commitMessage && inputs.git_commit_message) {
    core.warning(
      'input git_commit_message is deprecated, use input config git.commit_message',
    )
    commitMessage = inputs.git_commit_message
  }

  if (!email && inputs.git_email) {
    core.warning('input git_email is deprecated, use input config git.email')
    email = inputs.git_email
  }

  if (!name && inputs.git_name) {
    core.warning('input git_name is deprecated, use input config git.name')
    name = inputs.git_name
  }

  if (!pullFlags && inputs.git_pull_options) {
    core.warning('input git_pull_options is deprecated, use input config git.pull_flags')
    pullFlags = inputs.git_pull_options
  }

  commitMessage = commitMessage || 'chore(updates): updated entries in files'
  email = email || 'actions@users.noreply.github.com'
  name = name || 'GitHub Actions'
  pullFlags = pullFlags || ''

  return {
    commitMessage,
    email,
    name,
    pullFlags,
  }
}

const resolveOutputConfig = async (
  base: object,
  { output_filename }: InputParameters,
): Promise<OutputConfig> => {
  let output: unknown = base == null ? null : 'output' in base ? base.output : null

  if ((output != null && typeof output !== 'object') || Array.isArray(output)) {
    core.warning('config.output is not a dictionary or null')
    output = null
  }

  let filename: string | undefined

  if (output && typeof output === 'object' && !Array.isArray(output)) {
    if ('filename' in output) {
      filename = resolveString('filename', output.filename)
    }
  }

  if (!filename && output_filename) {
    core.warning('input output_filename is deprecated, use input config output.filename')
    filename = output_filename
  }

  filename = filename || 'README.md'

  return {
    filename,
  }
}

const resolveStarsConfig = async (
  base: object,
  { load_stars_from_json }: InputParameters,
): Promise<StarsConfig> => {
  let stars: unknown = base == null ? null : 'stars' in base ? base.stars : null

  if ((stars != null && typeof stars !== 'object') || Array.isArray(stars)) {
    core.warning('config.stars is not a dictionary or null')
    stars = null
  }

  let source: 'api' | 'file' | undefined

  if (stars && typeof stars === 'object' && !Array.isArray(stars)) {
    if ('source' in stars) {
      const value = resolveString('source', stars.source)?.toLowerCase()

      if (value === 'api' || value === 'file') {
        source = value
      } else if (value) {
        core.warning('config.stars.source must be either api or file')
      }
    }
  }

  if (!source && load_stars_from_json) {
    core.warning(
      'input load_stars_from_json is deprecated, use input config source.stars enum',
    )
    source = core.getBooleanInput('load_stars_from_json') ? 'file' : 'api'
  }

  if (source === 'file' && !existsSync('data.json')) {
    core.warning(
      'source.stars is file, but the data file does not exist; falling back to api',
    )
    source = 'api'
  }

  source = source || 'api'

  return {
    source,
    filename: 'data.json',
  }
}

const resolveTemplateConfig = async (
  base: object,
  { template_path }: InputParameters,
): Promise<TemplateConfig> => {
  let template: unknown = base == null ? null : 'template' in base ? base.template : null

  if ((template != null && typeof template !== 'object') || Array.isArray(template)) {
    core.warning('config.template is not a dictionary or null')
    template = null
  }

  let source: string | undefined

  if (template && typeof template === 'object' && !Array.isArray(template)) {
    if ('source' in template) {
      source = resolveString('source', template.source)
    }
  }

  if (!source && template_path) {
    core.warning('input template_path is deprecated, use input config template.source')
    source = template_path
  }

  source = source || 'TEMPLATE.md.njk'

  return {
    source: await resolveFileReference(source),
  }
}

const resolveFileReference = async (wanted: string): Promise<FileReference> => {
  // Try to resolve the template with respect to the git root directory first.
  const inRoot = resolvePath(git.root, wanted)

  if (existsSync(inRoot)) {
    return {
      name: inRoot.replace(new RegExp(`^${git.root}/?`), ''),
      path: inRoot,
    }
  }

  // The template does not exist in the git root, so we need to find it relative to the
  // action repo.
  const inActionPath = resolvePath(import.meta.dirname, '..')
  const inAction = resolvePath(inActionPath, wanted)

  if (existsSync(inAction)) {
    return {
      name: inAction.replace(new RegExp(`^${inActionPath}/?`), 'action:'),
      path: inAction,
    }
  }

  throw new Error(
    `Cannot find template path ${wanted} in the current repository or in halostatue/starlist`,
  )
}
const resolveString = (key: string, value: unknown): string | undefined => {
  let result: string | undefined

  if (value == null) {
    result = undefined
  } else if (typeof value === 'string') {
    result = value.trim()
  } else {
    core.warning(`${key} has an invalid value: ${JSON.stringify(value)}`)
    result = undefined
  }

  if (result === '') {
    core.warning(`${key} is invalid`)
    return undefined
  }

  return result
}
