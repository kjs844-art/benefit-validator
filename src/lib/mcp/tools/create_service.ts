import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_service",
  title: "Create a service",
  description:
    "Create a subscription service record (e.g. a streaming plan) for the signed-in user, so benefits can be attached to it.",
  inputSchema: {
    name: z.string().trim().min(1).max(120).describe("Service display name, e.g. 'StreamPlus'."),
    provider: z.string().trim().max(120).nullish().describe("Company providing the service, if known."),
    plan_name: z.string().trim().max(120).nullish().describe("Plan name, if known."),
    subscription_status: z
      .enum(["active", "trial", "trial_ended", "paused", "cancelled", "unknown"])
      .default("active"),
    trial_ends_at: z
      .string()
      .nullish()
      .describe("ISO 8601 timestamp when a free trial ends; omit unless the material states it."),
    notes: z.string().max(2000).nullish(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      throw new ToolError("Sign in as a Benefit Validator user to create data.");
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("services")
      .insert({
        user_id: ctx.getUserId()!,
        name: input.name,
        provider: input.provider ?? null,
        plan_name: input.plan_name ?? null,
        subscription_status: input.subscription_status ?? "active",
        trial_ends_at: input.trial_ends_at ?? null,
        notes: input.notes ?? null,
      })
      .select("id, name")
      .single();
    if (error) throw new ToolError(error.message);
    return {
      content: [{ type: "text", text: `Service created: ${data.name} (${data.id})` }],
      structuredContent: { service: { id: data.id, name: data.name } },
    };
  },
});
