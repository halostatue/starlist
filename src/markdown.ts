import * as core from '@actions/core'
import { remark } from 'remark'
import toc from 'remark-toc'

export const generate = async (doc: string): Promise<string> =>
  String(await remark().use(toc).process(doc))
