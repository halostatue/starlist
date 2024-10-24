import type {
  Repository as Repo,
  Language as RepoLanguage,
  Release as RepoRelease,
  StarredRepositoryEdge as RepoStar,
  RepositoryTopic as RepoTopic,
} from '@octokit/graphql-schema'

/**
 * A minimally processed query response that flattens subquery values, but otherwise
 * matches the GraphQL response. It must be parsed into a `TemplateVars` value.
 */
export interface QueryResponse {
  /**
   * The current data version, used to validate that the local source files match what is
   * expected from the parser.
   *
   * Versions should be considered strictly incompatible.
   */
  dataVersion: number

  /**
   * The user login for the response.
   */
  login: string

  /**
   * Indicates whether the response list of stars is truncated because the user is
   * considered `isOverLimit`.
   */
  truncated: boolean

  /**
   * The total number of stars recorded for the user.
   */
  total: number

  /**
   * The list of starred repositories from the query.
   */
  stars: ResponseRepo[]

  /**
   * An ISO timestamp string when the query request was started.
   */
  updatedAt: string
}

export interface ResponseRepo {
  archivedOn: Repo['archivedAt']
  description: Repo['description']
  forks: Repo['forkCount']
  homepageUrl: Repo['homepageUrl']
  isFork: Repo['isFork']
  isTemplate: Repo['isTemplate']
  languageCount: number
  languages: { name: RepoLanguage['name']; percent: number }[]
  latestRelease?: { name: RepoRelease['name']; publishedOn: RepoRelease['publishedAt'] }
  license: string
  name: Repo['name']
  parentRepo?: string
  pushedOn: Repo['pushedAt']
  starredOn: RepoStar['starredAt']
  stars: Repo['stargazerCount']
  topicCount: number
  topics?: { name: RepoTopic['topic']['name']; url: RepoTopic['url'] }[]
  url: Repo['url']
}

export interface TemplateVars {
  dataVersion: number
  updatedAt: Timestamp
  generatedAt: Timestamp

  login: string
  truncated: boolean
  total: number
  stars: StarredRepo[]

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
  name: string | null
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

export interface Timestamp {
  date: string
  time: string
}
