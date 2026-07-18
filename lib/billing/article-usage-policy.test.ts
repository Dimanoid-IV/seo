import assert from "node:assert";
import { ArticleStatus } from "@prisma/client";

import {
  countActiveQuotaArticleDraftsFromRows,
  isArticleCountedTowardQuota,
  monthKeyToPeriod,
  type ArticleQuotaRow,
} from "./article-usage-policy";

const month = "2026-07";
const inMonth = new Date("2026-07-15T12:00:00.000Z");
const outMonth = new Date("2026-06-15T12:00:00.000Z");
const jobId = "job-1";

function row(
  overrides: Partial<ArticleQuotaRow> & Pick<ArticleQuotaRow, "id" | "status">
): ArticleQuotaRow {
  return {
    qualityPassed: true,
    deletedAt: null,
    createdAt: inMonth,
    generatedByAIJobId: jobId,
    ...overrides,
  };
}

// --- month period -----------------------------------------------------------
const period = monthKeyToPeriod(month);
assert.equal(period.start.toISOString(), "2026-07-01T00:00:00.000Z");
assert.equal(period.end.toISOString(), "2026-08-01T00:00:00.000Z");

// --- archived does not count ------------------------------------------------
assert.equal(
  isArticleCountedTowardQuota(
    row({ id: "a1", status: ArticleStatus.ARCHIVED })
  ),
  false,
  "archived article does not count"
);

// --- failed does not count --------------------------------------------------
assert.equal(
  isArticleCountedTowardQuota(row({ id: "a2", status: ArticleStatus.FAILED })),
  false,
  "failed article does not count"
);

// --- quality-failed DRAFT does not count ------------------------------------
assert.equal(
  isArticleCountedTowardQuota(
    row({
      id: "a3",
      status: ArticleStatus.DRAFT,
      qualityPassed: false,
    })
  ),
  false,
  "failed/rejected quality draft does not count"
);

// --- WAITING_REVIEW passing article counts ----------------------------------
assert.equal(
  isArticleCountedTowardQuota(
    row({
      id: "a4",
      status: ArticleStatus.WAITING_REVIEW,
      qualityPassed: true,
    })
  ),
  true,
  "WAITING_REVIEW passing article counts"
);

// --- DRAFT counts only when quality-publishable -----------------------------
assert.equal(
  isArticleCountedTowardQuota(
    row({
      id: "a5",
      status: ArticleStatus.DRAFT,
      qualityPassed: true,
    })
  ),
  true,
  "quality-passed DRAFT counts"
);
assert.equal(
  isArticleCountedTowardQuota(
    row({
      id: "a6",
      status: ArticleStatus.DRAFT,
      qualityPassed: null,
    })
  ),
  true,
  "DRAFT with unknown quality still counts (legacy)"
);

// --- soft-deleted / no generation job / IDEA do not count -------------------
assert.equal(
  isArticleCountedTowardQuota(
    row({
      id: "a7",
      status: ArticleStatus.WAITING_REVIEW,
      deletedAt: new Date(),
    })
  ),
  false
);
assert.equal(
  isArticleCountedTowardQuota(
    row({
      id: "a8",
      status: ArticleStatus.WAITING_REVIEW,
      generatedByAIJobId: null,
    })
  ),
  false,
  "manual/non-generated articles do not consume generation quota"
);
assert.equal(
  isArticleCountedTowardQuota(row({ id: "a9", status: ArticleStatus.IDEA })),
  false
);

// --- superseded (archived old draft) does not count -------------------------
const supersededOld = row({
  id: "old",
  status: ArticleStatus.ARCHIVED,
  qualityPassed: false,
});
const currentUsable = row({
  id: "04aa451a",
  status: ArticleStatus.WAITING_REVIEW,
  qualityPassed: true,
});
assert.equal(
  countActiveQuotaArticleDraftsFromRows(
    [supersededOld, currentUsable],
    month
  ),
  1,
  "superseded archived draft does not count; active one does"
);

// --- out-of-month usable article does not count -----------------------------
assert.equal(
  countActiveQuotaArticleDraftsFromRows(
    [
      row({
        id: "old-month",
        status: ArticleStatus.WAITING_REVIEW,
        createdAt: outMonth,
      }),
    ],
    month
  ),
  0
);

// --- popart.ee-style mix: archived junk + one usable ------------------------
const popartMix: ArticleQuotaRow[] = [
  row({
    id: "junk-1",
    status: ArticleStatus.ARCHIVED,
    qualityPassed: false,
  }),
  row({
    id: "junk-2",
    status: ArticleStatus.ARCHIVED,
    qualityPassed: true,
  }),
  row({
    id: "junk-3",
    status: ArticleStatus.ARCHIVED,
    qualityPassed: true,
  }),
  row({
    id: "junk-4",
    status: ArticleStatus.ARCHIVED,
    qualityPassed: false,
  }),
  row({
    id: "junk-5",
    status: ArticleStatus.ARCHIVED,
    qualityPassed: false,
  }),
  row({
    id: "04aa451a-96bc-48d8-853c-09551f852c96",
    status: ArticleStatus.WAITING_REVIEW,
    qualityPassed: true,
  }),
];
assert.equal(
  countActiveQuotaArticleDraftsFromRows(popartMix, month),
  1,
  "generation allowed when only archived junk consumed the old counter"
);

// --- limit reached when active usable count hits plan limit -----------------
const fiveUsable = Array.from({ length: 5 }, (_, i) =>
  row({
    id: `u-${i}`,
    status: ArticleStatus.WAITING_REVIEW,
    qualityPassed: true,
  })
);
const starterLimit = 5;
assert.equal(
  countActiveQuotaArticleDraftsFromRows(fiveUsable, month) >= starterLimit,
  true,
  "generation blocked when active usable count reaches limit"
);
assert.equal(
  countActiveQuotaArticleDraftsFromRows(popartMix, month) < starterLimit,
  true,
  "generation allowed under limit when junk is archived"
);

// --- idempotent policy: counting archived twice does not change live count --
const once = countActiveQuotaArticleDraftsFromRows(popartMix, month);
const twice = countActiveQuotaArticleDraftsFromRows(
  [...popartMix, ...popartMix.filter((a) => a.status === ArticleStatus.ARCHIVED)],
  month
);
// Duplicate archived rows still don't add usable slots (same ids wouldn't exist in DB;
// this asserts the predicate never credits ARCHIVED regardless of repetition).
assert.equal(once, 1);
assert.equal(
  countActiveQuotaArticleDraftsFromRows(
    [
      ...popartMix,
      row({ id: "extra-arch", status: ArticleStatus.ARCHIVED }),
      row({ id: "extra-arch-2", status: ArticleStatus.ARCHIVED }),
    ],
    month
  ),
  1,
  "no double-count / no phantom slots from repeated archive rows"
);
assert.equal(twice >= once, true);

console.log("article-usage-policy checks passed");
