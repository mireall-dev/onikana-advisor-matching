"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  INDUSTRIES,
  SPECIALTIES,
  AREAS,
  type AdvisorProfile,
  type AdvisorAchievement,
} from "@/types/database";

const achievementSchema = z.object({
  company: z.string().trim().min(1, "企業名を入力してください").max(120),
  description: z.string().trim().min(1, "説明を入力してください").max(500),
  result: z.string().trim().max(500),
});

const profileSchema = z.object({
  displayName: z.string().trim().min(1, "表示名を入力してください").max(60),
  catchphrase: z.string().trim().max(80),
  industries: z.array(z.enum(INDUSTRIES)).max(INDUSTRIES.length),
  specialties: z.array(z.enum(SPECIALTIES)).max(SPECIALTIES.length),
  areas: z.array(z.enum(AREAS)).max(AREAS.length),
  careerSummary: z.string().trim().max(2000),
  connections: z.string().trim().max(1000),
  hourlyRate: z
    .number({ message: "数値で入力してください" })
    .int("整数で入力してください")
    .min(0, "0以上で入力してください")
    .max(1_000_000, "1,000,000円以下で入力してください"),
  achievements: z.array(achievementSchema).max(20, "実績は20件までです"),
});

type ProfileErrors = Partial<Record<keyof z.infer<typeof profileSchema>, string>>;

