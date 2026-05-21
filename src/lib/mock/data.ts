// ==============================================
// Mock Data based on supabase/seed.sql
// ==============================================

import type {
  User,
  CompanyProfile,
  AdvisorProfile,
  MeetingRequest,
  Match,
  Message,
  Review,
  Payment,
} from "@/types/database";

// Helper: relative date strings (ISO format)
function daysAgo(days: number, extraHours = 0, extraMinutes = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() + extraHours);
  d.setMinutes(d.getMinutes() + extraMinutes);
  return d.toISOString();
}

// ==============================================
// Users
// ==============================================
export const MOCK_USERS: User[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    email: "demo-company@example.com",
    display_name: "山本 拓也",
    role: "company",
    avatar_url: null,
    created_at: daysAgo(30),
  },
  {
    id: "11111111-1111-1111-1111-222222222222",
    email: "maruyama@example.com",
    display_name: "丸山 健太",
    role: "company",
    avatar_url: null,
    created_at: daysAgo(28),
  },
  {
    id: "11111111-1111-1111-1111-333333333333",
    email: "green-estate@example.com",
    display_name: "緑川 あゆみ",
    role: "company",
    avatar_url: null,
    created_at: daysAgo(25),
  },
  {
    id: "22222222-2222-2222-2222-111111111111",
    email: "demo-advisor@example.com",
    display_name: "田中 太郎",
    role: "advisor",
    avatar_url: null,
    created_at: daysAgo(30),
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    email: "suzuki@example.com",
    display_name: "鈴木 花子",
    role: "advisor",
    avatar_url: null,
    created_at: daysAgo(29),
  },
  {
    id: "22222222-2222-2222-2222-333333333333",
    email: "yamada@example.com",
    display_name: "山田 一郎",
    role: "advisor",
    avatar_url: null,
    created_at: daysAgo(27),
  },
  {
    id: "22222222-2222-2222-2222-444444444444",
    email: "sato@example.com",
    display_name: "佐藤 美咲",
    role: "advisor",
    avatar_url: null,
    created_at: daysAgo(26),
  },
  {
    id: "22222222-2222-2222-2222-555555555555",
    email: "takahashi@example.com",
    display_name: "高橋 健一",
    role: "advisor",
    avatar_url: null,
    created_at: daysAgo(24),
  },
  {
    id: "22222222-2222-2222-2222-666666666666",
    email: "ito@example.com",
    display_name: "伊藤 裕子",
    role: "advisor",
    avatar_url: null,
    created_at: daysAgo(23),
  },
  {
    id: "22222222-2222-2222-2222-777777777777",
    email: "watanabe@example.com",
    display_name: "渡辺 誠",
    role: "advisor",
    avatar_url: null,
    created_at: daysAgo(22),
  },
  {
    id: "22222222-2222-2222-2222-888888888888",
    email: "nakamura@example.com",
    display_name: "中村 大輔",
    role: "advisor",
    avatar_url: null,
    created_at: daysAgo(20),
  },
  {
    id: "33333333-3333-3333-3333-111111111111",
    email: "demo-admin@example.com",
    display_name: "管理者",
    role: "admin",
    avatar_url: null,
    created_at: daysAgo(30),
  },
];

// ==============================================
// Company Profiles
// ==============================================
export const MOCK_COMPANY_PROFILES: CompanyProfile[] = [
  {
    id: "cccccccc-cccc-cccc-cccc-111111111111",
    user_id: "11111111-1111-1111-1111-111111111111",
    company_name: "株式会社テックグロース",
    industry: "IT",
    employee_scale: "51-200名",
    sales_challenge:
      "SaaS新規顧客獲得が頭打ちになっており、新しい販路開拓とアウトバウンド営業の強化が急務です。",
    created_at: daysAgo(30),
  },
  {
    id: "cccccccc-cccc-cccc-cccc-222222222222",
    user_id: "11111111-1111-1111-1111-222222222222",
    company_name: "丸山製造株式会社",
    industry: "製造",
    employee_scale: "201-1000名",
    sales_challenge:
      "既存顧客の深耕と新規ルート開拓を同時に進めたいが、営業チームのリソースが不足しています。",
    created_at: daysAgo(28),
  },
  {
    id: "cccccccc-cccc-cccc-cccc-333333333333",
    user_id: "11111111-1111-1111-1111-333333333333",
    company_name: "グリーン不動産株式会社",
    industry: "不動産",
    employee_scale: "11-50名",
    sales_challenge:
      "営業チームをこれから立ち上げるフェーズで、ノウハウが全くない状態です。",
    created_at: daysAgo(25),
  },
];

