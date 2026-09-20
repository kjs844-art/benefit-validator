import { useState } from "react";
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
import { RESET_RULE_LABELS, UNITS, type BenefitRecord, type ResetRule } from "@/lib/benefits";
import { z } from "zod";
import { toast } from "sonner";

export interface BenefitDraft {
  id?: string;
  service_id: string;
  name: string;
  unit: string;
  granted_amount: number | null;
  remaining_amount: number | null;
  monthly_cap: number | null;
  extra_limit_note: string | null;
  reset_rule: ResetRule;
  reset_anchor: string | null;
  observed_at: string;
  observed_precision: "minute" | "day";
  observed_timezone: string;
  source_kind: BenefitRecord["source_kind"];
  source_note: string | null;
}

const numberOrNull = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (trimmed === "") return null; // 빈 칸 = 모름 (0 이 아님)
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
};

const schema = z.object({
  name: z.string().trim().min(1, "혜택 이름을 입력해 주세요.").max(120),
  unit: z.string().trim().min(1, "단위를 입력해 주세요.").max(20),
});

function toLocalInput(iso: string, precision: "minute" | "day") {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return precision === "day" ? date : `${date}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function BenefitForm({
  initial,
  onCancel,
  onSubmit,
  submitting,
}: {
  initial: BenefitDraft;
  onCancel: () => void;
  onSubmit: (draft: BenefitDraft) => void;
  submitting?: boolean;
}) {
  const [draft, setDraft] = useState<BenefitDraft>(initial);
  const [observedInput, setObservedInput] = useState(
    toLocalInput(initial.observed_at, initial.observed_precision),
  );

  function set<K extends keyof BenefitDraft>(key: K, value: BenefitDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ name: draft.name, unit: draft.unit });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "입력을 확인해 주세요.");
      return;
    }
    const observed = new Date(observedInput);
    if (Number.isNaN(observed.getTime())) {
      toast.error("확인 시점을 올바르게 입력해 주세요.");
      return;
    }
    onSubmit({ ...draft, name: draft.name.trim(), unit: draft.unit.trim(), observed_at: observed.toISOString() });
  }

  return (
    <form onSubmit={handleSubmit} className="surface-panel p-5">
      <fieldset className="space-y-4">
        <legend className="mb-4 text-sm font-semibold">혜택과 수량</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="b-name">혜택 이름</Label>
          <Input
            id="b-name"
            value={draft.name}
            maxLength={120}
            onChange={(e) => set("name", e.target.value)}
            placeholder="예: 무료 음료 쿠폰"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="b-unit">단위</Label>
          <Input
            id="b-unit"
            list="unit-suggestions"
            value={draft.unit}
            maxLength={20}
            onChange={(e) => set("unit", e.target.value)}
            placeholder="예: 회, GB, 크레딧"
          />
          <datalist id="unit-suggestions">
            {UNITS.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="b-granted">지급량 (모르면 비워 두세요)</Label>
          <Input
            id="b-granted"
            inputMode="decimal"
            defaultValue={draft.granted_amount ?? ""}
            onChange={(e) => set("granted_amount", numberOrNull(e.target.value))}
            placeholder="모름"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="b-remaining">남은 양 (모르면 비워 두세요)</Label>
          <Input
            id="b-remaining"
            inputMode="decimal"
            defaultValue={draft.remaining_amount ?? ""}
            onChange={(e) => set("remaining_amount", numberOrNull(e.target.value))}
            placeholder="모름"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="b-cap">월 상한 (선택)</Label>
          <Input
            id="b-cap"
            inputMode="decimal"
            defaultValue={draft.monthly_cap ?? ""}
            onChange={(e) => set("monthly_cap", numberOrNull(e.target.value))}
            placeholder="없음/모름"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        빈 칸은 &quot;모름&quot;으로 저장됩니다. 0 은 실제로 0 일 때만 입력하세요.
      </p>
      </fieldset>

      <fieldset className="mt-6 space-y-4 border-t border-border pt-5">
        <legend className="pr-3 text-sm font-semibold">리셋과 제한</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>리셋 주기</Label>
          <Select value={draft.reset_rule} onValueChange={(v) => set("reset_rule", v as ResetRule)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(RESET_RULE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="b-anchor">다음 리셋 기준 시각 (선택)</Label>
          <Input
            id="b-anchor"
            type="datetime-local"
            defaultValue={draft.reset_anchor ? toLocalInput(draft.reset_anchor, "minute") : ""}
            onChange={(e) =>
              set("reset_anchor", e.target.value ? new Date(e.target.value).toISOString() : null)
            }
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="b-extra">추가 제한 / 메모 (선택)</Label>
        <Textarea id="b-extra" maxLength={500} defaultValue={draft.extra_limit_note ?? ""} onChange={(e) => set("extra_limit_note", e.target.value.trim() || null)} placeholder="예: 기기당 100개 제한이 따로 있음" />
      </div>
      </fieldset>

      <fieldset className="mt-6 space-y-4 border-t border-border pt-5">
        <legend className="pr-3 text-sm font-semibold">확인 시점</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="b-observed">이 값을 확인한 시점</Label>
          <Input
            id="b-observed"
            type={draft.observed_precision === "day" ? "date" : "datetime-local"}
            value={observedInput}
            onChange={(e) => setObservedInput(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>확인 시점 정밀도</Label>
          <Select
            value={draft.observed_precision}
            onValueChange={(v) => {
              const precision = v as "minute" | "day";
              set("observed_precision", precision);
              setObservedInput(toLocalInput(new Date(observedInput).toISOString(), precision));
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minute">날짜와 시각까지 안다</SelectItem>
              <SelectItem value="day">날짜만 안다</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      </fieldset>

      <div className="mt-6 flex gap-2 border-t border-border pt-5">
        <Button type="submit" disabled={submitting}>
          {submitting ? "저장 중…" : "저장"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          취소
        </Button>
      </div>
    </form>
  );
}

export function emptyBenefitDraft(serviceId: string, timezone = "Asia/Seoul"): BenefitDraft {
  return {
    service_id: serviceId,
    name: "",
    unit: "회",
    granted_amount: null,
    remaining_amount: null,
    monthly_cap: null,
    extra_limit_note: null,
    reset_rule: "none",
    reset_anchor: null,
    observed_at: new Date().toISOString(),
    observed_precision: "minute",
    observed_timezone: timezone,
    source_kind: "manual",
    source_note: null,
  };
}
