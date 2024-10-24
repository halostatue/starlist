import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve as resolvePath } from 'node:path'
import * as core from '@actions/core'

import { resolve } from './config.js'
import * as git from './git.js'
import * as markdown from './markdown.js'
import * as stars from './stars.js'
import * as template from './template.js'

import type { GeneratedFile } from './types.js'

export async function main() {
  const config = await resolve()

  core.debug(`Resolved configuration: ${config}`)

  const files: GeneratedFile[] = []

  template.compile(
    readFileSync(config.template.source.path, 'utf8'),
    config.template.source.name,
  )

  await git.setup(config)
  await git.pull(config.git.pullFlags)

  const response = await stars.getStars(config)

  if (config.stars.source === 'api') {
    git.add(config.stars.filename)
  }

  const vars = stars.resolveResponse(response, config)

  const rendered = template.render(vars)
  files.push({
    filename: config.output.filename,
    data: await markdown.generate(rendered),
  })

  console.debug('Rendered template')

  // Security check: ensure that each filename would end up in the git repository so that
  // we do not chance writing something out of tree.
  for (const file of files) {
    const filename = resolvePath(file.filename)

    if (!filename.startsWith(git.root)) {
      throw new Error(`${filename} outside of git repo`)
    }

    const parent = dirname(filename)

    if (parent !== git.root) {
      mkdirSync(dirname(filename), { recursive: true })
    }

    if (file.data) {
      writeFileSync(file.filename, file.data)
    }

    await git.add(filename)
  }

  await git.commit(config.git.commitMessage)
  await git.push()
}

export async function run(): Promise<void> {
  try {
    await main()
  } catch (error) {
    core.setFailed(`#run: ${error}`)
  }
}

const catchAll = (info: string) => {
  core.setFailed(`#catchAll: ${info}`)
  core.error(info)
}

process.on('unhandledRejection', catchAll)
process.on('uncaughtException', catchAll)

run().catch(core.error)