// ==============================================
// Advisor Profiles
// ==============================================
export const MOCK_ADVISOR_PROFILES: AdvisorProfile[] = [
  {
    id: "dddddddd-dddd-dddd-dddd-111111111111",
    user_id: "22222222-2222-2222-2222-111111111111",
    catchphrase: "SaaS新規開拓のプロ",
    industries: ["IT"],
    specialties: ["新規開拓"],
    areas: ["関東"],
    career_summary:
      "Salesforce、HubSpotなど大手SaaS企業で15年以上の営業経験。エンタープライズ向け新規開拓で数十億円規模の案件を多数クロージング。現在はフリーランスの営業顧問として、スタートアップから上場企業まで幅広く支援。",
    achievements: [
      {
        company: "株式会社CloudTech",
        description: "SaaS新規開拓の営業戦略立案と実行支援",
        result: "半年で新規契約30社獲得、ARR 1.2億円増",
      },
      {
        company: "AIソリューション株式会社",
        description: "エンタープライズ営業チームの立ち上げ",
        result: "営業チーム5名を採用・育成、初年度売上3億円達成",
      },
      {
        company: "フィンテック株式会社",
        description: "金融機関向け新規開拓支援",
        result: "メガバンク3行との取引開始に成功",
      },
    ],
    connections:
      "IT業界の経営層・CTO/CIOとの豊富な人脈。Salesforce Alumni ネットワーク。",
    status: "accepting",
    approval_status: "approved",
    hourly_rate: 50000,
    rating_avg: 4.7,
    rating_count: 12,
    created_at: daysAgo(30),
  },
  {
    id: "dddddddd-dddd-dddd-dddd-222222222222",
    user_id: "22222222-2222-2222-2222-222222222222",
    catchphrase: "製造業×ルート営業30年",
    industries: ["製造"],
    specialties: ["ルート営業"],
    areas: ["関西"],
    career_summary:
      "大手機械メーカーで30年間、製造業向けルート営業に従事。既存顧客との関係深耕と新規ルート構築のエキスパート。定年後に営業顧問として独立。",
    achievements: [
      {
        company: "大阪精密工業株式会社",
        description: "既存顧客の深耕とクロスセル戦略の立案",
        result: "既存顧客からの売上を1年で40%増加",
      },
      {
        company: "関西金属加工株式会社",
        description: "新規取引先の開拓支援",
        result: "自動車メーカー2社との新規取引を実現",
      },
    ],
    connections:
      "製造業界の調達部門・購買部門との30年来の関係。業界団体の幹部とのネットワーク。",
    status: "accepting",
    approval_status: "approved",
    hourly_rate: 40000,
    rating_avg: 4.5,
    rating_count: 8,
    created_at: daysAgo(29),
  },
  {
    id: "dddddddd-dddd-dddd-dddd-333333333333",
    user_id: "22222222-2222-2222-2222-333333333333",
    catchphrase: "金融業界の人脈マスター",
    industries: ["金融"],
    specialties: ["エンタープライズ営業"],
    areas: ["関東"],
    career_summary:
      "外資系投資銀行、メガバンクで20年以上のキャリア。金融機関の意思決定者との強固なリレーションを活かし、フィンテック企業やBtoB企業の金融機関向け営業を支援。",
    achievements: [
      {
        company: "ペイメント株式会社",
        description: "メガバンク向けソリューション営業の支援",
        result: "3大メガバンクとの提携契約を締結",
      },
      {
        company: "保険テック株式会社",
        description: "保険会社向け新規営業チャネル構築",
        result: "大手保険会社5社との代理店契約を実現",
      },
    ],
    connections:
      "三大メガバンク、大手証券会社、保険会社のキーパーソンとの強固な関係。",
    status: "accepting",
    approval_status: "approved",
    hourly_rate: 60000,
    rating_avg: 4.8,
    rating_count: 15,
    created_at: daysAgo(27),
  },
  {
    id: "dddddddd-dddd-dddd-dddd-444444444444",
    user_id: "22222222-2222-2222-2222-444444444444",
    catchphrase: "インサイドセールスの仕組化",
    industries: ["IT", "小売"],
    specialties: ["インサイドセールス"],
    areas: ["全国対応"],
    career_summary:
      "BtoB SaaS企業でインサイドセールス部門を0から立ち上げ、年間1000件以上の商談を創出する組織に成長させた実績。ツール選定からKPI設計、チーム育成まで一貫して支援。",
    achievements: [
      {
        company: "MarketingCloud株式会社",
        description: "インサイドセールス部門の立ち上げ支援",
        result: "6ヶ月で月間商談数を50件から200件に拡大",
      },
      {
        company: "EC支援株式会社",
        description: "CRMとMAツールの導入・運用最適化",
        result: "リードナーチャリング施策でCVR 3倍に改善",
      },
    ],
    connections:
      "SaaS業界のマーケター・営業リーダーとの広いネットワーク。",
    status: "accepting",
    approval_status: "approved",
    hourly_rate: 45000,
    rating_avg: 4.6,
    rating_count: 10,
    created_at: daysAgo(26),
  },
  {
    id: "dddddddd-dddd-dddd-dddd-555555555555",
    user_id: "22222222-2222-2222-2222-555555555555",
    catchphrase: "不動産営業の改革者",
    industries: ["不動産"],
    specialties: ["新規開拓"],
    areas: ["中部"],
    career_summary:
      "名古屋を拠点に不動産業界で25年。営業手法のデジタル化と組織改革を推進し、従来型の営業スタイルからデータドリブンな営業への転換を多数成功させている。",
    achievements: [
      {
        company: "中部不動産販売株式会社",
        description: "営業プロセスのDX化支援",
        result: "営業効率200%改善、成約率1.5倍に向上",
      },
      {
        company: "名古屋住宅開発株式会社",
        description: "新規顧客開拓のマーケティング連携",
        result: "Web経由の問い合わせを月50件→200件に増加",
      },
    ],
    connections:
      "中部地方の不動産デベロッパー、地銀との強固な関係。",
    status: "full",
    approval_status: "approved",
    hourly_rate: 45000,
    rating_avg: 4.4,
    rating_count: 6,
    created_at: daysAgo(24),
  },
  {
    id: "dddddddd-dddd-dddd-dddd-666666666666",
    user_id: "22222222-2222-2222-2222-666666666666",
    catchphrase: "海外展開を営業で加速",
    industries: ["製造", "IT"],
    specialties: ["海外営業"],
    areas: ["全国対応"],
    career_summary:
      "総合商社で15年、海外営業とビジネスデベロップメントを担当。東南アジア・北米市場への進出支援を得意とし、現地パートナー開拓からクロスボーダー営業まで支援。",
    achievements: [
      {
        company: "精密機器メーカーA社",
        description: "東南アジア市場への進出支援",
        result:
          "タイ・ベトナムで現地代理店5社と契約、初年度売上2億円",
      },
      {
        company: "ITソリューション企業B社",
        description: "北米市場でのパートナーセールス構築",
        result: "米国SIer3社とのパートナー契約を実現",
      },
    ],
    connections:
      "東南アジア・北米の現地企業・商工会との幅広い人脈。",
    status: "accepting",
    approval_status: "approved",
    hourly_rate: 55000,
    rating_avg: 4.3,
    rating_count: 5,
    created_at: daysAgo(23),
  },
  {
    id: "dddddddd-dddd-dddd-dddd-777777777777",
    user_id: "22222222-2222-2222-2222-777777777777",
    catchphrase: "代理店網構築のスペシャリスト",
    industries: ["小売", "医療"],
    specialties: ["代理店開拓"],
    areas: ["九州"],
    career_summary:
      "医療機器メーカーで代理店営業を20年担当。全国の代理店網を構築・管理し、売上を5倍に成長させた経験を持つ。代理店インセンティブ設計やパートナープログラムの構築を得意とする。",
    achievements: [
      {
        company: "医療機器メーカーC社",
        description: "九州エリアの代理店網再構築",
        result: "代理店数を15社から35社に拡大、エリア売上2倍",
      },
      {
        company: "ヘルスケアスタートアップD社",
        description: "全国代理店チャネルの立ち上げ",
        result:
          "1年で代理店50社と契約、月間売上5000万円達成",
      },
    ],
    connections:
      "九州・中国地方の医療機関、調剤薬局チェーンとのネットワーク。",
    status: "paused",
    approval_status: "approved",
    hourly_rate: 40000,
    rating_avg: 4.2,
    rating_count: 4,
    created_at: daysAgo(22),
  },
  {
    id: "dddddddd-dddd-dddd-dddd-888888888888",
    user_id: "22222222-2222-2222-2222-888888888888",
    catchphrase: "IT営業×AI活用の最前線",
    industries: ["IT"],
    specialties: ["新規開拓"],
    areas: ["関東"],
    career_summary:
      "AI系スタートアップで営業責任者を歴任。ChatGPTなどの生成AIを営業プロセスに取り入れた「AI営業」の第一人者。営業のAI化・自動化の支援で多くの実績。",
    achievements: [
      {
        company: "AI営業支援スタートアップE社",
        description: "AI活用による営業プロセス自動化",
        result: "営業工数を60%削減しながら成約率を維持",
      },
    ],
    connections:
      "AI・テック系スタートアップの経営層との豊富なネットワーク。",
    status: "accepting",
    approval_status: "pending",
    hourly_rate: 50000,
    rating_avg: 0,
    rating_count: 0,
    created_at: daysAgo(20),
  },
];

