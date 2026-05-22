import Link from "next/link";
import {
  Search,
  MessageSquare,
  CreditCard,
  ShieldCheck,
  Users,
  Sparkles,
} from "lucide-react";
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
    title: "成約後の安心決済",
    description:
      "成約手数料モデル。マッチング成立まで費用は発生せず、Stripeで安全に決済できます。",
  },
] as const;

const trustPoints = [
  {
    icon: ShieldCheck,
    title: "審査済みの顧問のみ",
    description:
      "事務局が経歴・実績を確認した顧問のみがプラットフォームに登録されています。",
  },
  {
    icon: Users,
    title: "多様な業界カバー",
    description:
      "IT・製造・金融・不動産・医療・小売など、幅広い業界に対応する顧問が在籍しています。",
  },
  {
    icon: Sparkles,
    title: "成約まで完全無料",
    description:
      "顧問の検索・面談リクエスト・チャットは全て無料。費用は成約時のみ発生します。",
  },
] as const;

const faqs = [
  {
    q: "費用はいくらかかりますか?",
    a: "マッチング成立時の成約手数料のみ発生します。検索・リクエスト送信・チャットは無料でご利用いただけます。",
  },
  {
    q: "どんな顧問が登録していますか?",
    a: "管理者による審査を経た、各業界で実績のある営業のプロフェッショナルが登録しています。",
  },
  {
    q: "顧問として登録するには?",
    a: "「顧問として登録」からプロフィールを入力いただき、管理者による承認をお待ちください。",
  },
] as const;

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="font-heading text-lg font-bold text-[#0F569D]">
            オニカナ顧問マッチング
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
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <div className="mx-auto max-w-2xl text-center animate-fade-in-up">
            <p className="mb-4 inline-block rounded-full bg-white px-3 py-1 text-xs font-medium text-[#0F569D] ring-1 ring-[#0F569D]/20">
              成約手数料モデル / 審査済み顧問のみ
            </p>
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

      {/* Trust Section */}
      <section className="bg-[#F8F9FB] py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A2E]">
              選ばれる理由
            </h2>
            <p className="mt-3 text-[#6B7280]">
              安心して利用いただける仕組みを整えています
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3 stagger-children">
            {trustPoints.map((point) => (
              <div
                key={point.title}
                className="rounded-xl bg-white p-6 ring-1 ring-[#E5E7EB]"
              >
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-[#0F569D]/10">
                  <point.icon className="size-6 text-[#0F569D]" />
                </div>
                <h3 className="font-semibold text-[#1A1A2E]">{point.title}</h3>
                <p className="mt-2 text-sm text-[#6B7280] leading-relaxed">
                  {point.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A2E]">
              よくあるご質問
            </h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-lg border border-[#E5E7EB] bg-white px-5 py-4 open:bg-[#F8F9FB]"
              >
                <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-[#1A1A2E]">
                  {faq.q}
                  <span className="text-[#0F569D] transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[#6B7280]">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Dual CTA Section */}
      <section className="bg-[#F8F9FB] py-16">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl bg-gradient-to-br from-[#0F569D] to-[#0A3D6E] p-8 text-white">
              <h3 className="text-xl font-bold">企業の方</h3>
              <p className="mt-2 text-sm text-white/80">
                即戦力の営業顧問を見つけて、事業成長を加速させましょう。
              </p>
              <div className="mt-6">
                <Button
                  size="lg"
                  className="bg-white text-[#0F569D] hover:bg-white/90"
                  render={<Link href="/company/search" />}
                >
                  顧問を探す
                </Button>
              </div>
            </div>
            <div className="rounded-xl bg-white p-8 ring-1 ring-[#E5E7EB]">
              <h3 className="text-xl font-bold text-[#1A1A2E]">顧問の方</h3>
              <p className="mt-2 text-sm text-[#6B7280]">
                あなたの営業経験を活かして、企業の成長を支援しませんか。
              </p>
              <div className="mt-6">
                <Button
                  size="lg"
                  className="bg-[#0F569D] text-white hover:bg-[#0A3D6E]"
                  render={<Link href="/register" />}
                >
                  顧問として登録
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A3D6E] text-white py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <div className="font-heading text-lg font-bold">オニカナ顧問マッチング</div>
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
