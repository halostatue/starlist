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
import type {
  Language,
  LanguageGroups,
  Options,
  StarredRepo,
  Topic,
  TopicGroups,
  Viewer,
} from './types.js'

const Octokit = BaseOctokit.plugin(paginateGraphQL).plugin(throttling)

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

export const getStars = async (options: Options): Promise<Viewer> => {
  const octokit = new Octokit({
    auth: options.token,
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

  const result: Viewer = {
    login: viewer.login,
    truncated: starredRepositories.isOverLimit,
    total: starredRepositories.totalCount,
    stars: [],
    updatedAt: timestamp(options.dateTime),
  }

  for (const edge of starredRepositories.edges) {
    // Skip private starred repositories
    if (!edge || edge.node.isPrivate) {
      continue
    }

    result.stars.push(parseRepo(edge, options))
  }

  return result
}

export const groupByFirstLanguage = (stars: StarredRepo[]): LanguageGroups =>
  stars.reduce((acc: LanguageGroups, repo: StarredRepo): LanguageGroups => {
    const { name } = repo.languages[0]
    acc[name] ||= []
    acc[name].push(repo)

    return acc
  }, {})

export const groupByAllLanguages = (stars: StarredRepo[]): LanguageGroups =>
  stars.reduce((acc: LanguageGroups, repo: StarredRepo): LanguageGroups => {
    for (const { name } of repo.languages) {
      acc[name] ||= []
      acc[name].push(repo)
    }

    return acc
  }, {})

export const groupByTopics = (stars: StarredRepo[]): TopicGroups =>
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

const parseRepo = (edge: StarredRepositoryEdge, options: Options): StarredRepo => {
  const { node } = edge

  const { count: languageCount, languages } = parseRepoLanguages(node.languages, options)
  const { count: topicCount, topics } = parseRepoTopics(node.repositoryTopics, options)
  const archivedOn = node.archivedAt ? timestamp(options.dateTime, node.archivedAt) : null

  return {
    archivedOn,
    description: node.description || null,
    forks: node.forkCount,
    homepageUrl: node.homepageUrl || null,
    isFork: node.isFork,
    isTemplate: node.isTemplate,
    languageCount,
    languages,
    latestRelease: node.latestRelease?.name
      ? {
          name: node.latestRelease.name || 'Unnamed',
          publishedOn: timestamp(options.dateTime, node.latestRelease.publishedAt),
        }
      : null,
    license: node.licenseInfo?.nickname || node.licenseInfo?.spdxId || 'Unknown license',
    name: node.nameWithOwner,
    parentRepo: node.parent?.nameWithOwner || null,
    pushedOn: timestamp(options.dateTime, node.pushedAt),
    starredOn: timestamp(options.dateTime, edge.starredAt),
    stars: node.stargazerCount,
    topicCount,
    topics,
    url: node.url,
  }
}

const parseRepoLanguages = (
  languages: LanguageConnection | null | undefined,
  _options: Options,
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

const parseRepoTopics = (
  topics: RepositoryTopicConnection | null | undefined,
  _options: Options,
): { count: number; topics: Topic[] | null } => {
  if (topics == null || topics.nodes == null) {
    return { count: 0, topics: null }
  }

  const { totalCount, nodes } = topics

  const entries: Topic[] = nodes
    .filter((node) => node != null)
    .map(({ topic, url }: RepositoryTopic): Topic => ({ name: topic.name, url }))

  return { count: totalCount, topics: entries }
}
