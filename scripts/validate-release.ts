import {runGit} from './run-git';

/*
 * Constants.
 */

const MAIN_BRANCH = 'main';
const ORIGIN_MAIN = `origin/${MAIN_BRANCH}`;

/*
 * Script.
 */

const branch = runGit(['branch', '--show-current']);
if (branch !== MAIN_BRANCH) {
  throw new Error(`Releases must be prepared from \`${MAIN_BRANCH}\`, not \`${branch || 'detached HEAD'}\`.`);
}

if (runGit(['status', '--porcelain'])) {
  throw new Error('Releases require a clean working tree.');
}

runGit(['fetch', '--quiet', 'origin', MAIN_BRANCH]);

const head = runGit(['rev-parse', 'HEAD']);
const originMain = runGit(['rev-parse', ORIGIN_MAIN]);
if (head !== originMain) {
  throw new Error(`Local \`${MAIN_BRANCH}\` must exactly match \`${ORIGIN_MAIN}\` before releasing.`);
}

console.info(`Release source verified at ${head.slice(0, 12)}.`);
