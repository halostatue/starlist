import { remark } from 'remark'
import gfm from 'remark-gfm'
import toc from 'remark-toc'

// This may return. It will be necessary to reinstall it if we do.
// import github from 'remark-github'

export const generate = async (doc: string): Promise<string> =>
  String(await remark().use(toc).use(gfm).process(doc))
