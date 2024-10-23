// original content by: https://github.com/TriPSs/conventional-changelog-action/blob/master/src/helpers/git.js

import { writeFileSync } from 'node:fs'
import * as core from '@actions/core'
import { exec } from '@actions/exec'

import type { GeneratedFile, GitOptions, Options } from './types.js'

interface GitContext extends GitOptions {
  branch: string
  isShallow: boolean
}

let gitContext: GitContext | undefined

export const setup = async (opts: Options): Promise<void> => {
  const repo = await resolveRepoName()
  const branch = await getBranch(process.env.GITHUB_REF)

  const isShallow = await execGit(['rev-parse', '--is-shallow-repository'], {
    trim: true,
  })

  gitContext = {
    ...opts.git,
    branch,
    isShallow: isShallow === 'true',
  }

  core.debug(`Configured gitContext: ${JSON.stringify(gitContext)}`)

  // Set config
  await gitSetConfig('user.name', opts.git.name, opts.git.readOnly)
  await gitSetConfig('user.email', opts.git.email, opts.git.readOnly)
  await gitSetConfig('pull.rebase', 'false', opts.git.readOnly)

  // Update the origin
  await gitUpdateOrigin(
    `https://x-access-token:${opts.token}@github.com/${repo}.git`,
    opts.git.readOnly,
  )
}

export const root = async () => {
  return execGit(['rev-parse', '--show-toplevel'], { trim: true })
}

export const add = async (input: string | string[]) =>
  await execGit(Array.isArray(input) ? ['add', ...input] : ['add', input])

export const commit = async (message: string) => await execGit(['commit', '-m', message])

export const pull = async () =>
  await execGit(
    [
      'pull',
      '--tags',
      gitContext?.pullOptions ?? '',
      gitContext?.isShallow ? '--unshallow' : '',
    ].filter((v) => v),
  )

export const push = async () => {
  if (!gitContext?.branch) {
    throw new Error('Cannot push: missing context branch')
  }

  return await execGit(['push', 'origin', gitContext.branch, '--follow-tags'])
}

export const createTag = async (tag: string) =>
  await execGit(['tag', '-a', tag, '-m', tag])

export const pushFiles = async (files: GeneratedFile[] = [], commitMessage?: string) => {
  if (!commitMessage && !gitContext?.commitMessage) {
    throw new Error('Cannot push files without a commit message')
  }

  if (!files.length) {
    return
  }

  await pull()

  for (const file of files) {
    if (file.data) {
      writeFileSync(file.filename, file.data)
    }
  }

  await add(files.map(({ filename }) => filename))
  await commit(commitMessage ?? gitContext?.commitMessage ?? 'Default commit message')
  await push()
}

const getBranch = async (maybeRef?: string): Promise<string> => {
  const ref =
    maybeRef == null
      ? await execGit(['rev-parse', '--symbolic-full-name', 'HEAD'], { trim: true })
      : maybeRef
  return ref.replace(/^refs\/heads\//, '')
}

const gitSetConfig = async (prop: string, value: string, readOnly: boolean) => {
  if (!readOnly) {
    await execGit(['config', '--local', prop, value])
  }
}

const gitUpdateOrigin = async (repo: string, readOnly: boolean) => {
  if (!readOnly) {
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

const execGit = async (
  args: string[],
  opts: { trim: boolean } = { trim: false },
): Promise<string> => {
  switch (args[0]) {
    case 'config':
    case 'remote':
    case 'rev-parse': {
      // These subcommands do not require gitContext and are used to configure gitContext.
      showGit(args)
      break
    }
    default: {
      if (!gitContext) {
        throw new Error(unready(args[0]))
      }

      showGit(args)
    }
  }

  let execOutput = ''

  const options = {
    listeners: {
      stdout: (data: Buffer) => {
        execOutput += data.toString()
      },
    },
  }

  const exitCode = await exec('git', args, options)

  if (exitCode === 0) {
    return opts.trim ? execOutput.trim().replace('\n', '') : execOutput
  }

  core.error(`Command "git ${args[0]}" exited with code ${exitCode}.`)
  throw new Error(`Command "git ${args[0]}" exited with code ${exitCode}.`)
}

const showGit = (args: string[]): void => {
  const printable = args.map((v) => (v.indexOf(' ') > -1 ? `"${v}"` : v)).join(' ')
  core.debug(`git ${printable}`)
}

const unready = (fn: string): string => {
  const message = `Must call git.setup() before calling ${fn}`
  core.error(message)

  return message
}
