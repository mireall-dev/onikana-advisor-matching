"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { toast } from "sonner";
import { Building2, UserCheck, Shield, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { UserRole } from "@/types/database";

const loginSchema = z.object({
  email: z.string().min(1, "メールアドレスを入力してください").email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
});

const demoAccounts: Record<string, { email: string; password: string; redirectTo: string }> = {
  company: { email: "demo-company@example.com", password: "demo1234", redirectTo: "/company/search" },
  advisor: { email: "demo-advisor@example.com", password: "demo1234", redirectTo: "/advisor/dashboard" },
  admin: { email: "demo-admin@example.com", password: "demo1234", redirectTo: "/admin/dashboard" },
};

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

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

  async function handleDemoLogin(accountType: string) {
    const account = demoAccounts[accountType];
    if (!account) return;

    setDemoLoading(accountType);
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

      toast.success("デモアカウントでログインしました");
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
        <Card className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm p-8">
          <CardHeader className="text-center space-y-1 pb-2">
            <CardTitle className="text-2xl font-bold text-center">
              ログイン
            </CardTitle>
            <CardDescription className="text-sm text-[#6B7280] text-center">
              オニカナ顧問マッチング
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@company.co.jp"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isAnyLoading}
                  className={errors.email ? "border-[#D42027]" : ""}
                />
                {errors.email && (
                  <p className="text-[#D42027] text-sm">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="8文字以上"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={isAnyLoading}
                  className={errors.password ? "border-[#D42027]" : ""}
                />
                {errors.password && (
                  <p className="text-[#D42027] text-sm">{errors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isAnyLoading}
                className="bg-[#0F569D] hover:bg-[#0A3D6E] text-white w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    ログイン中...
                  </>
                ) : (
                  "ログイン"
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-[#6B7280]">
                  またはデモアカウントでログイン
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isAnyLoading}
                onClick={() => handleDemoLogin("company")}
                className="flex flex-col items-center gap-1 h-auto py-2 text-xs"
              >
                {demoLoading === "company" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Building2 className="size-4" />
                )}
                企業として
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isAnyLoading}
                onClick={() => handleDemoLogin("advisor")}
                className="flex flex-col items-center gap-1 h-auto py-2 text-xs"
              >
                {demoLoading === "advisor" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UserCheck className="size-4" />
                )}
                顧問として
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isAnyLoading}
                onClick={() => handleDemoLogin("admin")}
                className="flex flex-col items-center gap-1 h-auto py-2 text-xs"
              >
                {demoLoading === "admin" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Shield className="size-4" />
                )}
                管理者として
              </Button>
            </div>

            <p className="text-center text-sm text-[#6B7280]">
              アカウントをお持ちでない方は
              <Link href="/register" className="text-[#0F569D] hover:underline ml-1">
                こちら
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
