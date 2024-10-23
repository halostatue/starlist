import { readFileSync, writeFileSync } from 'node:fs'
import * as core from '@actions/core'

import { config } from './config.js'
import * as git from './git.js'
import * as markdown from './markdown.js'
import { getStars, groupByFirstLanguage, groupByTopics } from './stars.js'
import * as template from './template.js'

import type { GeneratedFile, TemplateVars, Topic, Viewer } from './types.js'

export async function main() {
  const options = await config()

  const files: GeneratedFile[] = []
  let viewer: Viewer

  template.compile(readFileSync(options.templatePath, 'utf8'), options.templateName)

  await git.setup(options)

  if (options.loadStarsFromJson) {
    const data = readFileSync('data.json', 'utf-8')
    viewer = JSON.parse(data) as Viewer

    console.info('Loaded star data from data.json')
  } else {
    viewer = await getStars(options)

    // Write `data.json` immediately on retrieval, and add the file for pushing.
    writeFileSync('data.json', JSON.stringify(viewer))
    files.push({ filename: 'data.json' })

    console.info('Loaded star data from GitHub API and saved as data.json')
  }

  const byLanguage = groupByFirstLanguage(viewer.stars)
  const byTopic = groupByTopics(viewer.stars)
  const languages = Object.keys(byLanguage).sort()
  const topics = Object.keys(byTopic)
    .sort()
    .map((name): Topic => ({ name, url: byTopic[name].url }))

  const vars: TemplateVars = {
    ...viewer,
    byLanguage,
    byTopic,
    languages,
    topics,
  }

  const rendered = template.render(vars)
  files.push({
    filename: options.outputFilename,
    data: await markdown.generate(rendered),
  })

  console.debug('Rendered template')

  await git.pushFiles(files)
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
