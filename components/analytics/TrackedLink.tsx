"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { trackClientEvent } from "@/lib/analytics/client";
import type { ProductEventName } from "@/lib/analytics/types";

type TrackedLinkProps = ComponentProps<typeof Link> & {
  event: ProductEventName;
  eventProperties?: Record<string, unknown>;
  locale?: string;
};

/**
 * Link that emits a privacy-safe product analytics event on click.
 */
export function TrackedLink({
  event,
  eventProperties,
  locale,
  onClick,
  ...props
}: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        trackClientEvent({
          event,
          locale,
          properties: eventProperties,
        });
        onClick?.(e);
      }}
    />
  );
}