export default function AdvisorProfileEditPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ProfileErrors>({});

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [catchphrase, setCatchphrase] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [careerSummary, setCareerSummary] = useState("");
  const [connections, setConnections] = useState("");
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const [achievements, setAchievements] = useState<AdvisorAchievement[]>([]);

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    const { data: profile } = await supabase
      .from("advisor_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profile) {
      const p = profile as AdvisorProfile;
      setCatchphrase(p.catchphrase ?? "");
      setSelectedIndustries(p.industries ?? []);
      setSelectedSpecialties(p.specialties ?? []);
      setSelectedAreas(p.areas ?? []);
      setCareerSummary(p.career_summary ?? "");
      setConnections(p.connections ?? "");
      setHourlyRate(p.hourly_rate ?? 0);
      setAchievements(p.achievements ?? []);
    }

    setDisplayName(user.display_name ?? "");
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchProfile();
    }
  }, [authLoading, user, fetchProfile]);

  function toggleIndustry(industry: string) {
    setSelectedIndustries((prev) =>
      prev.includes(industry)
        ? prev.filter((i) => i !== industry)
        : [...prev, industry]
    );
  }

  function toggleSpecialty(specialty: string) {
    setSelectedSpecialties((prev) =>
      prev.includes(specialty)
        ? prev.filter((s) => s !== specialty)
        : [...prev, specialty]
    );
  }

  function toggleArea(area: string) {
    setSelectedAreas((prev) =>
      prev.includes(area)
        ? prev.filter((a) => a !== area)
        : [...prev, area]
    );
  }

  function addAchievement() {
    setAchievements((prev) => [
      ...prev,
      { company: "", description: "", result: "" },
    ]);
  }

  function removeAchievement(index: number) {
    setAchievements((prev) => prev.filter((_, i) => i !== index));
  }

  function updateAchievement(
    index: number,
    field: keyof AdvisorAchievement,
    value: string
  ) {
    setAchievements((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
  }

  async function handleSave() {
    if (!user || saving) return;

    setErrors({});

    const result = profileSchema.safeParse({
      displayName,
      catchphrase,
      industries: selectedIndustries,
      specialties: selectedSpecialties,
      areas: selectedAreas,
      careerSummary,
      connections,
      hourlyRate,
      achievements,
    });

    if (!result.success) {
      const fieldErrors: ProfileErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ProfileErrors | undefined;
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      toast.error("入力内容を確認してください");
      return;
    }

    setSaving(true);

    const [profileRes, userRes] = await Promise.all([
      supabase
        .from("advisor_profiles")
        .update({
          catchphrase: result.data.catchphrase,
          industries: result.data.industries,
          specialties: result.data.specialties,
          areas: result.data.areas,
          career_summary: result.data.careerSummary,
          connections: result.data.connections,
          hourly_rate: result.data.hourlyRate,
          achievements: result.data.achievements,
        })
        .eq("user_id", user.id),
      supabase
        .from("users")
        .update({ display_name: result.data.displayName })
        .eq("id", user.id),
    ]);

    if (profileRes.error || userRes.error) {
      toast.error("保存に失敗しました");
    } else {
      toast.success("プロフィールを更新しました");
    }

    setSaving(false);
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#0F569D]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[#6B7280]">ログインしてください</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="animate-fade-in-up">
        <h1 className="mb-6 font-heading text-2xl font-bold text-[#1A1A2E]">
          プロフィール編集
        </h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#1A1A2E]">
              基本情報
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">表示名</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="表示名を入力"
                  className={errors.displayName ? "border-[#D42027]" : ""}
                />
                {errors.displayName && (
                  <p className="text-[#D42027] text-sm">{errors.displayName}</p>
                )}
              </div>

              {/* Catchphrase */}
              <div className="space-y-2">
                <Label htmlFor="catchphrase">キャッチコピー</Label>
                <Input
                  id="catchphrase"
                  value={catchphrase}
                  onChange={(e) => setCatchphrase(e.target.value)}
                  placeholder="あなたの強みを一言で表現してください"
                  className={errors.catchphrase ? "border-[#D42027]" : ""}
                />
                {errors.catchphrase && (
                  <p className="text-[#D42027] text-sm">{errors.catchphrase}</p>
                )}
              </div>

              {/* Industries */}
              <div className="space-y-2">
                <Label>得意業界</Label>
                <div className="flex flex-wrap gap-3">
                  {INDUSTRIES.map((industry) => (
                    <label
                      key={industry}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedIndustries.includes(industry)}
                        onCheckedChange={() => toggleIndustry(industry)}
                      />
                      <span className="text-sm text-[#1A1A2E]">
                        {industry}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Specialties */}
              <div className="space-y-2">
                <Label>得意営業領域</Label>
                <div className="flex flex-wrap gap-3">
                  {SPECIALTIES.map((specialty) => (
                    <label
                      key={specialty}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedSpecialties.includes(specialty)}
                        onCheckedChange={() => toggleSpecialty(specialty)}
                      />
                      <span className="text-sm text-[#1A1A2E]">
                        {specialty}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Areas */}
              <div className="space-y-2">
                <Label>対応エリア</Label>
                <div className="flex flex-wrap gap-3">
                  {AREAS.map((area) => (
                    <label
                      key={area}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedAreas.includes(area)}
                        onCheckedChange={() => toggleArea(area)}
                      />
                      <span className="text-sm text-[#1A1A2E]">
                        {area}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Career Summary */}
              <div className="space-y-2">
                <Label htmlFor="careerSummary">経歴サマリ</Label>
                <Textarea
                  id="careerSummary"
                  value={careerSummary}
                  onChange={(e) => setCareerSummary(e.target.value)}
                  rows={6}
                  placeholder="これまでの経歴や実績を記述してください"
                  className={errors.careerSummary ? "border-[#D42027]" : ""}
                />
                {errors.careerSummary && (
                  <p className="text-[#D42027] text-sm">{errors.careerSummary}</p>
                )}
              </div>

              {/* Connections */}
              <div className="space-y-2">
                <Label htmlFor="connections">紹介可能な人脈</Label>
                <Textarea
                  id="connections"
                  value={connections}
                  onChange={(e) => setConnections(e.target.value)}
                  rows={3}
                  placeholder="紹介可能な人脈について記述してください"
                  className={errors.connections ? "border-[#D42027]" : ""}
                />
                {errors.connections && (
                  <p className="text-[#D42027] text-sm">{errors.connections}</p>
                )}
              </div>

              {/* Hourly Rate */}
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">参考報酬</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="hourlyRate"
                    type="number"
                    value={hourlyRate || ""}
                    onChange={(e) =>
                      setHourlyRate(
                        e.target.value === ""
                          ? 0
                          : parseInt(e.target.value, 10)
                      )
                    }
                    placeholder="10000"
                    className={`max-w-48 ${errors.hourlyRate ? "border-[#D42027]" : ""}`}
                    min={0}
                  />
                  <span className="text-sm text-[#6B7280]">円/時間</span>
                </div>
                {errors.hourlyRate && (
                  <p className="text-[#D42027] text-sm">{errors.hourlyRate}</p>
                )}
              </div>

              {/* Achievements */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>支援実績</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAchievement}
                    className="gap-1"
                  >
                    <Plus className="size-3.5" />
                    実績を追加
                  </Button>
                </div>
                {achievements.length === 0 && (
                  <p className="text-sm text-[#6B7280]">
                    まだ実績が登録されていません
                  </p>
                )}
                {achievements.map((achievement, index) => (
                  <Card key={index} className="bg-[#F8F9FB]">
                    <CardContent className="space-y-3 pt-4">
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-medium text-[#6B7280]">
                          実績 {index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeAchievement(index)}
                          className="text-[#D42027] hover:text-[#D42027]"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Input
                          value={achievement.company}
                          onChange={(e) =>
                            updateAchievement(
                              index,
                              "company",
                              e.target.value
                            )
                          }
                          placeholder="企業名"
                        />
                        <Input
                          value={achievement.description}
                          onChange={(e) =>
                            updateAchievement(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="説明"
                        />
                        <Input
                          value={achievement.result}
                          onChange={(e) =>
                            updateAchievement(
                              index,
                              "result",
                              e.target.value
                            )
                          }
                          placeholder="成果"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button
                  className="gap-1 bg-[#0F569D] text-white hover:bg-[#0A3D6E]"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  保存する
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