// ==============================================
// Meeting Requests
// ==============================================
export const MOCK_MEETING_REQUESTS: MeetingRequest[] = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-111111111111",
    company_id: "11111111-1111-1111-1111-111111111111",
    advisor_id: "22222222-2222-2222-2222-111111111111",
    consultation_content:
      "SaaS事業の新規顧客開拓について相談したいです。現在アウトバウンドの成約率が低く、アプローチ方法の見直しとターゲティングの精度向上を図りたいと考えています。",
    preferred_dates:
      "第1希望：6月10日（火）14:00〜\n第2希望：6月12日（木）10:00〜\n第3希望：6月13日（金）15:00〜",
    status: "approved",
    created_at: daysAgo(7),
    responded_at: daysAgo(6),
  },
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-222222222222",
    company_id: "11111111-1111-1111-1111-111111111111",
    advisor_id: "22222222-2222-2222-2222-444444444444",
    consultation_content:
      "インサイドセールスの立ち上げを検討しています。現在は全てフィールドセールスで対応していますが、リード獲得から商談化までの仕組みを作りたいです。",
    preferred_dates: "来週以降で調整可能です。",
    status: "pending",
    created_at: daysAgo(2),
    responded_at: null,
  },
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-333333333333",
    company_id: "11111111-1111-1111-1111-222222222222",
    advisor_id: "22222222-2222-2222-2222-222222222222",
    consultation_content:
      "既存の取引先への深耕営業と、新規ルートの開拓についてアドバイスをいただきたいです。特に自動車業界への新規参入を検討中です。",
    preferred_dates:
      "第1希望：6月11日（水）13:00〜\n第2希望：6月14日（土）10:00〜",
    status: "approved",
    created_at: daysAgo(14),
    responded_at: daysAgo(13),
  },
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-444444444444",
    company_id: "11111111-1111-1111-1111-333333333333",
    advisor_id: "22222222-2222-2222-2222-333333333333",
    consultation_content:
      "営業チームの立ち上げにあたり、金融機関向けの営業戦略についてご相談したいです。特に地方銀行とのリレーション構築に課題を感じています。",
    preferred_dates: "来週中に30分程度お時間いただけますか？",
    status: "pending",
    created_at: daysAgo(1),
    responded_at: null,
  },
];

