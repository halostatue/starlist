import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import * as core from '@actions/core'
import { Octokit as BaseOctokit } from '@octokit/core'
import { paginateGraphQL } from '@octokit/plugin-paginate-graphql'
import { throttling } from '@octokit/plugin-throttling'

import timestamp from './timestamp.js'

import type {
  LanguageConnection,
  LanguageEdge,
  RepositoryTopic,
  RepositoryTopicConnection,
  StarredRepositoryEdge,
  User,
} from '@octokit/graphql-schema'
import type { Config } from './config.js'
import type {
  Language,
  LanguageGroups,
  QueryResponse,
  Release,
  ResponseRepo,
  StarredRepo,
  TemplateVars,
  Topic,
  TopicGroups,
} from './types.js'

export const DATA_VERSION = 1

const Octokit = BaseOctokit.plugin(paginateGraphQL).plugin(throttling)

export const getStars = async (config: Config): Promise<QueryResponse> => {
  if (config.stars.source === 'file') {
    const response = await loadStarsFromFile(config)

    if (response) {
      return response
    }
  }

  return await queryStarsFromAPI(config)
}

const loadStarsFromFile = async (config: Config): Promise<QueryResponse | undefined> => {
  if (!existsSync(config.stars.filename)) {
    core.warning(
      `config.stars.source is file, but ${config.stars.filename} does not exist`,
    )
    return
  }

  const data = JSON.parse(readFileSync(config.stars.filename, 'utf-8'))

  if (isValidQueryResponse(data)) {
    console.info(`Loaded star data from ${config.stars.filename}`)
    return data as QueryResponse
  }

  core.warning(
    `config.stars.source is file, but ${config.stars.filename} is not the correct version`,
  )

  return
}

const queryStarsFromAPI = async (config: Config): Promise<QueryResponse> => {
  const octokit = new Octokit({
    auth: config.token,
    throttle: {
      onRateLimit: (retryAfter, _options, _octokit, retryCount) => {
        core.warning('Request quota exhausted for star retrieval')

        if (retryCount < 3) {
          core.info(
            `Retrying after ${retryAfter} seconds (${3 - retryCount} retries left)`,
          )
          return true
        }

        core.error('Primary request retries exhausted')
      },
      onSecondaryRateLimit(retryAfter, _options, _octokit, retryCount) {
        core.warning('Secondary rate limit detected for star retrieval')

        if (retryCount < 3) {
          core.info(
            `Retrying after ${retryAfter} seconds (${3 - retryCount} retries left)`,
          )
          return true
        }

        core.error('Secondary request retries exhausted')
      },
    },
  })

  const { viewer } = await octokit.graphql.paginate<{ viewer: User }>(Query)

  if (!viewer) {
    throw new Error('Missing current viewer for stargazing')
  }

  const { starredRepositories } = viewer

  if (!starredRepositories || !starredRepositories.edges) {
    throw new Error('Missing current viewer starred repositories')
  }

  const response: QueryResponse = {
    dataVersion: DATA_VERSION,
    login: viewer.login,
    stars: [],
    total: starredRepositories.totalCount,
    truncated: starredRepositories.isOverLimit,
    updatedAt: new Date().toISOString(),
  }

  for (const edge of starredRepositories.edges) {
    // Skip private starred repositories
    if (!edge || edge.node.isPrivate) {
      continue
    }

    response.stars.push(parseResponseRepo(edge, config))
  }

  writeFileSync(config.stars.filename, JSON.stringify(response))

  console.info(`Loaded star data from GitHub API and saved as ${config.stars.filename}`)

  return response
}

const isValidQueryResponse = (input: unknown): QueryResponse | undefined => {
  if (
    input &&
    typeof input === 'object' &&
    'dataVersion' in input &&
    input.dataVersion === DATA_VERSION
  ) {
    return input as QueryResponse
  }

  return undefined
}

export const resolveResponse = (
  response: QueryResponse,
  config: Config,
): TemplateVars => {
  const stars = response.stars.map((repo) => resolveResponseRepo(repo, config))
  const byLanguage = groupByMainLanguage(stars)
  const byTopic = groupByTopics(stars)
  const languages = Object.keys(byLanguage).sort()
  const topics = Object.keys(byTopic)
    .sort()
    .map((name): Topic => ({ name, url: byTopic[name].url }))

  return {
    dataVersion: response.dataVersion,
    updatedAt: timestamp(config, response.updatedAt),
    generatedAt: timestamp(config),

    login: response.login,
    truncated: response.truncated,
    total: response.total,
    stars,

    byLanguage,
    byTopic,
    languages,
    topics,
  }
}

