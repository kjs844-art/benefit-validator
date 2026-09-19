import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import type { TablesUpdate } from "@/integrations/supabase/types";

type BenefitUpdate = TablesUpdate<"benefits">;

export default defineTool({
  name: "update_benefit",
  title: "Update a benefit",
  description:
    "Update fields of one of the user's recorded benefits (e.g. a new remaining amount after re-checking). Only the fields you pass are changed.",
  inputSchema: {
    id: z.string().min(1).describe("Benefit id from list_benefits."),
    remaining_amount: z.number().nullish().describe("New remaining amount; null records 'unknown'."),
    granted_amount: z.number().nullish(),
    monthly_cap: z.number().nullish(),
    extra_limit_note: z.string().max(500).nullish(),
    reset_rule: z.enum(["none", "daily", "weekly", "monthly", "yearly", "custom", "unknown"]).nullish(),
    reset_anchor: z.string().max(80).nullish(),
    observed_at: z.string().min(1).describe("ISO 8601 timestamp of the new observation; set alongside a new value."),
    observed_precision: z.enum(["minute", "day"]).nullish(),
    observed_timezone: z.string().nullish(),
    source_note: z.string().max(2000).nullish(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      throw new ToolError("Sign in as a Benefit Validator user to update data.");
    }
    const patch: BenefitUpdate = {};
    if (input.remaining_amount !== undefined) patch.remaining_amount = input.remaining_amount;
    if (input.granted_amount !== undefined) patch.granted_amount = input.granted_amount;
    if (input.monthly_cap !== undefined) patch.monthly_cap = input.monthly_cap;
    if (input.extra_limit_note !== undefined) patch.extra_limit_note = input.extra_limit_note;
    if (input.reset_rule !== undefined) patch.reset_rule = input.reset_rule;
    if (input.reset_anchor !== undefined) patch.reset_anchor = input.reset_anchor;
    if (input.observed_at !== undefined) patch.observed_at = input.observed_at;
    if (input.observed_precision !== undefined) patch.observed_precision = input.observed_precision;
    if (input.observed_timezone !== undefined) patch.observed_timezone = input.observed_timezone;
    if (input.source_note !== undefined) patch.source_note = input.source_note;
    if (Object.keys(patch).length === 0) {
      throw new ToolError("Nothing to update: pass at least one field to change.");
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("benefits")
      .update(patch)
      .eq("id", input.id)
      .select("id, name")
      .maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) throw new ToolError("Benefit not found among your benefits.");
    return {
      content: [{ type: "text", text: `Benefit updated: ${data.name} (${data.id})` }],
      structuredContent: { benefit: { id: data.id, name: data.name } },
    };
  },
});
