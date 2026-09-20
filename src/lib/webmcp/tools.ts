import { isObservationStale, nextResetAt, remainingRatio } from "@/lib/benefits";
import type { BenefitRecord, ServiceRecord } from "@/lib/benefits";

type JsonSchema = Record<string, unknown>;
type ToolInput = Record<string, unknown>;

export interface WebMcpTool {
  name: string;
  title: string;
  description: string;
  inputSchema: JsonSchema;
  annotations: {
    readOnlyHint: boolean;
    untrustedContentHint: boolean;
    consequentialHint: boolean;
  };
  execute: (input: ToolInput, context?: { signal?: AbortSignal }) => string | Promise<string>;
}

export interface DiscoveryRecord {
  id: string;
  service_name: string;
  benefit_kind: string;
  benefit_name: string;
  unit: string;
  granted_amount: number | null;
  remaining_amount: number | null;
  trial_days: number | null;
  remaining_days: number | null;
  expires_at: string | null;
  evidence_date: string;
  confidence: string;
}

export interface KeyAtlasToolApi {
  services: ServiceRecord[];
  benefits: BenefitRecord[];
  discoveries: DiscoveryRecord[];
  navigate: (path: string) => void;
}

export const KEYATLAS_WEBMCP_TOOL_NAMES = [
  "get_keyatlas_overview",
  "list_keyatlas_services",
  "list_discovered_benefits",
  "get_keyatlas_timeline",
  "open_keyatlas_view",
] as const;

const EMPTY_SCHEMA: JsonSchema = {
  type: "object",
  properties: {},
  additionalProperties: false,
};

function jsonResult(value: unknown): string {
  return JSON.stringify(value);
}

function boundedLimit(value: unknown, fallback = 10): number {
  if (value === undefined) return fallback;
  if (!Number.isInteger(value) || Number(value) < 1 || Number(value) > 20) {
    throw new Error("INVALID_INPUT: limit must be an integer from 1 to 20.");
  }
  return Number(value);
}

function serviceSummary(service: ServiceRecord, benefits: BenefitRecord[]) {
  const owned = benefits.filter((benefit) => benefit.service_id === service.id);
  return {
    id: service.id,
    name: service.name,
    plan: service.plan_name,
    status: service.subscription_status,
    trialEndsAt: service.trial_ends_at,
    benefitCount: owned.length,
    needsReviewCount: owned.filter((benefit) => isObservationStale(benefit)).length,
    benefits: owned.map((benefit) => ({
      id: benefit.id,
      name: benefit.name,
      unit: benefit.unit,
      grantedAmount: benefit.granted_amount,
      remainingAmount: benefit.remaining_amount,
      remainingRatio: remainingRatio(benefit),
      observedAt: benefit.observed_at,
      resetRule: benefit.reset_rule,
      nextResetAt: nextResetAt(benefit)?.toISOString() ?? null,
    })),
  };
}

