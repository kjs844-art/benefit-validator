import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { BenefitRecord, ServiceRecord } from "./benefits";
import type { BenefitDraft } from "@/components/BenefitForm";

const SERVICE_COLUMNS =
  "id, name, provider, plan_name, account_label, timezone, subscription_status, trial_ends_at, notes";
const BENEFIT_COLUMNS =
  "id, service_id, name, unit, granted_amount, remaining_amount, monthly_cap, extra_limit_note, reset_rule, reset_anchor, observed_at, observed_precision, observed_timezone, source_kind, source_note";

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: async (): Promise<ServiceRecord[]> => {
      const { data, error } = await supabase
        .from("services")
        .select(SERVICE_COLUMNS)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as ServiceRecord[];
    },
  });
}

export function useBenefits() {
  return useQuery({
    queryKey: ["benefits"],
    queryFn: async (): Promise<BenefitRecord[]> => {
      const { data, error } = await supabase
        .from("benefits")
        .select(BENEFIT_COLUMNS)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as BenefitRecord[];
    },
  });
}

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("로그인이 필요합니다.");
  return data.user.id;
}

export interface ServiceDraft {
  id?: string;
  name: string;
  provider: string | null;
  plan_name: string | null;
  account_label: string | null;
  timezone: string;
  subscription_status: ServiceRecord["subscription_status"];
  trial_ends_at: string | null;
  notes: string | null;
}

export function useSaveService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (draft: ServiceDraft) => {
      const user_id = await currentUserId();
      const row = { ...draft, user_id };
      const { error } = draft.id
        ? await supabase.from("services").update(row).eq("id", draft.id)
        : await supabase.from("services").insert(row);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
      qc.invalidateQueries({ queryKey: ["benefits"] });
    },
  });
}

export function useSaveBenefit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (draft: BenefitDraft) => {
      const user_id = await currentUserId();
      const row = { ...draft, user_id };
      const { error } = draft.id
        ? await supabase.from("benefits").update(row).eq("id", draft.id)
        : await supabase.from("benefits").insert(row);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["benefits"] }),
  });
}

export function useSaveBenefits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (drafts: BenefitDraft[]) => {
      const user_id = await currentUserId();
      const { error } = await supabase
        .from("benefits")
        .insert(drafts.map((d) => ({ ...d, user_id })));
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["benefits"] }),
  });
}

export function useDeleteBenefit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("benefits").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["benefits"] }),
  });
}