// ==============================================
// Matches
// ==============================================
export const MOCK_MATCHES: Match[] = [
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-111111111111",
    request_id: "aaaaaaaa-aaaa-aaaa-aaaa-111111111111",
    company_id: "11111111-1111-1111-1111-111111111111",
    advisor_id: "22222222-2222-2222-2222-111111111111",
    company_confirmed: false,
    advisor_confirmed: false,
    is_matched: false,
    matched_at: null,
    payment_status: "unpaid",
    created_at: daysAgo(7),
  },
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-222222222222",
    request_id: "aaaaaaaa-aaaa-aaaa-aaaa-333333333333",
    company_id: "11111111-1111-1111-1111-222222222222",
    advisor_id: "22222222-2222-2222-2222-222222222222",
    company_confirmed: true,
    advisor_confirmed: true,
    is_matched: true,
    matched_at: daysAgo(5),
    payment_status: "paid",
    created_at: daysAgo(14),
  },
];

// ==============================================
// Messages
// ==============================================
export const MOCK_MESSAGES: Message[] = [
  // Chat between Company1 and Advisor1
  {
    id: "eeeeeeee-eeee-eeee-eeee-111111111111",
    request_id: "aaaaaaaa-aaaa-aaaa-aaaa-111111111111",
    sender_id: "11111111-1111-1111-1111-111111111111",
    content:
      "はじめまして、株式会社テックグロースの山本です。SaaS新規開拓についてご相談させていただければ幸いです。",
    created_at: daysAgo(6, 1),
  },
  {
    id: "eeeeeeee-eeee-eeee-eeee-222222222222",
    request_id: "aaaaaaaa-aaaa-aaaa-aaaa-111111111111",
    sender_id: "22222222-2222-2222-2222-111111111111",
    content:
      "はじめまして、田中です。ご連絡ありがとうございます。SaaS新規開拓は私の専門分野ですので、ぜひお力になれればと思います。",
    created_at: daysAgo(6, 2),
  },
  {
    id: "eeeeeeee-eeee-eeee-eeee-333333333333",
    request_id: "aaaaaaaa-aaaa-aaaa-aaaa-111111111111",
    sender_id: "22222222-2222-2222-2222-111111111111",
    content:
      "まずは現状をお伺いしたいので、オンラインでの面談はいかがでしょうか？ご希望の第1希望の6月10日（火）14:00〜で大丈夫です。",
    created_at: daysAgo(6, 2, 10),
  },
  {
    id: "eeeeeeee-eeee-eeee-eeee-444444444444",
    request_id: "aaaaaaaa-aaaa-aaaa-aaaa-111111111111",
    sender_id: "11111111-1111-1111-1111-111111111111",
    content:
      "ありがとうございます！6月10日14:00〜でお願いいたします。",
    created_at: daysAgo(5, 3),
  },
  {
    id: "eeeeeeee-eeee-eeee-eeee-555555555555",
    request_id: "aaaaaaaa-aaaa-aaaa-aaaa-111111111111",
    sender_id: "22222222-2222-2222-2222-111111111111",
    content:
      "承知しました。Zoom URLをお送りしますね。\nhttps://zoom.us/j/1234567890?pwd=demo\nミーティングID: 123 456 7890\nパスワード: demo123",
    created_at: daysAgo(5, 4),
  },
  {
    id: "eeeeeeee-eeee-eeee-eeee-666666666666",
    request_id: "aaaaaaaa-aaaa-aaaa-aaaa-111111111111",
    sender_id: "11111111-1111-1111-1111-111111111111",
    content:
      "ありがとうございます。当日よろしくお願いいたします。事前に弊社の現状をまとめた資料をお送りすることは可能でしょうか？",
    created_at: daysAgo(4, 1),
  },
  // Chat between Company2 and Advisor2
  {
    id: "eeeeeeee-eeee-eeee-eeee-777777777777",
    request_id: "aaaaaaaa-aaaa-aaaa-aaaa-333333333333",
    sender_id: "11111111-1111-1111-1111-222222222222",
    content:
      "丸山製造の丸山です。既存顧客の深耕と新規ルート開拓について、ぜひお知恵を借りたいです。",
    created_at: daysAgo(13, 1),
  },
  {
    id: "eeeeeeee-eeee-eeee-eeee-888888888888",
    request_id: "aaaaaaaa-aaaa-aaaa-aaaa-333333333333",
    sender_id: "22222222-2222-2222-2222-222222222222",
    content:
      "鈴木です。製造業のルート営業は私のライフワークです。ぜひご支援させてください。",
    created_at: daysAgo(13, 3),
  },
  {
    id: "eeeeeeee-eeee-eeee-eeee-999999999999",
    request_id: "aaaaaaaa-aaaa-aaaa-aaaa-333333333333",
    sender_id: "22222222-2222-2222-2222-222222222222",
    content:
      "6月11日13:00〜で面談しましょう。Zoomでよろしいですか？\nhttps://zoom.us/j/9876543210?pwd=demo2",
    created_at: daysAgo(12, 2),
  },
];

