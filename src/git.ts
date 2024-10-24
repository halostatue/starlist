// Derived from simonecorsi/mawesome:src/git.ts which was derived from
// TriPSs/conventional-changelog-action:src/helpers/git.js.

import * as core from '@actions/core'

import type { Config } from './config.ts'
import { execGit } from './exec.js'

const DEFAULT_BRANCH = (
  process.env.GITHUB_REF
    ? process.env.GITHUB_REF
    : await execGit(['rev-parse', '--symbolic-full-name', 'HEAD'], { trim: true })
).replace('refs/heads/', '')

const LOCAL_TESTING = core.getBooleanInput('git_local')

const PULL_UNSHALLOW =
  (await execGit(['rev-parse', '--is-shallow-repository'], { trim: true })) === 'true'
    ? '--unshallow'
    : ''

export const root = await execGit(['rev-parse', '--show-toplevel'], { trim: true })

export const setup = async ({ token, git }: Config) => {
  const repo = await resolveRepoName()

  // Set config
  await gitSetConfig('user.name', git.name)
  await gitSetConfig('user.email', git.email)
  await gitSetConfig('pull.rebase', 'false')

  // Update the origin
  await gitUpdateOrigin(`https://x-access-token:${token}@github.com/${repo}.git`)
}

export const add = async (input: string | string[]) => {
  if (!LOCAL_TESTING) {
    await execGit(Array.isArray(input) ? ['add', ...input] : ['add', input])
  }
}

export const commit = async (message: string) => {
  if (!LOCAL_TESTING) {
    await execGit(['commit', '-m', message])
  }
}

export const pull = async (flags?: string) => {
  if (!LOCAL_TESTING) {
    await execGit(['pull', '--tags', flags ?? '', PULL_UNSHALLOW].filter((v) => v))
  }
}

export const push = async (branch?: string) => {
  if (!LOCAL_TESTING) {
    await execGit(['push', 'origin', branch || DEFAULT_BRANCH, '--follow-tags'])
  }
}

const gitSetConfig = async (prop: string, value: string) => {
  if (!LOCAL_TESTING) {
    await execGit(['config', '--local', prop, value])
  }
}

const gitUpdateOrigin = async (repo: string) => {
  if (!LOCAL_TESTING) {
    await execGit(['remote', 'set-url', 'origin', repo])
  }
}

const REPO_MATCH = [
  'https://github.com/(?<http>[^/]+/[^.]+)\\.git',
  '(?:ssh+)?git@github.com:(?<ssh>[^/]+/[^.]+).git',
].join('|')

const resolveRepoName = async (): Promise<string> => {
  if (typeof process.env.GITHUB_REPOSITORY === 'string') {
    return process.env.GITHUB_REPOSITORY
  }

  const url = await execGit(['remote', 'get-url', 'origin'], { trim: true })
  const match = url.match(REPO_MATCH)

  if (match?.groups?.https || match?.groups?.ssh) {
    return match?.groups?.https || match?.groups?.ssh
  }

  const message = 'GITHUB_REPOSITORY is not set and the origin URL is not a GitHub URL'
  core.error(message)
  throw new Error(message)
}
