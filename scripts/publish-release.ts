export {};

/*
 * Types.
 */

type ReleaseAsset = {
  name: string;
  size: number;
  state: string;
};

type GitHubRelease = {
  assets: ReleaseAsset[];
  draft: boolean;
  id: number;
  tag_name: string;
};

/*
 * Constants.
 */

const REPOSITORY = 'Vilos92/MilkTea';
const REQUIRED_ASSETS = [
  'install.sh',
  'install.sh.sha256',
  'MilkTea-linux-icon.png',
  'MilkTea-linux-icon.png.sha256',
  'MilkTea-linux-x86_64.AppImage',
  'MilkTea-linux-x86_64.AppImage.sha256',
  'MilkTea-linux-x86_64.deb',
  'MilkTea-linux-x86_64.deb.sha256',
  'MilkTea-macos-aarch64.dmg',
  'MilkTea-macos-aarch64.dmg.sha256',
  'MilkTea-macos-x86_64.dmg',
  'MilkTea-macos-x86_64.dmg.sha256'
] as const;
const token = process.env.GITHUB_TOKEN;
const tag = process.env.CI_COMMIT_TAG;

/*
 * Script.
 */

if (!token || !tag) {
  throw new Error('GITHUB_TOKEN and CI_COMMIT_TAG are required to publish a release.');
}

const releases = await requestGitHub<readonly GitHubRelease[]>(
  `https://api.github.com/repos/${REPOSITORY}/releases?per_page=100`
);
const release = releases.find(candidate => candidate.tag_name === tag);
if (!release) {
  throw new Error(`Could not find GitHub release ${tag}.`);
}

const assetsByName = new Map(release.assets.map(asset => [asset.name, asset]));
const missingAssets = REQUIRED_ASSETS.filter(name => {
  const asset = assetsByName.get(name);
  return !asset || asset.state !== 'uploaded' || asset.size === 0;
});
if (missingAssets.length > 0) {
  throw new Error(`Release ${tag} is incomplete: ${missingAssets.join(', ')}`);
}

if (release.draft) {
  const publishedRelease = await requestGitHub<GitHubRelease>(
    `https://api.github.com/repos/${REPOSITORY}/releases/${release.id}`,
    {
      body: JSON.stringify({draft: false, make_latest: 'true'}),
      method: 'PATCH'
    }
  );
  if (publishedRelease.draft) {
    throw new Error(`GitHub did not publish release ${tag}.`);
  }

  console.info(`Published complete release ${tag}.`);
} else {
  console.info(`Release ${tag} is already published with complete assets.`);
}

/*
 * Helpers.
 */

async function requestGitHub<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/vnd.github+json');
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');
  headers.set('X-GitHub-Api-Version', '2022-11-28');

  const response = await fetch(url, {
    ...init,
    headers
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GitHub release request failed (${response.status}): ${detail}`);
  }

  return (await response.json()) as T;
}
