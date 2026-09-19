import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { BenefitCard } from "@/components/BenefitCard";
import { BenefitForm, emptyBenefitDraft, type BenefitDraft } from "@/components/BenefitForm";
import { useAuth } from "@/hooks/useAuth";
import {
  useBenefits,
  useDeleteBenefit,
  useDeleteService,
  useSaveBenefit,
  useSaveService,
  type ServiceDraft,
} from "@/lib/data";
import { STATUS_LABELS, type ServiceRecord, type SubscriptionStatus } from "@/lib/benefits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/services")({
  head: () => ({
    meta: [
      { title: "서비스·혜택 · 남은혜택" },
      { name: "description", content: "구독 서비스 계정을 등록하고 혜택을 직접 입력·수정·삭제합니다." },
      { property: "og:title", content: "서비스·혜택 · 남은혜택" },
      { property: "og:description", content: "서비스와 혜택 기록 관리." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ServicesPage,
});

const serviceSchema = z.object({
  name: z.string().trim().min(1, "서비스 이름을 입력해 주세요.").max(120),
});

function emptyService(): ServiceDraft {
  return {
    name: "",
    provider: null,
    plan_name: null,
    account_label: null,
    timezone: "Asia/Seoul",
    subscription_status: "active",
    trial_ends_at: null,
    notes: null,
  };
}

function ServiceForm({
  initial,
  onCancel,
  onSubmit,
  busy,
}: {
  initial: ServiceDraft;
  onCancel: () => void;
  onSubmit: (draft: ServiceDraft) => void;
  busy?: boolean;
}) {
  const [draft, setDraft] = useState<ServiceDraft>(initial);
  function set<K extends keyof ServiceDraft>(k: K, v: ServiceDraft[K]) {
    setDraft((p) => ({ ...p, [k]: v }));
  }
  return (
    <form
      className="surface-panel space-y-4 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const parsed = serviceSchema.safeParse({ name: draft.name });
        if (!parsed.success) {
          toast.error(parsed.error.issues[0]?.message ?? "입력을 확인해 주세요.");
          return;
        }
        onSubmit({ ...draft, name: draft.name.trim() });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="s-name">서비스 이름</Label>
          <Input
            id="s-name"
            maxLength={120}
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="예: 스트리밍 플러스"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-plan">요금제 (선택)</Label>
          <Input
            id="s-plan"
            maxLength={120}
            defaultValue={draft.plan_name ?? ""}
            onChange={(e) => set("plan_name", e.target.value.trim() || null)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-account">계정 구분 (선택)</Label>
          <Input
            id="s-account"
            maxLength={120}
            defaultValue={draft.account_label ?? ""}
            onChange={(e) => set("account_label", e.target.value.trim() || null)}
            placeholder="예: 본인 계정 / 업무용"
          />
        </div>
        <div className="space-y-1.5">
          <Label>구독 상태</Label>
          <Select
            value={draft.subscription_status}
            onValueChange={(v) => set("subscription_status", v as SubscriptionStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-trial">무료 체험 종료일 (선택)</Label>
          <Input
            id="s-trial"
            type="date"
            defaultValue={draft.trial_ends_at ? draft.trial_ends_at.slice(0, 10) : ""}
            onChange={(e) =>
              set("trial_ends_at", e.target.value ? new Date(e.target.value).toISOString() : null)
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-tz">시간대</Label>
          <Input
            id="s-tz"
            maxLength={64}
            value={draft.timezone}
            onChange={(e) => set("timezone", e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="s-notes">메모 (선택)</Label>
        <Textarea
          id="s-notes"
          maxLength={500}
          defaultValue={draft.notes ?? ""}
          onChange={(e) => set("notes", e.target.value.trim() || null)}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>
          {busy ? "저장 중…" : "저장"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          취소
        </Button>
      </div>
    </form>
  );
}

function ServicesPage() {
  const { user } = useAuth();
  const services = useServicesQuery();
  const benefits = useBenefits();
  const saveService = useSaveService();
  const deleteService = useDeleteService();
  const saveBenefit = useSaveBenefit();
  const deleteBenefit = useDeleteBenefit();

  const [serviceForm, setServiceForm] = useState<ServiceDraft | null>(null);
  const [benefitForm, setBenefitForm] = useState<BenefitDraft | null>(null);

  function serviceToDraft(s: ServiceRecord): ServiceDraft {
    return {
      id: s.id,
      name: s.name,
      provider: s.provider,
      plan_name: s.plan_name,
      account_label: s.account_label,
      timezone: s.timezone,
      subscription_status: s.subscription_status,
      trial_ends_at: s.trial_ends_at,
      notes: s.notes,
    };
  }

  return (
    <AppShell email={user?.email}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">서비스·혜택</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            서비스 계정을 등록하고 혜택을 직접 입력합니다. 자동 조회는 하지 않습니다.
          </p>
        </div>
        <Button onClick={() => setServiceForm(emptyService())}>서비스 추가</Button>
      </div>

      {serviceForm ? (
        <div className="mt-4">
          <ServiceForm
            initial={serviceForm}
            busy={saveService.isPending}
            onCancel={() => setServiceForm(null)}
            onSubmit={(draft) =>
              saveService.mutate(draft, {
                onSuccess: () => {
                  toast.success("서비스를 저장했습니다.");
                  setServiceForm(null);
                },
                onError: (e) => toast.error(`저장 실패: ${e.message}`),
              })
            }
          />
        </div>
      ) : null}

      {services.isLoading ? (
        <Skeleton className="mt-6 h-40" />
      ) : services.error ? (
        <p className="mt-6 text-sm text-destructive">데이터를 불러오지 못했습니다.</p>
      ) : (services.data ?? []).length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">등록된 서비스가 없습니다.</p>
      ) : (
        <div className="mt-6 space-y-8">
          {(services.data ?? []).map((service) => {
            const list = (benefits.data ?? []).filter((b) => b.service_id === service.id);
            return (
              <section key={service.id} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold">{service.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {service.plan_name ?? "요금제 모름"} ·{" "}
                      {STATUS_LABELS[service.subscription_status]}
                      {service.account_label ? ` · ${service.account_label}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setBenefitForm(emptyBenefitDraft(service.id, service.timezone))}
                    >
                      혜택 추가
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setServiceForm(serviceToDraft(service))}
                    >
                      서비스 수정
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (!confirm(`'${service.name}' 과(와) 그 혜택을 모두 삭제할까요?`)) return;
                        deleteService.mutate(service.id, {
                          onSuccess: () => toast.success("삭제했습니다."),
                          onError: (e) => toast.error(`삭제 실패: ${e.message}`),
                        });
                      }}
                    >
                      삭제
                    </Button>
                  </div>
                </div>

                {benefitForm && benefitForm.service_id === service.id ? (
                  <BenefitForm
                    initial={benefitForm}
                    submitting={saveBenefit.isPending}
                    onCancel={() => setBenefitForm(null)}
                    onSubmit={(draft) =>
                      saveBenefit.mutate(draft, {
                        onSuccess: () => {
                          toast.success("혜택을 저장했습니다.");
                          setBenefitForm(null);
                        },
                        onError: (e) => toast.error(`저장 실패: ${e.message}`),
                      })
                    }
                  />
                ) : null}

                {list.length === 0 ? (
                  <p className="text-sm text-muted-foreground">등록된 혜택이 없습니다.</p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {list.map((b) => (
                      <BenefitCard
                        key={b.id}
                        benefit={b}
                        onEdit={() =>
                          setBenefitForm({
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
                          })
                        }
                        onDelete={() => {
                          if (!confirm(`'${b.name}' 혜택을 삭제할까요?`)) return;
                          deleteBenefit.mutate(b.id, {
                            onSuccess: () => toast.success("삭제했습니다."),
                            onError: (e) => toast.error(`삭제 실패: ${e.message}`),
                          });
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

// 별칭: 훅 이름 충돌을 피하기 위한 래퍼
function useServicesQuery() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return useServicesImpl();
}

import { useServices as useServicesImpl } from "@/lib/data";
