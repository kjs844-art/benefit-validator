import assert from "node:assert/strict";
import test from "node:test";
import { createKeyAtlasTools, KEYATLAS_WEBMCP_TOOL_NAMES } from "../src/lib/webmcp/tools";

function createHarness() {
  const service = {
    id: "s1",
    name: "Example AI",
    provider: null,
    plan_name: "Trial",
    account_label: null,
    timezone: "Asia/Seoul",
    subscription_status: "trial" as const,
    trial_ends_at: new Date(Date.now() + 3 * 86_400_000).toISOString(),
    notes: null,
  };
  const benefit = {
    id: "b1",
    service_id: "s1",
    name: "AI credits",
    unit: "credits",
    granted_amount: 50,
    remaining_amount: 12,
    monthly_cap: null,
    extra_limit_note: null,
    reset_rule: "none" as const,
    reset_anchor: null,
    observed_at: new Date().toISOString(),
    observed_precision: "minute" as const,
    observed_timezone: "Asia/Seoul",
    source_kind: "email" as const,
    source_note: null,
  };
  const discovery = {
    id: "d1",
    service_name: "Example AI",
    benefit_kind: "credit",
    benefit_name: "Welcome credits",
    unit: "credits",
    granted_amount: 50,
    remaining_amount: null,
    trial_days: null,
    remaining_days: null,
    expires_at: null,
    evidence_date: new Date().toISOString(),
    confidence: "high",
  };
  let navigated = "";
  const tools = createKeyAtlasTools({
    services: [service],
    benefits: [benefit],
    discoveries: [discovery],
    navigate: (path) => {
      navigated = path;
    },
  });
  return { tools, getNavigated: () => navigated };
}

test("registers the exact public WebMCP tool contract", () => {
  const { tools } = createHarness();
  assert.deepEqual(
    tools.map((tool) => tool.name),
    [...KEYATLAS_WEBMCP_TOOL_NAMES],
  );
  assert.equal(new Set(tools.map((tool) => tool.name)).size, 5);
  for (const tool of tools) {
    assert.equal(tool.inputSchema["additionalProperties"], false);
    assert.equal(tool.annotations.consequentialHint, false);
  }
});

test("keeps unknown balances null and excludes email subjects", async () => {
  const { tools } = createHarness();
  const overview = JSON.parse(await tools[0]!.execute({}));
  assert.equal(overview.serviceCount, 1);
  assert.equal(overview.benefitCount, 1);
  const discovered = JSON.parse(await tools[2]!.execute({ category: "credit", limit: 10 }));
  assert.equal(discovered.discoveries[0].remainingAmount, null);
  assert.equal(JSON.stringify(discovered).includes("subject"), false);
});

test("navigates only to an allow-listed KeyAtlas view", async () => {
  const { tools, getNavigated } = createHarness();
  await tools[4]!.execute({ view: "timeline" });
  assert.equal(getNavigated(), "/schedule");
  assert.throws(() => tools[4]!.execute({ view: "https://example.com" }), /INVALID_INPUT/);
});
