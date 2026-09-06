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

type CheckRun = {
  conclusion: string | null;
  details_url: string | null;
  name: string;
};

type CheckRunsResponse = {
  check_runs: CheckRun[];
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
  'MilkTea-macos-x86_64.dmg.sha256',
  'MilkTea-windows-x86_64-setup.exe',
  'MilkTea-windows-x86_64-setup.exe.sha256'
] as const;
// The Windows assets come from GitHub Actions, which Woodpecker cannot `depends_on`. Everything
// else is uploaded by Woodpecker legs that this pipeline *does* depend on, so their absence is a
// real failure, not a race — only these two names get the poll-and-probe treatment below.
const WINDOWS_ASSET_NAMES: readonly string[] = REQUIRED_ASSETS.filter(name =>
  name.startsWith('MilkTea-windows-')
);
// Same name as the `release-windows` job in .github/workflows/release-windows.yml. GitHub records
// one check run per job, named after the job, so this is how we ask "did the Windows leg finish,
// and how".
const WINDOWS_CHECK_RUN_NAME = 'release-windows';
const SUCCESS_CONCLUSION = 'success';
const POLL_INTERVAL_SECONDS = 30;
const POLL_INTERVAL_MS = POLL_INTERVAL_SECONDS * 1_000;
// The Windows leg's budget is the Linux and macOS build window plus this, so it stays generous:
// a genuine failure never waits it out because the check-run probe below fails fast.
const POLL_TIMEOUT_MINUTES = 30;
const POLL_TIMEOUT_MS = POLL_TIMEOUT_MINUTES * 60 * 1_000;

const token = process.env.GITHUB_TOKEN;
const tag = process.env.CI_COMMIT_TAG;
const commit = process.env.CI_COMMIT_SHA;

/*
 * Script.
 */

if (!token || !tag || !commit) {
  throw new Error('GITHUB_TOKEN, CI_COMMIT_TAG, and CI_COMMIT_SHA are required to publish a release.');
}

const pollDeadline = Date.now() + POLL_TIMEOUT_MS;

for (;;) {
  let release: GitHubRelease;
  try {
    release = await fetchRelease(tag);
  } catch (error) {
    // A transient API error is not a release failure; the deadline below still bounds the loop.
    if (Date.now() >= pollDeadline) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    console.info(`Could not read release ${tag}: ${message}. Retrying in ${POLL_INTERVAL_SECONDS}s.`);
    await Bun.sleep(POLL_INTERVAL_MS);
    continue;
  }

  const missingAssets = computeMissingAssets(release);

  if (missingAssets.length === 0) {
    await publishRelease(release, tag);
    break;
  }

  const nonWindowsMissingAssets = missingAssets.filter(name => !WINDOWS_ASSET_NAMES.includes(name));
  if (nonWindowsMissingAssets.length > 0) {
    throw new Error(`Release ${tag} is incomplete: ${missingAssets.join(', ')}`);
  }

  // Only the Windows assets are missing. Before waiting another interval, check whether the
  // GitHub Actions run already failed, so a broken Windows build does not stall this pipeline
  // for the full timeout.
  const checkRunFailure = await probeWindowsCheckRunFailure(commit);
  if (checkRunFailure) {
    throw new Error(`Release ${tag} cannot complete: ${checkRunFailure}`);
  }

  if (Date.now() >= pollDeadline) {
    throw new Error(
      `Timed out after ${POLL_TIMEOUT_MINUTES} minutes waiting for: ${missingAssets.join(', ')}. ` +
        'Check the release-windows run under the GitHub Actions tab.'
    );
  }

  console.info(
    `Waiting on Windows assets: ${missingAssets.join(', ')}. Retrying in ${POLL_INTERVAL_SECONDS}s.`
  );
  await Bun.sleep(POLL_INTERVAL_MS);
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

async function fetchRelease(releaseTag: string): Promise<GitHubRelease> {
  const releases = await requestGitHub<readonly GitHubRelease[]>(
    `https://api.github.com/repos/${REPOSITORY}/releases?per_page=100`
  );
  const release = releases.find(candidate => candidate.tag_name === releaseTag);
  if (!release) {
    throw new Error(`Could not find GitHub release ${releaseTag}.`);
  }

  return release;
}

function computeMissingAssets(release: GitHubRelease): string[] {
  const assetsByName = new Map(release.assets.map(asset => [asset.name, asset]));

  return REQUIRED_ASSETS.filter(name => {
    const asset = assetsByName.get(name);
    return !asset || asset.state !== 'uploaded' || asset.size === 0;
  });
}

async function publishRelease(release: GitHubRelease, releaseTag: string): Promise<void> {
  if (!release.draft) {
    console.info(`Release ${releaseTag} is already published with complete assets.`);
    return;
  }

  const publishedRelease = await requestGitHub<GitHubRelease>(
    `https://api.github.com/repos/${REPOSITORY}/releases/${release.id}`,
    {
      body: JSON.stringify({draft: false, make_latest: 'true'}),
      method: 'PATCH'
    }
  );
  if (publishedRelease.draft) {
    throw new Error(`GitHub did not publish release ${releaseTag}.`);
  }

  console.info(`Published complete release ${releaseTag}.`);
}

// Returns why the release-windows check run can no longer produce the Windows assets, or
// undefined while it has not started or has not concluded (both mean "keep waiting"). A concluded
// run is always terminal: even `success` cannot be waited on, because a finished run will never
// upload anything more.
async function probeWindowsCheckRunFailure(headSha: string): Promise<string | undefined> {
  const response = await requestGitHub<CheckRunsResponse>(
    `https://api.github.com/repos/${REPOSITORY}/commits/${headSha}/check-runs?check_name=${WINDOWS_CHECK_RUN_NAME}`
  );
  const concludedRun = response.check_runs.find(checkRun => checkRun.conclusion !== null);
  if (!concludedRun) {
    return undefined;
  }

  const detailsUrl = concludedRun.details_url ?? '(no details_url)';
  if (concludedRun.conclusion === SUCCESS_CONCLUSION) {
    return `${WINDOWS_CHECK_RUN_NAME} succeeded for ${headSha} without uploading its assets: ${detailsUrl}`;
  }

  return `${WINDOWS_CHECK_RUN_NAME} check run ${concludedRun.conclusion} for ${headSha}: ${detailsUrl}`;
}
