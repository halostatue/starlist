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

  gitContext = {
    ...opts.git,
    branch,
    isShallow: await isShallow(),
  }

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
  return execGit('rev-parse --show-toplevel', { trim: true })
}

export const add = async (input: string | string[]) => {
  if (!gitContext) {
    throw new Error(unready('add'))
  }

  if (gitContext.readOnly) {
    return
  }

  const files = Array.isArray(input) ? input : [input]
  await execGit(`add ${files.join(' ')}`)
}

export const commit = async (message: string) => {
  if (!gitContext) {
    throw new Error(unready('commit'))
  }

  if (gitContext.readOnly) {
    return
  }

  await execGit(`commit -m "${message}"`)
}

export const pull = async () => {
  if (!gitContext) {
    throw new Error(unready('pull'))
  }

  if (gitContext.readOnly) {
    return
  }

  const args = ['pull', '--tags', gitContext.pullOptions]

  if (await isShallow()) {
    args.push('--unshallow')
  }

  execGit(args.join(' '))
}

export const push = async () => {
  if (!gitContext) {
    throw new Error(unready('push'))
  }

  if (gitContext.readOnly) {
    return
  }

  await execGit(`push origin ${gitContext.branch} --follow-tags`)
}

export const createTag = async (tag: string) => {
  if (!gitContext) {
    throw new Error(unready('createTag'))
  }

  if (gitContext.readOnly) {
    return
  }

  await execGit(`tag -a ${tag} -m "${tag}"`)
}

export const pushFiles = async (files: GeneratedFile[] = []) => {
  if (!gitContext) {
    throw new Error(unready('pushFiles'))
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
  await commit(gitContext.commitMessage)
  await push()
}

const unready = (fn: string): string => {
  const message = `Must call git.setup() before calling ${fn}`
  core.error(message)

  return message
}

const execGit = async (
  command: string,
  opts: { trim: boolean } = { trim: false },
): Promise<string> => {
  let execOutput = ''

  const options = {
    listeners: {
      stdout: (data: Buffer) => {
        execOutput += data.toString()
      },
    },
  }

  const exitCode = await exec(`git ${command}`, undefined, options)

  if (exitCode === 0) {
    return opts.trim ? execOutput.trim().replace('\n', '') : execOutput
  }

  core.error(`Command "git ${command}" exited with code ${exitCode}.`)
  throw new Error(`Command "git ${command}" exited with code ${exitCode}.`)
}

const getBranch = async (maybeRef?: string): Promise<string> => {
  const ref =
    maybeRef == null
      ? await execGit('rev-parse --symbolic-full-name HEAD', { trim: true })
      : maybeRef
  return ref.replace(/^refs\/heads\//, '')
}

const gitSetConfig = async (prop: string, value: string, readOnly: boolean) => {
  if (!readOnly) {
    await execGit(`config ${prop} "${value}"`)
  }
}

const gitUpdateOrigin = async (repo: string, readOnly: boolean) => {
  if (!readOnly) {
    await execGit(`remote set-url origin ${repo}`)
  }
}

const isShallow = async (): Promise<boolean> =>
  (await execGit('rev-parse --is-shallow-repository', { trim: true })) === 'true'

const REPO_MATCH = [
  'https://github.com/(?<http>[^/]+/[^.]+)\\.git',
  '(?:ssh+)?git@github.com:(?<ssh>[^/]+/[^.]+).git',
].join('|')

const resolveRepoName = async (): Promise<string> => {
  if (typeof process.env.GITHUB_REPOSITORY === 'string') {
    return process.env.GITHUB_REPOSITORY
  }

  const url = await execGit('remote get-url origin', { trim: true })
  const match = url.match(REPO_MATCH)

  if (match?.groups?.https || match?.groups?.ssh) {
    return match?.groups?.https || match?.groups?.ssh
  }

  const message = 'GITHUB_REPOSITORY is not set and the origin URL is not a GitHub URL'
  core.error(message)
  throw new Error(message)
}
