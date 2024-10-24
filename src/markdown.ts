import { remark } from 'remark'
import toc from 'remark-toc'
import gfm from 'remark-gfm'
import github from 'remark-github'

export const generate = async (doc: string): Promise<string> =>
  String(await remark().use(toc).use(gfm).use(github).process(doc))
