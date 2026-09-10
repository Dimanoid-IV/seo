import { execFileSync } from "node:child_process";

// Run against a protected deployment with Vercel CLI's authenticated curl.
// Credentials are supplied by the caller and never printed or written to disk.
const cli = process.env.RANKBOOST_QA_VERCEL_CLI;
const deployment = process.env.RANKBOOST_QA_DEPLOYMENT;
if (!cli || !deployment || !process.env.RANKBOOST_QA_EMAIL || !process.env.RANKBOOST_QA_PASSWORD) throw new Error("QA environment is incomplete");
let token;
function request(path, body) {
  const args = [cli, "curl", path, "--deployment", deployment, "--", "--silent", "--show-error", "--max-time", "310"];
  if (token) args.push("-H", `Authorization: Bearer ${token}`);
  if (body) args.push("-X", "POST", "-H", "Content-Type: application/json", "--data", JSON.stringify(body));
  const result = JSON.parse(execFileSync(process.execPath, args, { encoding: "utf8", maxBuffer: 5_000_000, stdio: ["ignore", "pipe", "pipe"] }));
  if (result.error) throw new Error(`${path}: ${result.error.code ?? "request_failed"}: ${result.error.message ?? ""}`);
  return result;
}
const phase = process.argv[2] ?? "inspect";
if (phase === "register") {
  const registration = request("/api/auth/register", {
    email: process.env.RANKBOOST_QA_EMAIL,
    password: process.env.RANKBOOST_QA_PASSWORD,
    name: "RankBoost launch QA",
    locale: "ru",
    websiteUrl: "https://www.popart.ee",
    acceptTerms: true,
  });
  token = registration.accessToken;
  console.log(JSON.stringify({ stage: "register", ok: true, websiteId: registration.website?.id, activationStarted: registration.activationStarted }));
} else {
  const login = request("/api/auth/login", { email: process.env.RANKBOOST_QA_EMAIL, password: process.env.RANKBOOST_QA_PASSWORD });
  token = login.accessToken;
  console.log(JSON.stringify({ stage: "login", ok: true }));
}
if (!token) throw new Error("Authentication did not return an access token");
if (phase === "connect") {
  const created = request("/api/onboarding/website", { url: "https://www.popart.ee", displayName: "PopArt — launch acceptance test" });
  console.log(JSON.stringify({ stage: "website", websiteId: created.data.website.id, activationStarted: created.data.activationStarted }));
}
if (phase === "resume") {
  request("/api/onboarding/activation", { retry: true });
}
if (phase === "refresh") {
  const { data } = request("/api/autopilot/monthly");
  for (const item of data.planItems.items.filter(item => item.type === "ARTICLE" && !item.generatedArticleId)) {
    const refreshed = request(`/api/autopilot/monthly/${data.plan.id}/research-brief`, { itemId: item.id });
    console.log(JSON.stringify({ stage: "research", itemId: item.id, data: refreshed.data?.summary ?? { ready: refreshed.data?.ready } }));
  }
}
if (phase === "generate") {
  const { data } = request("/api/autopilot/monthly");
  const item = data.planItems.items.find(candidate => candidate.type === "ARTICLE" && !candidate.generatedArticleId);
  if (!item) throw new Error("No ungenerated article plan item is available");
  const brief = request(`/api/autopilot/monthly/${data.plan.id}/research-brief`, { itemId: item.id });
  console.log(JSON.stringify({ stage: "research", itemId: item.id, ready: brief.data?.ready, targetKeyword: brief.data?.brief?.targetKeyword }));
  const generated = request(`/api/autopilot/monthly/${data.plan.id}/generate-article-draft`, { itemId: item.id });
  console.log(JSON.stringify({
    stage: "generated",
    articleId: generated.data?.article?.id,
    qualityScore: generated.data?.article?.qualityScore,
    qualityPassed: generated.data?.article?.qualityPassed,
    pipelineState: generated.data?.planItem?.pipelineState,
  }));
}
if (["register", "connect", "resume", "inspect"].includes(phase)) {
  for (let attempt = 0; attempt < 24; attempt++) {
    const { data } = request("/api/onboarding/activation");
    console.log(JSON.stringify({ stage: "activation", status: data.activation?.status, steps: data.activation?.steps, businessProfile: data.businessProfile }));
    if (!data.activation || ["done", "partial", "failed"].includes(data.activation.status)) break;
    await new Promise(resolve => setTimeout(resolve, 10_000));
  }
  const state = request("/api/onboarding");
  console.log(JSON.stringify({ stage: "onboarding", data: state.data }));
  const plan = request("/api/autopilot/monthly");
  console.log(JSON.stringify({ stage: "plan", id: plan.data?.plan?.id, status: plan.data?.plan?.status, mode: plan.data?.autopilotSettings?.mode, items: plan.data?.planItems?.items?.map(item => ({ id: item.id, title: item.title, type: item.type, status: item.status, pipelineState: item.pipelineState, scheduledFor: item.scheduledFor, plannedDraftAt: item.plannedDraftAt, blockedReasonKey: item.blockedReasonKey })) }));
}
if (phase === "run") {
  const result = request("/api/autopilot/run-due", { dryRun: false });
  console.log(JSON.stringify({ stage: "run", data: result.data }));
}
if (phase === "checkout") {
  const result = request("/api/billing/checkout", { plan: "STARTER" });
  const checkoutUrl = new URL(result.data.checkoutUrl);
  console.log(JSON.stringify({ stage: "checkout", ok: true, host: checkoutUrl.host }));
}
if (phase === "article") {
  const { data } = request("/api/autopilot/monthly");
  for (const item of data.planItems.items.filter(item => item.generatedArticleId)) {
    console.log(JSON.stringify({ stage: "article-item", id: item.generatedArticleId, qualityScore: item.articleQualityScore, qualityPassed: item.articleQualityPassed, pipelineState: item.pipelineState }));
    const result = request(`/api/articles/${item.generatedArticleId}`);
    const article = result.data?.article ?? result.data;
    const contentHtml = article?.contentHtml ?? "";
    const plainText = contentHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    console.log(JSON.stringify({
      stage: "article",
      id: article?.id,
      title: article?.title,
      status: article?.status,
      qualityScore: article?.qualityScore,
      qualityPassed: article?.qualityPassed,
      wordCount: plainText ? plainText.split(" ").length : 0,
      h2Count: (contentHtml.match(/<h2\b/gi) ?? []).length,
      mentionsSeo: /\bseo\b|поисков/iu.test(plainText),
    }));
  }
}
