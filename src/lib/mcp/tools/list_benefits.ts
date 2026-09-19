import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";
import type { Tables } from "@/integrations/supabase/types";

type ServiceRow = Tables<"services">["Row"];
type BenefitRow = Tables<"benefits">["Row"];

const toServiceJson = (s: ServiceRow) => ({
  id: s.id,
  name: s.name,
  provider: s.provider,
  plan_name: s.plan_name,
  account_label: s.account_label,
  subscription_status: s.subscription_status,
  trial_ends_at: s.trial_ends_at,
  timezone: s.timezone,
  notes: s.notes,
});

const toBenefitJson = (b: BenefitRow) => ({
  id: b.id,
  service_id: b.service_id,
  name: b.name,
  unit: b.unit,
  granted_amount: b.granted_amount,
  remaining_amount: b.remaining_amount,
  monthly_cap: b.monthly_cap,
  extra_limit_note: b.extra_limit_note,
  reset_rule: b.reset_rule,
  reset_anchor: b.reset_anchor,
  observed_at: b.observed_at,
  observed_precision: b.observed_precision,
  observed_timezone: b.observed_timezone,
  source_kind: b.source_kind,
  source_note: b.source_note,
});

export default defineTool({
  name: "list_benefits",
  title: "List services and benefits",
  description:
    "List the signed-in user's subscription services and their recorded benefits (remaining amounts, units, reset rules, and when each value was observed).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    if (!ctx.isAuthenticated()) {
      throw new ToolError("Sign in as a Benefit Validator user to read your data.");
    }
    const supabase = supabaseForUser(ctx);
    const [servicesRes, benefitsRes] = await Promise.all([
      supabase.from("services").select("*").order("created_at"),
      supabase.from("benefits").select("*").order("created_at"),
    ]);
    if (servicesRes.error) throw new ToolError(servicesRes.error.message);
    if (benefitsRes.error) throw new ToolError(benefitsRes.error.message);
    const services = servicesRes.data ?? [];
    const benefits = benefitsRes.data ?? [];
    return {
      content: [
        {
          type: "text",
          text: `${services.length} service(s), ${benefits.length} benefit(s). null amounts mean "unknown" — do not invent values.`,
        },
      ],
      structuredContent: {
        services: services.map(toServiceJson),
        benefits: benefits.map(toBenefitJson),
      },
    };
  },
});