export function createKeyAtlasTools(api: KeyAtlasToolApi): WebMcpTool[] {
  return [
    {
      name: "get_keyatlas_overview",
      title: "Read the KeyAtlas overview",
      description:
        "Summarize the signed-in user's loaded services, benefits, trials, and review counts. Unknown amounts remain null and are never inferred.",
      inputSchema: EMPTY_SCHEMA,
      annotations: { readOnlyHint: true, untrustedContentHint: false, consequentialHint: false },
      execute: () => {
        const now = Date.now();
        const nextThirtyDays = now + 30 * 24 * 60 * 60 * 1000;
        const upcomingTrials = api.services.filter((service) => {
          if (!service.trial_ends_at) return false;
          const end = new Date(service.trial_ends_at).getTime();
          return end >= now && end <= nextThirtyDays;
        });
        return jsonResult({
          ok: true,
          serviceCount: api.services.length,
          benefitCount: api.benefits.length,
          discoveredEmailItemCount: api.discoveries.length,
          needsReviewCount: api.benefits.filter((benefit) => isObservationStale(benefit)).length,
          upcomingTrialCount: upcomingTrials.length,
          upcomingTrials: upcomingTrials.slice(0, 10).map((service) => ({
            serviceId: service.id,
            serviceName: service.name,
            trialEndsAt: service.trial_ends_at,
          })),
          accuracyRule: "null means unknown; zero means actual zero",
          detailView: "/gmail",
        });
      },
    },
    {
      name: "list_keyatlas_services",
      title: "List saved KeyAtlas services",
      description:
        "List saved services and their recorded benefits. Amounts, units, observation times, and reset dates are returned exactly as recorded.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            maxLength: 80,
            description: "Optional service-name search text.",
          },
          limit: { type: "integer", minimum: 1, maximum: 20, default: 10 },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false, consequentialHint: false },
      execute: (input) => {
        const query =
          typeof input["query"] === "string" ? input["query"].trim().toLocaleLowerCase("ko") : "";
        const limit = boundedLimit(input["limit"]);
        const matches = api.services
          .filter((service) => !query || service.name.toLocaleLowerCase("ko").includes(query))
          .slice(0, limit)
          .map((service) => serviceSummary(service, api.benefits));
        return jsonResult({
          ok: true,
          returnedCount: matches.length,
          totalCount: api.services.length,
          services: matches,
        });
      },
    },
    {
      name: "list_discovered_benefits",
      title: "List benefits discovered from account evidence",
      description:
        "List privacy-minimized benefit candidates discovered from approved Gmail evidence. Email subjects and message bodies are never returned.",
      inputSchema: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: [
              "all",
              "trial",
              "coupon",
              "credit",
              "point",
              "storage",
              "receipt",
              "expiration",
              "membership",
              "other",
            ],
            default: "all",
          },
          limit: { type: "integer", minimum: 1, maximum: 20, default: 10 },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true, consequentialHint: false },
      execute: (input) => {
        const category = typeof input["category"] === "string" ? input["category"] : "all";
        const limit = boundedLimit(input["limit"]);
        const matches = api.discoveries
          .filter((item) => category === "all" || item.benefit_kind === category)
          .slice(0, limit)
          .map((item) => ({
            id: item.id,
            serviceName: item.service_name,
            category: item.benefit_kind,
            benefitName: item.benefit_name,
            unit: item.unit,
            grantedAmount: item.granted_amount,
            remainingAmount: item.remaining_amount,
            trialDays: item.trial_days,
            remainingDays: item.remaining_days,
            expiresAt: item.expires_at,
            evidenceDate: item.evidence_date,
            confidence: item.confidence,
          }));
        return jsonResult({
          ok: true,
          returnedCount: matches.length,
          totalCount: api.discoveries.length,
          discoveries: matches,
        });
      },
    },
    {
      name: "get_keyatlas_timeline",
      title: "Read upcoming KeyAtlas dates",
      description:
        "Return upcoming trial endings and benefit resets, sorted by date. This does not create reminders or change subscriptions.",
      inputSchema: {
        type: "object",
        properties: {
          days: {
            type: "integer",
            enum: [7, 30, 90],
            default: 30,
            description: "Timeline window in days.",
          },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false, consequentialHint: false },
      execute: (input) => {
        const days = input["days"] === 7 || input["days"] === 90 ? input["days"] : 30;
        const start = Date.now();
        const end = start + days * 24 * 60 * 60 * 1000;
        const serviceById = new Map(api.services.map((service) => [service.id, service.name]));
        const events = [
          ...api.services
            .filter((service) => service.trial_ends_at)
            .map((service) => ({
              type: "trial_end",
              at: service.trial_ends_at as string,
              serviceName: service.name,
              benefitName: null,
            })),
          ...api.benefits
            .map((benefit) => ({ benefit, at: nextResetAt(benefit) }))
            .filter((item): item is { benefit: BenefitRecord; at: Date } => item.at !== null)
            .map(({ benefit, at }) => ({
              type: "benefit_reset",
              at: at.toISOString(),
              serviceName: serviceById.get(benefit.service_id) ?? "Unknown service",
              benefitName: benefit.name,
            })),
        ]
          .filter((event) => {
            const at = new Date(event.at).getTime();
            return at >= start && at <= end;
          })
          .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
          .slice(0, 20);
        return jsonResult({ ok: true, windowDays: days, eventCount: events.length, events });
      },
    },
    {
      name: "open_keyatlas_view",
      title: "Open a KeyAtlas view",
      description:
        "Navigate the visible KeyAtlas app to the overview, saved services, evidence analyzer, timeline, or settings page.",
      inputSchema: {
        type: "object",
        properties: {
          view: {
            type: "string",
            enum: ["overview", "services", "analyze", "timeline", "settings"],
          },
        },
        required: ["view"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false, consequentialHint: false },
      execute: (input) => {
        const routes: Record<string, string> = {
          overview: "/gmail",
          services: "/services",
          analyze: "/analyze",
          timeline: "/schedule",
          settings: "/settings",
        };
        const view = typeof input["view"] === "string" ? input["view"] : "";
        const path = routes[view];
        if (!path) throw new Error("INVALID_INPUT: unknown KeyAtlas view.");
        api.navigate(path);
        return jsonResult({ ok: true, view, path });
      },
    },
  ];
}
