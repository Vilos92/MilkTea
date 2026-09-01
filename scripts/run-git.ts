import {join} from 'node:path';

/*
 * Constants.
 */

const repoRoot = join(import.meta.dir, '..');

/*
 * Helpers.
 */

export function runGit(args: readonly string[]): string {
  const result = Bun.spawnSync({
    cmd: ['git', ...args],
    cwd: repoRoot,
    stderr: 'pipe',
    stdout: 'pipe'
  });

  if (result.exitCode !== 0) {
    const detail = result.stderr.toString().trim();
    throw new Error(detail || `git ${args.join(' ')} failed.`);
  }

  return result.stdout.toString().trim();
}
