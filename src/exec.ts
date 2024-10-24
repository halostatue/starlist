import { exec as _exec } from '@actions/exec'

interface Opts {
  trim?: boolean
}

interface Results {
  exitCode: number
  stdout: string
}

interface GitOpts extends Opts {
  allowError?: boolean
  gitDir?: string
}

export const exec = async (
  command: string,
  args?: string[],
  opts: Opts = {},
): Promise<Results> => {
  let stdout = ''

  const options = {
    listeners: {
      stdout: (data: Buffer) => {
        stdout += data.toString()
      },
    },
  }

  const exitCode = await _exec(command, args, options)

  return { exitCode, stdout: opts.trim ? stdout.trim().replace('\n', '') : stdout }
}

export const execGit = async (args: string[], opts: GitOpts = {}): Promise<string> => {
  const subcommand = args[0]

  if (opts.gitDir) {
    args.unshift('-C', opts.gitDir)
  }

  const { exitCode, stdout } = await exec('git', args, opts)

  if (exitCode === 0 || opts.allowError) {
    return stdout
  }

  throw new Error(`Command "git ${subcommand} ..." exited with code ${exitCode}.`)
}
