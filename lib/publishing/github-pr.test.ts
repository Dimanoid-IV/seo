import assert from "node:assert/strict";

import { testGitHubPrConnection } from "./github-pr";
import { GITHUB_PR_KIND, parseGitHubPrScopes } from "./github-pr-config";

const originalFetch = globalThis.fetch;

async function main() {
  globalThis.fetch = (async (url: RequestInfo | URL) => {
    assert.equal(String(url), "https://api.github.com/repos/acme/site");
    return new Response(
      JSON.stringify({
        default_branch: "main",
        permissions: { push: true, maintain: false, admin: false },
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  }) as typeof fetch;

  const ok = await testGitHubPrConnection({
    owner: "acme",
    repo: "site",
    baseBranch: "main",
    token: "ghp_test_token",
  });
  assert.equal(ok.ok, true);
  assert.equal(ok.defaultBranch, "main");
  assert.equal(ok.permissions.push, true);
  assert.equal(ok.error, null);

  const parsed = parseGitHubPrScopes({
    kind: GITHUB_PR_KIND,
    owner: "acme",
    repo: "site",
    baseBranch: "main",
    contentPath: "/content//blog/../",
    testedAt: "2026-08-09T00:00:00.000Z",
  });
  assert.equal(parsed?.owner, "acme");
  assert.equal(parsed?.repo, "site");
  assert.equal(parsed?.contentPath, "content/blog");

  console.log("github-pr.test.ts: ok");
}

main()
  .finally(() => {
    globalThis.fetch = originalFetch;
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
