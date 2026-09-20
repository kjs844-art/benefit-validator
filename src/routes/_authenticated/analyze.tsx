import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { analyzeMaterial, getAiUsage, type ExtractedBenefit } from "@/lib/ai.functions";
import { useSaveBenefits, useSaveService, useServices } from "@/lib/data";
import type { BenefitDraft } from "@/components/BenefitForm";
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
import { formatAmount, RESET_RULE_LABELS } from "@/lib/benefits";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/analyze")({
  head: () => ({
    meta: [
      { title: "AI 자료 분석 · KeyAtlas" },
      {
        name: "description",
        content: "결제 안내문이나 화면 캡처를 붙여넣으면 혜택 항목을 정리해 검토 후 저장합니다.",
      },
      { property: "og:title", content: "AI 자료 분석 · KeyAtlas" },
      { property: "og:description", content: "붙여넣은 자료에서 혜택 항목을 정리합니다." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalyzePage,
});

const NEW_SERVICE = "__new__";

interface ReviewRow extends ExtractedBenefit {
  include: boolean;
  targetServiceId: string;
}

function AnalyzePage() {
  const { user } = useAuth();
  const analyze = useServerFn(analyzeMaterial);
  const usageFn = useServerFn(getAiUsage);
  const services = useServices();
  const saveService = useSaveService();
  const saveBenefits = useSaveBenefits();

  const usage = useQuery({ queryKey: ["ai-usage"], queryFn: () => usageFn({}) });

  const [text, setText] = useState("");
  const [materialDate, setMaterialDate] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [rows, setRows] = useState<ReviewRow[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const run = useMutation({
    mutationFn: async () => {
      return analyze({
        data: {
          ...(text.trim() ? { text: text.trim() } : {}),
          ...(imageDataUrl ? { imageDataUrl } : {}),
          ...(materialDate ? { materialDate } : {}),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul",
        },
      });
    },
    onSuccess: (result) => {
      setWarnings(result.warnings ?? []);
      setRows(
        (result.benefits ?? []).map((b) => ({
          ...b,
          include: true,
          targetServiceId:
            (services.data ?? []).find((s) => s.name.trim() === b.service_name.trim())?.id ??
            NEW_SERVICE,
        })),
      );
      usage.refetch();
      if ((result.benefits ?? []).length === 0)
        toast.message("자료에서 혜택 항목을 찾지 못했습니다.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function onFile(file: File) {
    if (file.size > 4_000_000) {
      toast.error("이미지는 4MB 이하만 업로드할 수 있습니다.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(String(reader.result));
    reader.readAsDataURL(file);
  }

  function updateRow(index: number, patch: Partial<ReviewRow>) {
    setRows((prev) => (prev ? prev.map((r, i) => (i === index ? { ...r, ...patch } : r)) : prev));
  }

  async function saveAll() {
    if (!rows) return;
    const chosen = rows.filter((r) => r.include);
    if (chosen.length === 0) {
      toast.error("저장할 항목을 선택해 주세요.");
      return;
    }
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("로그인이 필요합니다.");
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul";
      const serviceIdByName = new Map<string, string>();
      for (const s of services.data ?? []) serviceIdByName.set(s.name.trim(), s.id);

      const drafts: BenefitDraft[] = [];
      for (const row of chosen) {
        let serviceId = row.targetServiceId;
        if (serviceId === NEW_SERVICE) {
          const key = row.service_name.trim();
          const existing = serviceIdByName.get(key);
          if (existing) {
            serviceId = existing;
          } else {
            await saveService.mutateAsync({
              name: key || "이름 없는 서비스",
              provider: null,
              plan_name: row.plan_name,
              account_label: null,
              timezone: tz,
              subscription_status: "unknown",
              trial_ends_at: null,
              notes: null,
            });
            const { data: created } = await supabase
              .from("services")
              .select("id")
              .eq("name", key || "이름 없는 서비스")
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            if (!created?.id) throw new Error("서비스 생성에 실패했습니다.");
            serviceId = created.id;
            serviceIdByName.set(key, created.id);
          }
        }

        // 날짜만 있는 자료에는 가짜 시각을 붙이지 않습니다.
        const hasTime = Boolean(row.observed_time);
        const dateStr = row.observed_date ?? materialDate ?? null;
        const observedAt = dateStr
          ? new Date(hasTime ? `${dateStr}T${row.observed_time}` : `${dateStr}T00:00:00`)
          : new Date();
        drafts.push({
          service_id: serviceId,
          name: row.benefit_name,
          unit: row.unit,
          granted_amount: row.granted_amount,
          remaining_amount: row.remaining_amount,
          monthly_cap: row.monthly_cap,
          extra_limit_note: row.extra_limit_note,
          reset_rule: row.reset_rule,
          reset_anchor: null,
          observed_at: observedAt.toISOString(),
          observed_precision: dateStr && !hasTime ? "day" : "minute",
          observed_timezone: tz,
          source_kind: imageDataUrl ? "ai_image" : "ai_text",
          source_note: row.note ?? `AI 분석 (신뢰도 ${row.confidence})`,
        });
      }

      await saveBenefits.mutateAsync(drafts);
      toast.success(`${drafts.length}건을 저장했습니다.`);
      setRows(null);
      setText("");
      setImageDataUrl(null);
    } catch (e) {
      toast.error(`저장 실패: ${e instanceof Error ? e.message : "알 수 없는 오류"}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell email={user?.email}>
      <div className="rise flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-semibold text-primary">Evidence analyzer</p>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl">놓친 자료에서 다시 찾기</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            서비스 안내문, 결제 화면, 크레딧 캡처를 올리면 가입 서비스와 남은 혜택 후보로
            구조화합니다. 저장 전 모든 값을 직접 검토할 수 있습니다.
          </p>
        </div>
        {usage.data ? (
          <div className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground">
            오늘 분석 {usage.data.used} / {usage.data.limit}
          </div>
        ) : null}
      </div>

      <div className="dark-panel mt-8 space-y-5 rounded-[1.75rem] p-5 sm:p-8">
        <div className="space-y-1.5">
          <Label htmlFor="material" className="text-sidebar-foreground/70">
            자료 텍스트
          </Label>
          <Textarea
            id="material"
            rows={8}
            maxLength={20000}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="예: AI 서비스 가입 환영 메일 — 체험 크레딧 50개 지급, 2026-10-01 만료"
            className="min-h-48 resize-y border-sidebar-border bg-sidebar-accent text-sidebar-foreground placeholder:text-sidebar-foreground/30"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="material-date" className="text-sidebar-foreground/70">
              자료 기준 날짜
            </Label>
            <Input
              id="material-date"
              type="date"
              value={materialDate}
              onChange={(e) => setMaterialDate(e.target.value)}
              className="h-12 border-sidebar-border bg-sidebar-accent text-sidebar-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="capture" className="text-sidebar-foreground/70">
              화면 캡처 · 4MB 이하
            </Label>
            <Input
              id="capture"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
              className="h-12 border-sidebar-border bg-sidebar-accent text-sidebar-foreground file:text-sidebar-foreground"
            />
            {imageDataUrl ? (
              <p className="text-xs text-sidebar-primary">이미지가 준비되었습니다.</p>
            ) : null}
          </div>
        </div>
        <Button
          className="rounded-xl bg-sidebar-primary text-sidebar-primary-foreground"
          onClick={() => run.mutate()}
          disabled={run.isPending || (!text.trim() && !imageDataUrl)}
        >
          {run.isPending ? "분석 중… (최대 1분)" : "분석하기"}
        </Button>
      </div>

      {warnings.length > 0 ? (
        <ul className="mt-4 space-y-1 rounded-2xl border border-unknown/40 bg-unknown/10 p-4 text-xs text-unknown">
          {warnings.map((w) => (
            <li key={w}>· {w}</li>
          ))}
        </ul>
      ) : null}

      {rows ? (
        <div className="mt-8 space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Review</p>
            <h2 className="mt-2 text-2xl font-bold">발견한 항목 검토</h2>
            <p className="text-sm text-muted-foreground">
              값이 비어 있으면 &quot;모름&quot;으로 저장됩니다. 잘못된 값은 저장 후 서비스·혜택
              화면에서 수정할 수 있습니다.
            </p>
          </div>
          {rows.map((row, i) => (
            <div
              key={`${row.service_name}-${row.benefit_name}-${i}`}
              className="surface-panel p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-3 text-sm font-bold">
                  <input
                    type="checkbox"
                    checked={row.include}
                    onChange={(e) => updateRow(i, { include: e.target.checked })}
                  />
                  {row.service_name} · {row.benefit_name}
                </label>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                  신뢰도 {row.confidence}
                </span>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-4">
                <div className="space-y-1">
                  <Label className="text-xs">지급량</Label>
                  <Input
                    defaultValue={row.granted_amount ?? ""}
                    placeholder="모름"
                    onChange={(e) =>
                      updateRow(i, {
                        granted_amount:
                          e.target.value.trim() === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">남은 양</Label>
                  <Input
                    defaultValue={row.remaining_amount ?? ""}
                    placeholder="모름"
                    onChange={(e) =>
                      updateRow(i, {
                        remaining_amount:
                          e.target.value.trim() === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">단위</Label>
                  <Input
                    defaultValue={row.unit}
                    onChange={(e) => updateRow(i, { unit: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">저장 위치</Label>
                  <Select
                    value={row.targetServiceId}
                    onValueChange={(v) => updateRow(i, { targetServiceId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NEW_SERVICE}>새 서비스로 만들기</SelectItem>
                      {(services.data ?? []).map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {RESET_RULE_LABELS[row.reset_rule]} · 월 상한{" "}
                {formatAmount(row.monthly_cap, row.unit)}
                {row.observed_date
                  ? ` · 자료상 확인일 ${row.observed_date}${row.observed_time ? ` ${row.observed_time}` : " (시각 없음)"}`
                  : " · 확인 시점 모름"}
                {row.note ? ` · ${row.note}` : ""}
              </p>
            </div>
          ))}
          <div className="sticky bottom-4 flex gap-2 rounded-2xl border border-border bg-background/90 p-3 shadow-lg backdrop-blur-xl">
            <Button className="rounded-xl" onClick={saveAll} disabled={saving}>
              {saving ? "저장 중…" : "선택 항목 저장"}
            </Button>
            <Button variant="ghost" onClick={() => setRows(null)}>
              결과 버리기
            </Button>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
