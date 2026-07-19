/**
 * Thin wrapper around draft REST create for the WordPress adapter.
 * Does not live-publish.
 */
import "server-only";

import {
  createWordPressRestDraft,
  type WordPressRestCredentials,
  type WordPressRestDraftInput,
  type WordPressRestDraftResult,
} from "../../wordpress/rest-client";

export async function createWordPressArticleDraft(
  credentials: WordPressRestCredentials,
  draft: WordPressRestDraftInput
): Promise<WordPressRestDraftResult> {
  return createWordPressRestDraft(credentials, {
    ...draft,
    status: "draft",
  });
}
