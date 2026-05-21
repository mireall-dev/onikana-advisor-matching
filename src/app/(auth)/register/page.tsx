"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { toast } from "sonner";
import { Building2, UserCheck, ArrowLeft, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  INDUSTRIES,
  SPECIALTIES,
  AREAS,
  EMPLOYEE_SCALES,
} from "@/types/database";
import type { UserRole } from "@/types/database";

const companySchema = z.object({
  companyName: z.string().min(1, "会社名を入力してください"),
  contactName: z.string().min(1, "担当者名を入力してください"),
  email: z.string().min(1, "メールアドレスを入力してください").email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
  industry: z.string().min(1, "業界を選択してください"),
  employeeScale: z.string().min(1, "従業員規模を選択してください"),
  salesChallenge: z.string().optional(),
});

const advisorSchema = z.object({
  name: z.string().min(1, "氏名を入力してください"),
  email: z.string().min(1, "メールアドレスを入力してください").email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
  industries: z.array(z.string()).optional(),
  specialties: z.array(z.string()).optional(),
  areas: z.array(z.string()).optional(),
  careerSummary: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;
type AdvisorFormData = z.infer<typeof advisorSchema>;
type CompanyErrors = Partial<Record<keyof CompanyFormData, string>>;
type AdvisorErrors = Partial<Record<keyof AdvisorFormData, string>>;

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPendingMessage, setShowPendingMessage] = useState(false);

  // Company form state
  const [companyForm, setCompanyForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    password: "",
    industry: "",
    employeeScale: "",
    salesChallenge: "",
  });
  const [companyErrors, setCompanyErrors] = useState<CompanyErrors>({});

  // Advisor form state
  const [advisorForm, setAdvisorForm] = useState({
    name: "",
    email: "",
    password: "",
    industries: [] as string[],
    specialties: [] as string[],
    areas: [] as string[],
    careerSummary: "",
  });
  const [advisorErrors, setAdvisorErrors] = useState<AdvisorErrors>({});

  function handleRoleSelect(role: UserRole) {
    setSelectedRole(role);
    setStep(2);
  }

  function handleBack() {
    setStep(1);
    setSelectedRole(null);
    setCompanyErrors({});
    setAdvisorErrors({});
  }

  function toggleArrayItem(arr: string[], item: string): string[] {
    return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
  }

  async function handleCompanyRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCompanyErrors({});

    const result = companySchema.safeParse(companyForm);
    if (!result.success) {
      const fieldErrors: CompanyErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof CompanyFormData;
        fieldErrors[field] = issue.message;
      }
      setCompanyErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
      });

      if (authError || !authData.user) {
        toast.error("アカウント作成に失敗しました", {
          description: authError?.message ?? "しばらくしてから再度お試しください。",
        });
        return;
      }

      const { error: userError } = await supabase.from("users").insert({
        id: authData.user.id,
        email: result.data.email,
        display_name: result.data.contactName,
        role: "company" as UserRole,
      });

      if (userError) {
        toast.error("プロフィール作成に失敗しました", {
          description: userError.message,
        });
        return;
      }

      const { error: profileError } = await supabase.from("company_profiles").insert({
        user_id: authData.user.id,
        company_name: result.data.companyName,
        industry: result.data.industry,
        employee_scale: result.data.employeeScale,
        sales_challenge: result.data.salesChallenge ?? "",
      });

      if (profileError) {
        toast.error("企業プロフィール作成に失敗しました", {
          description: profileError.message,
        });
        return;
      }

      toast.success("アカウントを作成しました");
      router.push("/company/search");
    } catch {
      toast.error("エラーが発生しました", {
        description: "しばらくしてから再度お試しください。",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAdvisorRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAdvisorErrors({});

    const result = advisorSchema.safeParse(advisorForm);
    if (!result.success) {
      const fieldErrors: AdvisorErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof AdvisorFormData;
        fieldErrors[field] = issue.message;
      }
      setAdvisorErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
      });

      if (authError || !authData.user) {
        toast.error("アカウント作成に失敗しました", {
          description: authError?.message ?? "しばらくしてから再度お試しください。",
        });
        return;
      }

      const { error: userError } = await supabase.from("users").insert({
        id: authData.user.id,
        email: result.data.email,
        display_name: result.data.name,
        role: "advisor" as UserRole,
      });

      if (userError) {
        toast.error("プロフィール作成に失敗しました", {
          description: userError.message,
        });
        return;
      }

      const { error: profileError } = await supabase.from("advisor_profiles").insert({
        user_id: authData.user.id,
        industries: result.data.industries ?? [],
        specialties: result.data.specialties ?? [],
        areas: result.data.areas ?? [],
        career_summary: result.data.careerSummary ?? "",
        approval_status: "pending",
      });

      if (profileError) {
        toast.error("顧問プロフィール作成に失敗しました", {
          description: profileError.message,
        });
        return;
      }

      toast.success("アカウントを作成しました");
      setShowPendingMessage(true);
    } catch {
      toast.error("エラーが発生しました", {
        description: "しばらくしてから再度お試しください。",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (showPendingMessage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FB] px-4 py-12">
        <div className="w-full max-w-lg mx-auto">
          <Card className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm p-8">
            <CardContent className="text-center space-y-6 pt-6">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#E8F0FE]">
                <UserCheck className="size-8 text-[#0F569D]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-[#1A1A2E]">
                  登録が完了しました
                </h2>
                <p className="text-[#6B7280] text-sm leading-relaxed">
                  管理者の承認をお待ちください。
                  <br />
                  承認が完了次第、ご登録のメールアドレスに通知いたします。
                </p>
              </div>
              <Button
                onClick={() => router.push("/login")}
                className="bg-[#0F569D] hover:bg-[#0A3D6E] text-white"
              >
                ログインページへ
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FB] px-4 py-12">
      <div className="w-full max-w-lg mx-auto">
        {step === 1 && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-[#1A1A2E]">新規登録</h1>
              <p className="text-sm text-[#6B7280]">
                アカウントの種類を選択してください
              </p>
            </div>

            <div className="grid gap-4 stagger-children">
              <button
                type="button"
                onClick={() => handleRoleSelect("company")}
                className="w-full text-left"
              >
                <Card className="card-hover bg-white border border-[#E5E7EB] rounded-xl shadow-sm p-6 cursor-pointer transition-all hover:border-[#0F569D] hover:ring-2 hover:ring-[#0F569D]/20">
                  <CardContent className="flex items-start gap-4 p-0">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[#E8F0FE]">
                      <Building2 className="size-6 text-[#0F569D]" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-[#1A1A2E]">
                        企業として登録
                      </h3>
                      <p className="text-sm text-[#6B7280]">
                        営業顧問を探して、ビジネスを加速させましょう
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect("advisor")}
                className="w-full text-left"
              >
                <Card className="card-hover bg-white border border-[#E5E7EB] rounded-xl shadow-sm p-6 cursor-pointer transition-all hover:border-[#0F569D] hover:ring-2 hover:ring-[#0F569D]/20">
                  <CardContent className="flex items-start gap-4 p-0">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[#E8F0FE]">
                      <UserCheck className="size-6 text-[#0F569D]" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-[#1A1A2E]">
                        顧問として登録
                      </h3>
                      <p className="text-sm text-[#6B7280]">
                        あなたの営業経験を活かして、企業を支援しましょう
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </button>
            </div>

            <p className="text-center text-sm text-[#6B7280]">
              すでにアカウントをお持ちの方
              <Link href="/login" className="text-[#0F569D] hover:underline ml-1">
                ログイン
              </Link>
            </p>
          </div>
        )}

        {step === 2 && selectedRole === "company" && (
          <Card className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm p-8 animate-fade-in-up">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleBack}
                  type="button"
                >
                  <ArrowLeft className="size-4" />
                </Button>
                <div>
                  <CardTitle className="text-xl font-bold">
                    企業として登録
                  </CardTitle>
                  <CardDescription className="text-sm text-[#6B7280]">
                    企業情報を入力してください
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleCompanyRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">会社名</Label>
                  <Input
                    id="companyName"
                    placeholder="株式会社サンプル"
                    value={companyForm.companyName}
                    onChange={(e) =>
                      setCompanyForm({ ...companyForm, companyName: e.target.value })
                    }
                    required
                    disabled={isLoading}
                    className={companyErrors.companyName ? "border-[#D42027]" : ""}
                  />
                  {companyErrors.companyName && (
                    <p className="text-[#D42027] text-sm">{companyErrors.companyName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactName">担当者名</Label>
                  <Input
                    id="contactName"
                    placeholder="山田 太郎"
                    value={companyForm.contactName}
                    onChange={(e) =>
                      setCompanyForm({ ...companyForm, contactName: e.target.value })
                    }
                    required
                    disabled={isLoading}
                    className={companyErrors.contactName ? "border-[#D42027]" : ""}
                  />
                  {companyErrors.contactName && (
                    <p className="text-[#D42027] text-sm">{companyErrors.contactName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyEmail">メールアドレス</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    placeholder="example@company.co.jp"
                    value={companyForm.email}
                    onChange={(e) =>
                      setCompanyForm({ ...companyForm, email: e.target.value })
                    }
                    required
                    disabled={isLoading}
                    className={companyErrors.email ? "border-[#D42027]" : ""}
                  />
                  {companyErrors.email && (
                    <p className="text-[#D42027] text-sm">{companyErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyPassword">パスワード</Label>
                  <Input
                    id="companyPassword"
                    type="password"
                    placeholder="8文字以上"
                    value={companyForm.password}
                    onChange={(e) =>
                      setCompanyForm({ ...companyForm, password: e.target.value })
                    }
                    required
                    minLength={8}
                    disabled={isLoading}
                    className={companyErrors.password ? "border-[#D42027]" : ""}
                  />
                  {companyErrors.password && (
                    <p className="text-[#D42027] text-sm">{companyErrors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>業界</Label>
                  <Select
                    value={companyForm.industry}
                    onValueChange={(val) =>
                      setCompanyForm({ ...companyForm, industry: val ?? "" })
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger className={`w-full ${companyErrors.industry ? "border-[#D42027]" : ""}`}>
                      <SelectValue placeholder="業界を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {companyErrors.industry && (
                    <p className="text-[#D42027] text-sm">{companyErrors.industry}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>従業員規模</Label>
                  <Select
                    value={companyForm.employeeScale}
                    onValueChange={(val) =>
                      setCompanyForm({ ...companyForm, employeeScale: val ?? "" })
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger className={`w-full ${companyErrors.employeeScale ? "border-[#D42027]" : ""}`}>
                      <SelectValue placeholder="従業員規模を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYEE_SCALES.map((scale) => (
                        <SelectItem key={scale} value={scale}>
                          {scale}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {companyErrors.employeeScale && (
                    <p className="text-[#D42027] text-sm">{companyErrors.employeeScale}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salesChallenge">営業課題</Label>
                  <Textarea
                    id="salesChallenge"
                    placeholder="例: 新規顧客の開拓が進まない、大手企業へのアプローチ方法がわからない"
                    value={companyForm.salesChallenge}
                    onChange={(e) =>
                      setCompanyForm({ ...companyForm, salesChallenge: e.target.value })
                    }
                    disabled={isLoading}
                    rows={3}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#0F569D] hover:bg-[#0A3D6E] text-white w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      登録中...
                    </>
                  ) : (
                    "アカウントを作成"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 2 && selectedRole === "advisor" && (
          <Card className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm p-8 animate-fade-in-up">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleBack}
                  type="button"
                >
                  <ArrowLeft className="size-4" />
                </Button>
                <div>
                  <CardTitle className="text-xl font-bold">
                    顧問として登録
                  </CardTitle>
                  <CardDescription className="text-sm text-[#6B7280]">
                    プロフィール情報を入力してください
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleAdvisorRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="advisorName">氏名</Label>
                  <Input
                    id="advisorName"
                    placeholder="鈴木 一郎"
                    value={advisorForm.name}
                    onChange={(e) =>
                      setAdvisorForm({ ...advisorForm, name: e.target.value })
                    }
                    required
                    disabled={isLoading}
                    className={advisorErrors.name ? "border-[#D42027]" : ""}
                  />
                  {advisorErrors.name && (
                    <p className="text-[#D42027] text-sm">{advisorErrors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="advisorEmail">メールアドレス</Label>
                  <Input
                    id="advisorEmail"
                    type="email"
                    placeholder="example@advisor.co.jp"
                    value={advisorForm.email}
                    onChange={(e) =>
                      setAdvisorForm({ ...advisorForm, email: e.target.value })
                    }
                    required
                    disabled={isLoading}
                    className={advisorErrors.email ? "border-[#D42027]" : ""}
                  />
                  {advisorErrors.email && (
                    <p className="text-[#D42027] text-sm">{advisorErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="advisorPassword">パスワード</Label>
                  <Input
                    id="advisorPassword"
                    type="password"
                    placeholder="8文字以上"
                    value={advisorForm.password}
                    onChange={(e) =>
                      setAdvisorForm({ ...advisorForm, password: e.target.value })
                    }
                    required
                    minLength={8}
                    disabled={isLoading}
                    className={advisorErrors.password ? "border-[#D42027]" : ""}
                  />
                  {advisorErrors.password && (
                    <p className="text-[#D42027] text-sm">{advisorErrors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>得意業界</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {INDUSTRIES.map((industry) => (
                      <label
                        key={industry}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <Checkbox
                          checked={advisorForm.industries.includes(industry)}
                          onCheckedChange={() =>
                            setAdvisorForm({
                              ...advisorForm,
                              industries: toggleArrayItem(advisorForm.industries, industry),
                            })
                          }
                          disabled={isLoading}
                        />
                        {industry}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>得意営業領域</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {SPECIALTIES.map((specialty) => (
                      <label
                        key={specialty}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <Checkbox
                          checked={advisorForm.specialties.includes(specialty)}
                          onCheckedChange={() =>
                            setAdvisorForm({
                              ...advisorForm,
                              specialties: toggleArrayItem(advisorForm.specialties, specialty),
                            })
                          }
                          disabled={isLoading}
                        />
                        {specialty}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>対応エリア</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {AREAS.map((area) => (
                      <label
                        key={area}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <Checkbox
                          checked={advisorForm.areas.includes(area)}
                          onCheckedChange={() =>
                            setAdvisorForm({
                              ...advisorForm,
                              areas: toggleArrayItem(advisorForm.areas, area),
                            })
                          }
                          disabled={isLoading}
                        />
                        {area}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="careerSummary">経歴サマリ</Label>
                  <Textarea
                    id="careerSummary"
                    placeholder="これまでの営業経験や実績を簡潔にまとめてください"
                    value={advisorForm.careerSummary}
                    onChange={(e) =>
                      setAdvisorForm({ ...advisorForm, careerSummary: e.target.value })
                    }
                    disabled={isLoading}
                    rows={4}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#0F569D] hover:bg-[#0A3D6E] text-white w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      登録中...
                    </>
                  ) : (
                    "アカウントを作成"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <p className="text-center text-sm text-[#6B7280] mt-4">
            すでにアカウントをお持ちの方
            <Link href="/login" className="text-[#0F569D] hover:underline ml-1">
              ログイン
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
