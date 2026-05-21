import Link from "next/link";
import { Search, MessageSquare, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Search,
    title: "最適なマッチング",
    description:
      "業界・専門分野・エリアなど多角的な条件から、あなたのビジネスに最適な営業顧問を見つけます。",
  },
  {
    icon: MessageSquare,
    title: "リアルタイムチャット",
    description:
      "マッチング後はリアルタイムチャットで顧問と直接コミュニケーション。スムーズな連携を実現します。",
  },
  {
    icon: CreditCard,
    title: "安心の決済",
    description:
      "Stripeによる安全な決済システム。契約から支払いまで、プラットフォーム上で完結します。",
  },
] as const;

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="font-heading text-lg font-bold text-[#0F569D]">
            オニカナ
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" render={<Link href="/login" />}>
              ログイン
            </Button>
            <Button
              size="sm"
              className="bg-[#0F569D] hover:bg-[#0A3D6E] text-white"
              render={<Link href="/register" />}
            >
              新規登録
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex flex-1 items-center bg-gradient-to-br from-[#E8F0FE] to-white">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-32">
          <div className="mx-auto max-w-2xl text-center animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A2E] leading-tight tracking-tight">
              あなたのビジネスに、
              <br />
              <span className="brush-underline">最強の営業力</span>を。
            </h1>
            <p className="mt-6 text-lg text-[#6B7280] leading-relaxed">
              オニカナ顧問マッチングは、企業と営業顧問をつなぐプラットフォームです。
              <br className="hidden md:block" />
              あなたの事業に最適な営業のプロフェッショナルが見つかります。
            </p>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="bg-[#0F569D] hover:bg-[#0A3D6E] text-white px-8"
                render={<Link href="/company/search" />}
              >
                顧問を探す
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8"
                render={<Link href="/register" />}
              >
                顧問として登録
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A2E]">
              オニカナの特徴
            </h2>
            <p className="mt-3 text-[#6B7280]">
              ビジネスの成長を加速する3つの仕組み
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3 stagger-children">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="card-hover bg-white border border-[#E5E7EB] rounded-xl shadow-sm"
              >
                <CardContent className="flex flex-col items-center text-center p-6 space-y-4">
                  <div className="flex size-14 items-center justify-center rounded-xl bg-[#E8F0FE]">
                    <feature.icon className="size-7 text-[#0F569D]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#1A1A2E]">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#F8F9FB] py-16">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A2E]">
            今すぐ始めましょう
          </h2>
          <p className="mt-3 text-[#6B7280]">
            無料でアカウントを作成して、最適な営業顧問を見つけましょう
          </p>
          <div className="mt-8">
            <Button
              size="lg"
              className="bg-[#0F569D] hover:bg-[#0A3D6E] text-white px-10"
              render={<Link href="/register" />}
            >
              無料で登録する
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A3D6E] text-white py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <div className="font-heading text-lg font-bold">オニカナ</div>
            <nav className="flex gap-6 text-sm text-white/70">
              <Link href="/login" className="hover:text-white transition-colors">
                ログイン
              </Link>
              <Link href="/register" className="hover:text-white transition-colors">
                新規登録
              </Link>
            </nav>
          </div>
          <div className="mt-6 border-t border-white/10 pt-6 text-center text-xs text-white/50">
            &copy; {new Date().getFullYear()} オニカナ顧問マッチング. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
