/**
 * Configuration options.
 */
export interface Options {
  dateTime: DateTimeOptions
  git: GitOptions
  loadStarsFromJson: boolean
  outputFilename: string
  templateName: string
  templatePath: string
  token: string
}

export interface DateTimeOptions {
  locale: 'iso' | string
  timeZone: string
  date?: Intl.DateTimeFormat
  time?: Intl.DateTimeFormat
}

export interface GitOptions {
  commitMessage: string
  email: string
  name: string
  pullOptions: string
  readOnly: boolean
}

export interface Timestamp {
  date: string
  time: string
}

export interface Viewer {
  login: string
  truncated: boolean
  total: number
  stars: StarredRepo[]
  updatedAt: Timestamp
}

export interface TemplateVars extends Viewer {
  byLanguage: LanguageGroups
  byTopic: TopicGroups
  languages: string[]
  topics: Topic[]
}

export interface Language {
  name: string
  percent: number
}

export interface Topic {
  name: string
  url: string
}

export interface Release {
  name: string
  publishedOn: Timestamp
}

export interface StarredRepo {
  archivedOn: Timestamp | null
  description: string | null
  forks: number
  homepageUrl: string | null
  isFork: boolean
  isTemplate: boolean
  languageCount: number
  languages: Language[]
  latestRelease: Release | null
  license: string
  name: string
  parentRepo: string | null
  pushedOn: Timestamp
  starredOn: Timestamp
  stars: number
  topicCount: number
  topics: Topic[] | null
  url: string
}

export type LanguageGroups = {
  [key: string]: StarredRepo[]
}

export type TopicGroups = {
  [key: string]: {
    entries: StarredRepo[]
    url: string
  }
}

export interface GeneratedFile {
  filename: string
  data?: string
}
