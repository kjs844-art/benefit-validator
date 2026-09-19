import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "add_benefit",
  title: "Add a benefit",
  description:
    "Record a benefit (coupon, credit, capacity, etc.) for one of the user's services. Omit unknown amounts — null means 'unknown', 0 means an actual zero.",
  inputSchema: {
    service_id: z.string().min(1).describe("Target service id from list_benefits or create_service."),
    name: z.string().trim().min(1).max(160).describe("Benefit name, e.g. 'Offline downloads'."),
    unit: z.string().trim().min(1).max(40).describe("Unit exactly as the material states it, e.g. '개', 'GB', '회'."),
    granted_amount: z.number().nullish().describe("Amount granted per period; omit when unknown."),
    remaining_amount: z.number().nullish().describe("Remaining amount at observation time; omit when unknown."),
    monthly_cap: z.number().nullish().describe("Monthly cap stated by the material, if any."),
    extra_limit_note: z.string().max(500).nullish().describe("Any additional restriction the material states."),
    reset_rule: z
      .enum(["none", "daily", "weekly", "monthly", "yearly", "custom", "unknown"])
      .default("unknown"),
    reset_anchor: z.string().max(80).nullish().describe("Reset anchor (e.g. '매월 1일') when stated."),
    observed_at: z
      .string()
      .min(1)
      .describe("ISO 8601 timestamp of when the value was actually observed. Never fabricate a precise time: if the material only has a date, give midnight in observed_timezone and set observed_precision to 'day'."),
    observed_precision: z.enum(["minute", "day"]).default("minute"),
    observed_timezone: z.string().default("Asia/Seoul"),
    source_note: z.string().max(2000).nullish().describe("Where this value came from."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      throw new ToolError("Sign in as a Benefit Validator user to add data.");
    }
    const supabase = supabaseForUser(ctx);
    const { data: service } = await supabase
      .from("services")
      .select("id")
      .eq("id", input.service_id)
      .maybeSingle();
    if (!service) {
      throw new ToolError("Service not found among your services. Use list_benefits or create_service first.");
    }
    const { data, error } = await supabase
      .from("benefits")
      .insert({
        user_id: ctx.getUserId(),
        service_id: input.service_id,
        name: input.name,
        unit: input.unit,
        granted_amount: input.granted_amount ?? null,
        remaining_amount: input.remaining_amount ?? null,
        monthly_cap: input.monthly_cap ?? null,
        extra_limit_note: input.extra_limit_note ?? null,
        reset_rule: input.reset_rule,
        reset_anchor: input.reset_anchor ?? null,
        observed_at: input.observed_at,
        observed_precision: input.observed_precision,
        observed_timezone: input.observed_timezone,
        source_kind: "mcp",
        source_note: input.source_note ?? null,
      })
      .select("id, name")
      .single();
    if (error) throw new ToolError(error.message);
    return {
      content: [{ type: "text", text: `Benefit recorded: ${data.name} (${data.id})` }],
      structuredContent: { benefit: { id: data.id, name: data.name } },
    };
  },
});
