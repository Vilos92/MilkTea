import type {GitHooksConfig} from 'bun-git-hooks';

const config: GitHooksConfig = {
  'pre-commit': 'bun run sort-package-json:fix && bun run prettier:fix',
  'commit-msg': 'bun commitlint --edit $1',
  'pre-push': 'bun run lint',
  verbose: true
};

export default config;
