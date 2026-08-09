import "server-only";

import { AppError, ErrorCode } from "@/lib/errors";

const GBP_BUSINESS_INFO_API =
  "https://mybusinessbusinessinformation.googleapis.com/v1";
const TIMEOUT_MS = 15_000;

export type GoogleBusinessProfileLocation = {
  name: string;
  title: string | null;
  websiteUri: string | null;
  primaryPhone: string | null;
  address: string | null;
  primaryCategory: string | null;
};

type GbpLocationResponse = {
  name?: string;
  title?: string;
  websiteUri?: string;
  primaryPhone?: string;
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
    administrativeArea?: string;
    postalCode?: string;
    regionCode?: string;
  };
  categories?: {
    primaryCategory?: {
      displayName?: string;
    };
  };
};

type GbpLocationsListResponse = {
  locations?: GbpLocationResponse[];
};

export function normalizeBusinessProfileId(value: string): string {
  return value.trim().replace(/^accounts\//, "").replace(/^locations\//, "");
}

function formatAddress(address: GbpLocationResponse["storefrontAddress"]): string | null {
  if (!address) return null;
  const parts = [
    ...(address.addressLines ?? []),
    address.locality,
    address.administrativeArea,
    address.postalCode,
    address.regionCode,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

function normalizeLocation(location: GbpLocationResponse): GoogleBusinessProfileLocation {
  return {
    name: location.name ?? "",
    title: location.title ?? null,
    websiteUri: location.websiteUri ?? null,
    primaryPhone: location.primaryPhone ?? null,
    address: formatAddress(location.storefrontAddress),
    primaryCategory: location.categories?.primaryCategory?.displayName ?? null,
  };
}

export async function getBusinessProfileLocation(input: {
  accessToken: string;
  accountId: string;
  locationId: string;
}): Promise<GoogleBusinessProfileLocation> {
  const accountId = normalizeBusinessProfileId(input.accountId);
  const locationId = normalizeBusinessProfileId(input.locationId);
  const readMask = [
    "name",
    "title",
    "websiteUri",
    "primaryPhone",
    "storefrontAddress",
    "categories",
  ].join(",");
  const url = new URL(
    `${GBP_BUSINESS_INFO_API}/accounts/${encodeURIComponent(accountId)}/locations`
  );
  url.searchParams.set("readMask", readMask);
  url.searchParams.set("pageSize", "100");

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      Accept: "application/json",
      "User-Agent": "RankBoost-GoogleBusinessProfile/1.0",
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    redirect: "manual",
  });

  if (response.status === 401 || response.status === 403) {
    throw new AppError(
      ErrorCode.INTEGRATION_ERROR,
      "Google Business Profile token expired or does not have access.",
      { details: { reason: "token_expired" } }
    );
  }

  if (!response.ok) {
    throw new AppError(
      ErrorCode.INTEGRATION_ERROR,
      `Не удалось загрузить Google Business Profile (HTTP ${response.status}).`
    );
  }

  const body = (await response.json()) as GbpLocationsListResponse;
  const expectedName = `accounts/${accountId}/locations/${locationId}`;
  const location = (body.locations ?? []).find(
    (item) =>
      item.name === expectedName ||
      item.name?.endsWith(`/locations/${locationId}`)
  );

  if (!location) {
    throw new AppError(
      ErrorCode.NOT_FOUND,
      "Эта локация Google Business Profile не найдена в выбранном аккаунте."
    );
  }

  return normalizeLocation(location);
}
