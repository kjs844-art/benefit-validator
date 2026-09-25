import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Archive, CirclePlus, Pencil, Sparkles, Trash2 } from "lucide-react";
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
  useServices,
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
      { title: "내 서비스 · KeyAtlas" },
      { name: "description", content: "찾았거나 직접 기록한 서비스와 남은 혜택을 관리합니다." },
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
  function set<K extends keyof ServiceDraft>(key: K, value: ServiceDraft[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }
  return (
    <form
      className="dark-panel mt-6 rounded-[1.75rem] p-6 sm:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = serviceSchema.safeParse({ name: draft.name });
        if (!parsed.success) {
          toast.error(parsed.error.issues[0]?.message ?? "입력을 확인해 주세요.");
          return;
        }
        onSubmit({ ...draft, name: draft.name.trim() });
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sidebar-primary">
            Service profile
          </p>
          <h2 className="mt-2 text-2xl font-bold text-sidebar-foreground">
            {draft.id ? "서비스 정보 수정" : "새 서비스 추가"}
          </h2>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-3 py-2 text-xs text-sidebar-foreground/55 hover:bg-sidebar-accent"
        >
          닫기
        </button>
      </div>
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="s-name" className="text-sidebar-foreground/70">
            서비스 이름
          </Label>
          <Input
            id="s-name"
            maxLength={120}
            value={draft.name}
            onChange={(event) => set("name", event.target.value)}
            placeholder="예: ChatGPT"
            className="h-12 border-sidebar-border bg-sidebar-accent text-sidebar-foreground placeholder:text-sidebar-foreground/30"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="s-plan" className="text-sidebar-foreground/70">
            요금제
          </Label>
          <Input
            id="s-plan"
            maxLength={120}
            value={draft.plan_name ?? ""}
            onChange={(event) => set("plan_name", event.target.value.trim() || null)}
            placeholder="예: Plus, Pro 체험"
            className="h-12 border-sidebar-border bg-sidebar-accent text-sidebar-foreground placeholder:text-sidebar-foreground/30"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="s-account" className="text-sidebar-foreground/70">
            계정 구분
          </Label>
          <Input
            id="s-account"
            maxLength={120}
            value={draft.account_label ?? ""}
            onChange={(event) => set("account_label", event.target.value.trim() || null)}
            placeholder="개인 / 업무용"
            className="h-12 border-sidebar-border bg-sidebar-accent text-sidebar-foreground placeholder:text-sidebar-foreground/30"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sidebar-foreground/70">현재 상태</Label>
          <Select
            value={draft.subscription_status}
            onValueChange={(value) => set("subscription_status", value as SubscriptionStatus)}
          >
            <SelectTrigger className="h-12 border-sidebar-border bg-sidebar-accent text-sidebar-foreground">
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
        <div className="space-y-2">
          <Label htmlFor="s-trial" className="text-sidebar-foreground/70">
            체험 종료일
          </Label>
          <Input
            id="s-trial"
            type="date"
            value={draft.trial_ends_at?.slice(0, 10) ?? ""}
            onChange={(event) =>
              set(
                "trial_ends_at",
                event.target.value ? new Date(event.target.value).toISOString() : null,
              )
            }
            className="h-12 border-sidebar-border bg-sidebar-accent text-sidebar-foreground"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="s-tz" className="text-sidebar-foreground/70">
            시간대
          </Label>
          <Input
            id="s-tz"
            maxLength={64}
            value={draft.timezone}
            onChange={(event) => set("timezone", event.target.value)}
            className="h-12 border-sidebar-border bg-sidebar-accent text-sidebar-foreground"
          />
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <Label htmlFor="s-notes" className="text-sidebar-foreground/70">
          메모
        </Label>
        <Textarea
          id="s-notes"
          maxLength={500}
          value={draft.notes ?? ""}
          onChange={(event) => set("notes", event.target.value.trim() || null)}
          className="border-sidebar-border bg-sidebar-accent text-sidebar-foreground placeholder:text-sidebar-foreground/30"
        />
      </div>
      <div className="mt-6 flex gap-2">
        <Button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-sidebar-primary text-sidebar-primary-foreground"
        >
          {busy ? "저장 중…" : "서비스 저장"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="rounded-xl text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          취소
        </Button>
      </div>
    </form>
  );
}

function ServicesPage() {
  const { user } = useAuth();
  const services = useServices();
  const benefits = useBenefits();
  const saveService = useSaveService();
  const deleteService = useDeleteService();
  const saveBenefit = useSaveBenefit();
  const deleteBenefit = useDeleteBenefit();
  const [serviceForm, setServiceForm] = useState<ServiceDraft | null>(null);
  const [benefitForm, setBenefitForm] = useState<BenefitDraft | null>(null);
  function serviceToDraft(service: ServiceRecord): ServiceDraft {
    return {
      id: service.id,
      name: service.name,
      provider: service.provider,
      plan_name: service.plan_name,
      account_label: service.account_label,
      timezone: service.timezone,
      subscription_status: service.subscription_status,
      trial_ends_at: service.trial_ends_at,
      notes: service.notes,
    };
  }
  const serviceList = services.data ?? [];
  const benefitList = benefits.data ?? [];
  return (
    <AppShell email={user?.email}>
      <div className="rise flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-semibold text-primary">Account atlas</p>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl">내 서비스 지도</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
            찾은 서비스와 직접 추가한 계정을 한곳에서 관리하세요. 모르는 값은 그대로 모름으로
            남겨둡니다.
          </p>
        </div>
        <Button
          onClick={() => setServiceForm(emptyService())}
          className="rounded-xl bg-foreground text-background"
        >
          <CirclePlus className="mr-2 size-4" />
          서비스 추가
        </Button>
      </div>
      {serviceForm ? (
        <ServiceForm
          key={serviceForm.id ?? "new-service"}
          initial={serviceForm}
          busy={saveService.isPending}
          onCancel={() => setServiceForm(null)}
          onSubmit={(draft) =>
            saveService.mutate(draft, {
              onSuccess: () => {
                toast.success("서비스를 저장했습니다.");
                setServiceForm(null);
              },
              onError: (error) => toast.error(`저장 실패: ${error.message}`),
            })
          }
        />
      ) : null}
      <div className="mt-9 flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
          <Archive className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold">저장된 서비스</h2>
          <p className="text-xs text-muted-foreground">
            총 {serviceList.length}개 서비스 · {benefitList.length}개 혜택
          </p>
        </div>
      </div>
      {services.isLoading ? (
        <Skeleton className="mt-5 h-48 rounded-2xl" />
      ) : services.error ? (
        <p className="mt-6 rounded-2xl bg-destructive/10 p-5 text-sm text-destructive">
          데이터를 불러오지 못했습니다.
        </p>
      ) : serviceList.length === 0 ? (
        <div className="surface-panel mt-5 p-10 text-center">
          <Sparkles className="mx-auto size-7 text-primary" />
          <h3 className="mt-4 text-lg font-bold">아직 저장된 서비스가 없습니다.</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            계정 분석 결과를 저장하거나 직접 서비스를 추가해보세요.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {serviceList.map((service) => {
            const list = benefitList.filter((benefit) => benefit.service_id === service.id);
            return (
              <section key={service.id} className="surface-panel overflow-hidden">
                <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 px-5 py-4 sm:px-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-foreground text-base font-bold text-background">
                      {service.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-bold">{service.name}</h2>
                      <p className="truncate text-xs text-muted-foreground">
                        {service.plan_name ?? "요금제 모름"} ·{" "}
                        {STATUS_LABELS[service.subscription_status]}
                        {service.account_label ? ` · ${service.account_label}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setBenefitForm(emptyBenefitDraft(service.id, service.timezone))
                      }
                      className="rounded-xl"
                    >
                      <CirclePlus className="mr-1.5 size-3.5" />
                      혜택
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setServiceForm(serviceToDraft(service))}
                      className="rounded-xl"
                    >
                      <Pencil className="mr-1.5 size-3.5" />
                      수정
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (!confirm(`'${service.name}'과 연결된 혜택을 모두 삭제할까요?`)) return;
                        deleteService.mutate(service.id, {
                          onSuccess: () => toast.success("삭제했습니다."),
                          onError: (error) => toast.error(`삭제 실패: ${error.message}`),
                        });
                      }}
                      className="rounded-xl text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </header>
                <div className="p-5 sm:p-6">
                  {benefitForm?.service_id === service.id ? (
                    <div className="mb-5">
                      <BenefitForm
                        key={benefitForm.id ?? `new-${benefitForm.service_id}`}
                        initial={benefitForm}
                        submitting={saveBenefit.isPending}
                        onCancel={() => setBenefitForm(null)}
                        onSubmit={(draft) =>
                          saveBenefit.mutate(draft, {
                            onSuccess: () => {
                              toast.success("혜택을 저장했습니다.");
                              setBenefitForm(null);
                            },
                            onError: (error) => toast.error(`저장 실패: ${error.message}`),
                          })
                        }
                      />
                    </div>
                  ) : null}
                  {list.length === 0 ? (
                    <p className="text-sm text-muted-foreground">등록된 혜택이 없습니다.</p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {list.map((benefit) => (
                        <BenefitCard
                          key={benefit.id}
                          benefit={benefit}
                          onEdit={() => setBenefitForm({ ...benefit })}
                          onDelete={() => {
                            if (!confirm(`'${benefit.name}' 혜택을 삭제할까요?`)) return;
                            deleteBenefit.mutate(benefit.id, {
                              onSuccess: () => toast.success("삭제했습니다."),
                              onError: (error) => toast.error(`삭제 실패: ${error.message}`),
                            });
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
