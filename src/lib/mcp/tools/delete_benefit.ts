import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "delete_benefit",
  title: "Delete a benefit",
  description: "Permanently delete one of the user's recorded benefits by id.",
  inputSchema: {
    id: z.string().min(1).describe("Benefit id from list_benefits."),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      throw new ToolError("Sign in as a KeyAtlas user to delete data.");
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("benefits")
      .delete()
      .eq("id", input.id)
      .select("id, name")
      .maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) throw new ToolError("Benefit not found among your benefits.");
    return {
      content: [{ type: "text", text: `Benefit deleted: ${data.name} (${data.id})` }],
      structuredContent: { deleted: { id: data.id, name: data.name } },
    };
  },
});
