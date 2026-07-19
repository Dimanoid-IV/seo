/**
 * WordPress integration adapter (Prompt 11.51).
 * Capabilities: ARTICLE_CREATE_DRAFT, ARTICLE_PUBLISH.
 * Does not implement UPDATE / META / IMAGE / ROLLBACK yet.
 */

import { IntegrationCapability } from "../capabilities";
import type {
  AdapterExecuteInput,
  AdapterExecuteResult,
  AdapterPrepareInput,
  AdapterPrepareResult,
  IntegrationAdapter,
} from "../types";
import { evaluateLivePublishGate } from "../../live-publish-gate";
import { createWordPressArticleDraft } from "./create-draft";
import { createWordPressRestPublishedPost } from "./publish-article";

export const WORDPRESS_ADAPTER_CAPABILITIES = [
  IntegrationCapability.CREATE_WORDPRESS_DRAFT,
  IntegrationCapability.PUBLISH_WORDPRESS_ARTICLE,
  IntegrationCapability.TEST_CONNECTION,
] as const;

export type WordPressAdapterExecuteContext = {
  credentials: {
    siteUrl: string;
    username: string;
    applicationPassword: string;
  };
  title: string;
  contentHtml: string;
  excerpt?: string;
  slug?: string | null;
  categories?: number[];
  author?: number | null;
};

/**
 * Pure prepare helper — no network, no credentials in preview.
 */
export function prepareWordPressChange(
  input: AdapterPrepareInput
): AdapterPrepareResult {
  const { change } = input;
  return {
    preview: {
      ...change,
      // Never include HTML body in preview.
      contentHtmlLength: change.contentHtmlLength ?? null,
    },
    externalActionPerformed: false,
  };
}

export function createWordPressAdapter(
  getContext: () => Promise<WordPressAdapterExecuteContext | null>
): IntegrationAdapter {
  return {
    provider: "WORDPRESS",
    capabilities: WORDPRESS_ADAPTER_CAPABILITIES,
    supports(capability) {
      return (WORDPRESS_ADAPTER_CAPABILITIES as readonly string[]).includes(
        capability
      );
    },
    async prepare(input) {
      return prepareWordPressChange(input);
    },
    async execute(input: AdapterExecuteInput): Promise<AdapterExecuteResult> {
      const { change, gate } = input;

      if (change.action === "CREATE_DRAFT") {
        const ctx = await getContext();
        if (!ctx) {
          return {
            externalActionPerformed: false,
            result: { errorCode: "wordpress_credentials_missing" },
          };
        }
        const draft = await createWordPressArticleDraft(ctx.credentials, {
          title: ctx.title,
          contentHtml: ctx.contentHtml,
          excerpt: ctx.excerpt,
          slug: ctx.slug,
          status: "draft",
          categories: ctx.categories,
          author: ctx.author,
        });
        return {
          externalId: draft.postId,
          externalUrl: draft.editUrl,
          externalActionPerformed: true,
          result: {
            status: "draft",
            link: draft.link,
            livePublished: false,
          },
        };
      }

      if (change.action === "PUBLISH") {
        const gateState = evaluateLivePublishGate(gate);
        if (!gateState.livePublishEnabled) {
          return {
            externalActionPerformed: false,
            result: {
              errorCode: "live_publish_blocked",
              missingPrerequisites: gateState.missingPrerequisites,
            },
          };
        }

        const ctx = await getContext();
        if (!ctx) {
          return {
            externalActionPerformed: false,
            result: { errorCode: "wordpress_credentials_missing" },
          };
        }

        const published = await createWordPressRestPublishedPost(
          ctx.credentials,
          {
            title: ctx.title,
            contentHtml: ctx.contentHtml,
            excerpt: ctx.excerpt,
            slug: ctx.slug,
            categories: ctx.categories,
            author: ctx.author,
          }
        );

        return {
          externalId: published.postId,
          externalUrl: published.link ?? published.editUrl,
          externalActionPerformed: true,
          result: {
            status: published.status,
            editUrl: published.editUrl,
            link: published.link,
            livePublished: published.livePublished,
          },
        };
      }

      return {
        externalActionPerformed: false,
        result: { errorCode: "unsupported_action", action: change.action },
      };
    },
  };
}

export const wordpressAdapterCapabilities = {
  ARTICLE_CREATE_DRAFT: IntegrationCapability.CREATE_WORDPRESS_DRAFT,
  ARTICLE_PUBLISH: IntegrationCapability.PUBLISH_WORDPRESS_ARTICLE,
} as const;
