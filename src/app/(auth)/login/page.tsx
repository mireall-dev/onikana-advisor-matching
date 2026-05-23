"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { toast } from "sonner";
import {
  Building2,
  UserCheck,
  Shield,
  Loader2,
  ChevronRight,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BRAND } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/database";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
});

type DemoKey = "company" | "advisor" | "admin";

interface DemoAccount {
  key: DemoKey;
  title: string;
  description: string;
  email: string;
  password: string;
  redirectTo: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    key: "company",
    title: "企業として体験",
    description: "顧問を検索してリクエストを送る",
    email: "demo-company@example.com",
    password: "demo1234",
    redirectTo: "/company/search",
    icon: Building2,
    iconBg: "bg-[#E8F0FE]",
    iconColor: "text-[#0F569D]",
  },
  {
    key: "advisor",
    title: "顧問として体験",
    description: "受信したリクエストを承認/見送り",
    email: "demo-advisor@example.com",
    password: "demo1234",
    redirectTo: "/advisor/dashboard",
    icon: UserCheck,
    iconBg: "bg-green-50",
    iconColor: "text-green-700",
  },
  {
    key: "admin",
    title: "管理者として体験",
    description: "顧問承認 / KPI / 全データ閲覧",
    email: "demo-admin@example.com",
    password: "demo1234",
    redirectTo: "/admin/dashboard",
    icon: Shield,
    iconBg: "bg-[#F5EDD6]",
    iconColor: "text-[#B89B4A]",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<DemoKey | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (field === "email" || field === "password") {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: result.data.email,
        password: result.data.password,
      });

      if (error) {
        toast.error("ログインに失敗しました", {
          description: "メールアドレスまたはパスワードが正しくありません。",
        });
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("email", result.data.email)
        .single();

      const role = profile?.role as UserRole | undefined;
      toast.success("ログインしました");

      if (role === "company") {
        router.push("/company/search");
      } else if (role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/advisor/dashboard");
      }
    } catch {
      toast.error("エラーが発生しました", {
        description: "しばらくしてから再度お試しください。",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDemoLogin(account: DemoAccount) {
    setDemoLoading(account.key);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password,
      });

      if (error) {
        toast.error("デモログインに失敗しました", {
          description: "デモアカウントが設定されていない可能性があります。",
        });
        return;
      }

      toast.success(`${account.title.replace("として体験", "")}でログインしました`);
      router.push(account.redirectTo);
    } catch {
      toast.error("エラーが発生しました", {
        description: "しばらくしてから再度お試しください。",
      });
    } finally {
      setDemoLoading(null);
    }
  }

  const isAnyLoading = isLoading || demoLoading !== null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FB] px-4 py-12">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-heading text-2xl font-bold text-[#1A1A2E]">
            {BRAND.full}
          </h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            体験したいロールを選んでログイン
          </p>
        </div>

        {/* Demo role cards (primary) */}
        <div className="space-y-3" role="list" aria-label="お試しログイン">
          {DEMO_ACCOUNTS.map((account) => {
            const Icon = account.icon;
            const loading = demoLoading === account.key;
            return (
              <button
                key={account.key}
                type="button"
                role="listitem"
                disabled={isAnyLoading}
                onClick={() => handleDemoLogin(account)}
                className={cn(
                  "group flex w-full items-center gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4 text-left shadow-sm transition-all",
                  "hover:border-[#0F569D] hover:shadow-md hover:-translate-y-0.5",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F569D] focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:border-[#E5E7EB] disabled:hover:shadow-sm"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-lg",
                    account.iconBg
                  )}
                >
                  {loading ? (
                    <Loader2 className={cn("size-5 animate-spin", account.iconColor)} />
                  ) : (
                    <Icon className={cn("size-6", account.iconColor)} />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-[#1A1A2E]">
                    {account.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-[#6B7280]">
                    {account.description}
                  </span>
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="size-5 shrink-0 text-[#6B7280] transition-transform group-hover:translate-x-0.5 group-hover:text-[#0F569D]"
                />
              </button>
            );
          })}
        </div>

        {/* Email login (secondary, collapsible) */}
        <div className="mt-8">
          {!showEmailForm ? (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowEmailForm(true)}
                disabled={isAnyLoading}
                className="text-sm text-[#6B7280] underline-offset-4 hover:text-[#0F569D] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F569D] focus-visible:ring-offset-2 rounded"
              >
                メールアドレスでログインする
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm animate-fade-in-up">
              <h2 className="text-sm font-semibold text-[#1A1A2E]">
                メールアドレスでログイン
              </h2>
              <form
                onSubmit={handleLogin}
                className="mt-4 space-y-4"
                noValidate
              >
                <FormField
                  label="メールアドレス"
                  htmlFor="email"
                  error={errors.email}
                  required
                >
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="example@company.co.jp"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isAnyLoading}
                  />
                </FormField>

                <FormField
                  label="パスワード"
                  htmlFor="password"
                  error={errors.password}
                  hint="8文字以上"
                  required
                >
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={isAnyLoading}
                  />
                </FormField>

                <Button
                  type="submit"
                  disabled={isAnyLoading}
                  className="w-full bg-[#0F569D] hover:bg-[#0A3D6E] text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                      ログイン中...
                    </>
                  ) : (
                    <>
                      ログイン
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* Sign-up link */}
        <p className="mt-6 text-center text-sm text-[#6B7280]">
          アカウントをお持ちでない方は
          <Link
            href="/register"
            className="ml-1 font-medium text-[#0F569D] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F569D] focus-visible:ring-offset-2 rounded"
          >
            新規登録
          </Link>
        </p>
      </div>
    </div>
  );
}