const resolveResponseRepo = (repo: ResponseRepo, config: Config): StarredRepo => {
  return {
    archivedOn: repo.archivedOn ? timestamp(config, repo.archivedOn) : null,
    description: repo.description || null,
    forks: repo.forks,
    homepageUrl: repo.homepageUrl || null,
    isFork: repo.isFork,
    isTemplate: repo.isTemplate,
    languageCount: repo.languageCount,
    languages: repo.languages,
    latestRelease: resolveResponseRelease(repo.latestRelease, config),
    license: repo.license,
    name: repo.name,
    parentRepo: repo.parentRepo || null,
    pushedOn: timestamp(config, repo.pushedOn),
    starredOn: timestamp(config, repo.starredOn),
    stars: repo.stars,
    topicCount: repo.topicCount,
    topics: repo.topics || null,
    url: repo.url,
  }
}

const resolveResponseRelease = (
  release: ResponseRepo['latestRelease'],
  config: Config,
): Release | null => {
  if (!release) {
    return null
  }

  return {
    name: release.name || null,
    publishedOn: timestamp(config, release.publishedOn),
  }
}

const groupByMainLanguage = (stars: StarredRepo[]): LanguageGroups =>
  stars.reduce((acc: LanguageGroups, repo: StarredRepo): LanguageGroups => {
    const { name } = repo.languages[0]
    acc[name] ||= []
    acc[name].push(repo)

    return acc
  }, {})

const groupByTopics = (stars: StarredRepo[]): TopicGroups =>
  stars.reduce((acc: TopicGroups, repo: StarredRepo): TopicGroups => {
    if (repo.topics == null) {
      acc['no-topics'] ||= { url: '#', entries: [] }
      acc['no-topics'].entries.push(repo)
      return acc
    }

    for (const { name, url } of repo.topics) {
      acc[name] ||= { url: url, entries: [] }
      acc[name].entries.push(repo)
    }

    return acc
  }, {})

const parseResponseRepo = (edge: StarredRepositoryEdge, config: Config): ResponseRepo => {
  const { node } = edge

  const { count: languageCount, languages } = parseResponseRepoLanguages(
    node.languages,
    config,
  )
  const { count: topicCount, topics } = parseResponseRepoTopics(
    node.repositoryTopics,
    config,
  )

  return {
    archivedOn: node.archivedAt,
    description: node.description,
    forks: node.forkCount,
    homepageUrl: node.homepageUrl,
    isFork: node.isFork,
    isTemplate: node.isTemplate,
    languageCount,
    languages,
    latestRelease: node.latestRelease
      ? { name: node.latestRelease.name, publishedOn: node.latestRelease.publishedAt }
      : undefined,
    license: node.licenseInfo?.nickname || node.licenseInfo?.spdxId || 'Unknown license',
    name: node.nameWithOwner,
    parentRepo: node.parent?.nameWithOwner,
    pushedOn: node.pushedAt,
    starredOn: edge.starredAt,
    stars: node.stargazerCount,
    topicCount,
    topics,
    url: node.url,
  }
}

const parseResponseRepoLanguages = (
  languages: LanguageConnection | null | undefined,
  _config: Config,
): { count: number; languages: Language[] } => {
  if (languages == null || languages.edges == null || languages.totalCount === 0) {
    return { count: 1, languages: [{ name: 'Unclassified', percent: 100 }] }
  }

  const { totalCount, totalSize, edges } = languages

  const entries: Language[] = edges
    .filter((edge) => edge != null)
    .map(
      ({ node, size }: LanguageEdge): Language => ({
        name: node.name,
        percent: Math.round((size / totalSize) * 100),
      }),
    )

  return { count: totalCount, languages: entries }
}

const parseResponseRepoTopics = (
  topics: RepositoryTopicConnection | null | undefined,
  _config: Config,
): { count: number; topics: Topic[] | undefined } => {
  if (topics == null || topics.nodes == null) {
    return { count: 0, topics: undefined }
  }

  const { totalCount, nodes } = topics

  const entries: Topic[] = nodes
    .filter((node) => node != null)
    .map(({ topic, url }: RepositoryTopic): Topic => ({ name: topic.name, url }))

  return { count: totalCount, topics: entries }
}

const Query = `query GetViewerStargazers($cursor: String) {
  viewer {
    login

    starredRepositories(first: 40, after: $cursor) {
      isOverLimit
      totalCount

      pageInfo { endCursor hasNextPage }

      edges {
        node {
          archivedAt
          description
          forkCount
          homepageUrl
          url
          isFork
          isPrivate
          isTemplate

          languages(first: 5, orderBy: { direction: DESC, field: SIZE }) {
            edges {
              node {
                name
              }
              size
            }

            totalCount
            totalSize
          }

          latestRelease { name publishedAt }
          licenseInfo { nickname spdxId }
          nameWithOwner
          parent { nameWithOwner }
          pushedAt

          repositoryTopics(first: 20) {
            totalCount
            nodes {
              topic { name }
              url
            }
          }

          stargazerCount
        }

        starredAt
      }
    }
  }
}`
