import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listBenefits from "./tools/list_benefits";
import createService from "./tools/create_service";
import addBenefit from "./tools/add_benefit";
import updateBenefit from "./tools/update_benefit";
import deleteBenefit from "./tools/delete_benefit";

// The OAuth issuer MUST be the direct Supabase host (the .lovable.cloud proxy
// is rejected by RFC 8414 issuer checks). The project ref is inlined at build
// time via Vite env replacement.
const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "benefit-validator",
  title: "Benefit Validator",
  version: "0.1.0",
  instructions:
    "Tools for Benefit Validator (남은혜택), an app that records remaining subscription benefits. Tools act as the signed-in user and only touch that user's own data. Amounts follow a strict accuracy rule: null means 'unknown' and 0 means an actual zero — never invent or merge values, keep units exactly as recorded, and preserve the time each value was observed (observed_at / observed_precision).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listBenefits, createService, addBenefit, updateBenefit, deleteBenefit],
});