// ==============================================
// Reviews
// ==============================================
export const MOCK_REVIEWS: Review[] = [
  {
    id: "ffffffff-ffff-ffff-ffff-111111111111",
    match_id: "bbbbbbbb-bbbb-bbbb-bbbb-222222222222",
    company_id: "11111111-1111-1111-1111-222222222222",
    advisor_id: "22222222-2222-2222-2222-222222222222",
    rating: 5,
    comment:
      "製造業の営業に関する知見が圧倒的でした。具体的なアクションプランまで一緒に考えてくださり、実行もサポートいただきました。おかげで新規取引先を2社獲得できました。",
    created_at: daysAgo(3),
  },
  {
    id: "ffffffff-ffff-ffff-ffff-222222222222",
    match_id: "bbbbbbbb-bbbb-bbbb-bbbb-111111111111",
    company_id: "11111111-1111-1111-1111-111111111111",
    advisor_id: "22222222-2222-2222-2222-111111111111",
    rating: 5,
    comment:
      "SaaS営業のプロフェッショナル。ターゲット選定からアプローチまで、非常に実践的なアドバイスをいただけました。",
    created_at: daysAgo(2),
  },
];

// ==============================================
// Payments
// ==============================================
export const MOCK_PAYMENTS: Payment[] = [
  {
    id: "99999999-9999-9999-9999-111111111111",
    match_id: "bbbbbbbb-bbbb-bbbb-bbbb-222222222222",
    stripe_payment_intent_id: "pi_demo_test_123456",
    amount: 50000,
    status: "succeeded",
    created_at: daysAgo(5),
  },
];

// ==============================================
// Table name -> data mapping
// ==============================================
type MockRecord = Record<string, unknown>;

export function getTableData(table: string): MockRecord[] {
  switch (table) {
    case "users":
      return MOCK_USERS as unknown as MockRecord[];
    case "company_profiles":
      return MOCK_COMPANY_PROFILES as unknown as MockRecord[];
    case "advisor_profiles":
      return MOCK_ADVISOR_PROFILES as unknown as MockRecord[];
    case "meeting_requests":
      return MOCK_MEETING_REQUESTS as unknown as MockRecord[];
    case "matches":
      return MOCK_MATCHES as unknown as MockRecord[];
    case "messages":
      return MOCK_MESSAGES as unknown as MockRecord[];
    case "reviews":
      return MOCK_REVIEWS as unknown as MockRecord[];
    case "payments":
      return MOCK_PAYMENTS as unknown as MockRecord[];
    default:
      return [];
  }
}
