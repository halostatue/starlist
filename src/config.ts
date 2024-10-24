import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import * as core from '@actions/core'
import yaml from 'yaml'

import { root } from './git.js'

import type { DateTimeOptions, Options } from './types.js'

export const config = async (): Promise<Options> => {
  const token = core.getInput('token', { required: true })
  core.setSecret(token)

  const dateTime = resolveDateTime()
  const { templateName, templatePath } = await resolveTemplate()

  const options = {
    dateTime,
    git: {
      commitMessage:
        core.getInput('git_commit_message') || 'chore(updates): updated entries in files',
      email: core.getInput('git_email') || 'actions@users.noreply.github.com',
      name: core.getInput('git_name') || 'GitHub Actions',
      pullOptions: core.getInput('git_pull_options'),
      readOnly: core.getInput('git_read_only') === 'true',
    },
    loadStarsFromJson: core.getInput('load_stars_from_json') === 'true',
    outputFilename: core.getInput('output_filename') || 'README.md',
    templateName,
    templatePath,
    token,
  }

  if (options.loadStarsFromJson && !existsSync('data.json')) {
    console.info(
      'load_stars_from_json has been set but the data does not exist; falling back to the GitHub API',
    )
    options.loadStarsFromJson = false
  }

  core.debug(`Resolved options: ${JSON.stringify(options)}`)

  return options
}

const resolveTemplate = async (): Promise<{
  templateName: string
  templatePath: string
}> => {
  const wanted = core.getInput('template_path') || 'TEMPLATE.md.njk'

  // Try to resolve the template with respect to the git root directory first.
  const gitRoot = await root()
  const inRoot = resolve(gitRoot, wanted)

  if (existsSync(inRoot)) {
    return {
      templateName: inRoot.replace(new RegExp(`^${gitRoot}/?`), ''),
      templatePath: inRoot,
    }
  }

  // The template does not exist in the git root, so we need to find it relative to the
  // action repo.
  const inActionPath = resolve(import.meta.dirname, '..')
  const inAction = resolve(inActionPath, wanted)

  if (existsSync(inAction)) {
    return {
      templateName: inAction.replace(new RegExp(`^${inActionPath}/?`), 'action:'),
      templatePath: inAction,
    }
  }

  throw new Error(
    `Cannot find template path ${wanted} in the current repository or in halostatue/starlist`,
  )
}

const resolveDateTime = (): DateTimeOptions => {
  const value = yaml.parse(core.getInput('date_time'))

  if (!value) {
    return { locale: 'iso', timeZone: 'UTC' }
  }

  const locale = value?.locale || 'iso'
  const timeZone = value?.timeZone || 'UTC'

  if (locale === 'iso') {
    return { locale, timeZone }
  }

  const dopt: Partial<Intl.DateTimeFormatOptions> = { timeZone }
  const topt: Partial<Intl.DateTimeFormatOptions> = { timeZone }

  if ('calendar' in value) {
    dopt.calendar = value.calendar
    topt.calendar = value.calendar
  }

  if ('numberingSystem' in value) {
    dopt.numberingSystem = value.numberingSystem
    topt.numberingSystem = value.numberingSystem
  }

  if ('hour12' in value) {
    dopt.hour12 = value.hour12
    topt.hour12 = value.hour12
  }

  if ('hourCycle' in value) {
    dopt.hourCycle = value.hourCycle
    topt.hourCycle = value.hourCycle
  }

  if ('dateStyle' in value) {
    dopt.dateStyle = value.dateStyle
  } else {
    if ('weekday' in value) {
      dopt.weekday = value.weekday
    }

    if ('era' in value) {
      dopt.era = value.era
    }

    if ('year' in value) {
      dopt.year = value.year
    }

    if ('month' in value) {
      dopt.month = value.month
    }

    if ('day' in value) {
      dopt.day = value.day
    }
  }

  if ('timeStyle' in value) {
    topt.timeStyle = value.timeStyle
  } else {
    if ('dayPeriod' in value) {
      topt.dayPeriod = value.dayPeriod
    }

    if ('hour' in value) {
      topt.hour = value.hour
    }

    if ('minute' in value) {
      topt.minute = value.minute
    }

    if ('second' in value) {
      topt.second = value.second
    }

    if ('fractionalSecondDigits' in value) {
      topt.fractionalSecondDigits = value.fractionalSecondDigits
    }

    if ('timeZoneName' in value) {
      topt.timeZoneName = value.timeZoneName
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

  return { locale, timeZone, date, time }
}
