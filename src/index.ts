import * as core from '@actions/core';
import { readdir, readFile } from 'fs/promises';

import {
  renderer,
  REPO_USERNAME,
  generateMd,
  pushNewFiles,
  MARKDOWN_FILENAME,
  apiGetStar,
} from './helpers';

import type { SortedLanguageList, Stars, Star } from './types';

export async function main(): Promise<any> {
  const results: Stars = await apiGetStar();

  const sortedByLanguages = results.reduce(
    (acc: SortedLanguageList, val: Star) => {
      const language = val.language || 'generic';
      if (!acc[language]) {
        acc[language] = [val];
      } else {
        acc[language].push(val);
      }
      return acc;
    },
    {}
  );

  // get template if found in the repo
  let template;
  try {
    const dir = await readdir('./');
    core.info(dir.join('\n'));
    template = await readFile('TEMPLATE.ejs', 'utf8');
    core.info(template);
  } catch {
    core.warning("Couldn't find template file, using default");
  }

  const rendered = await renderer(
    {
      username: REPO_USERNAME,
      stars: Object.entries(sortedByLanguages),
      updatedAt: Date.now(),
    },
    template
  );

  const markdown: string = await generateMd(rendered);

  await pushNewFiles([
    {
      filename: MARKDOWN_FILENAME,
      data: markdown,
    },
    {
      filename: 'data.json',
      data: JSON.stringify(sortedByLanguages, null, 2),
    },
  ]);
}

export async function run(): Promise<any> {
  try {
    await main();
  } catch (error) {
    core.setFailed(`#run: ${error}`);
  }
}

const catchAll = (info: any) => {
  core.setFailed(`#catchAll: ${info}`);
};
process.on('unhandledRejection', catchAll);
process.on('uncaughtException', catchAll);

run();
