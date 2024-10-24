import { remark } from 'remark'
import gfm from 'remark-gfm'
import github from 'remark-github'
import toc from 'remark-toc'

export const generate = async (doc: string): Promise<string> =>
  String(await remark().use(toc).use(gfm).use(github).process(doc))
