-- =============================================
-- Seed Data for Demo
-- =============================================
-- NOTE: Auth users must be created via Supabase Auth API first.
-- This script assumes the following auth users exist with these UUIDs.
-- Use the seed script (seed-auth.ts) to create auth users first.

-- Demo User UUIDs (must match auth users)
-- Company 1: 11111111-1111-1111-1111-111111111111 (demo-company@example.com)
-- Company 2: 11111111-1111-1111-1111-222222222222
-- Company 3: 11111111-1111-1111-1111-333333333333
-- Advisor 1: 22222222-2222-2222-2222-111111111111 (demo-advisor@example.com)
-- Advisor 2: 22222222-2222-2222-2222-222222222222
-- Advisor 3: 22222222-2222-2222-2222-333333333333
-- Advisor 4: 22222222-2222-2222-2222-444444444444
-- Advisor 5: 22222222-2222-2222-2222-555555555555
-- Advisor 6: 22222222-2222-2222-2222-666666666666
-- Advisor 7: 22222222-2222-2222-2222-777777777777
-- Advisor 8: 22222222-2222-2222-2222-888888888888
-- Admin:     33333333-3333-3333-3333-111111111111 (demo-admin@example.com)

-- =============================================
-- Users
-- =============================================
INSERT INTO public.users (id, email, display_name, role, avatar_url) VALUES
  ('11111111-1111-1111-1111-111111111111', 'demo-company@example.com', '山本 拓也', 'company', NULL),
  ('11111111-1111-1111-1111-222222222222', 'maruyama@example.com', '丸山 健太', 'company', NULL),
  ('11111111-1111-1111-1111-333333333333', 'green-estate@example.com', '緑川 あゆみ', 'company', NULL),
  ('22222222-2222-2222-2222-111111111111', 'demo-advisor@example.com', '田中 太郎', 'advisor', NULL),
  ('22222222-2222-2222-2222-222222222222', 'suzuki@example.com', '鈴木 花子', 'advisor', NULL),
  ('22222222-2222-2222-2222-333333333333', 'yamada@example.com', '山田 一郎', 'advisor', NULL),
  ('22222222-2222-2222-2222-444444444444', 'sato@example.com', '佐藤 美咲', 'advisor', NULL),
  ('22222222-2222-2222-2222-555555555555', 'takahashi@example.com', '高橋 健一', 'advisor', NULL),
  ('22222222-2222-2222-2222-666666666666', 'ito@example.com', '伊藤 裕子', 'advisor', NULL),
  ('22222222-2222-2222-2222-777777777777', 'watanabe@example.com', '渡辺 誠', 'advisor', NULL),
  ('22222222-2222-2222-2222-888888888888', 'nakamura@example.com', '中村 大輔', 'advisor', NULL),
  ('33333333-3333-3333-3333-111111111111', 'demo-admin@example.com', '管理者', 'admin', NULL);

-- =============================================
-- Company Profiles
-- =============================================
INSERT INTO public.company_profiles (user_id, company_name, industry, employee_scale, sales_challenge) VALUES
  ('11111111-1111-1111-1111-111111111111', '株式会社テックグロース', 'IT', '51-200名', 'SaaS新規顧客獲得が頭打ちになっており、新しい販路開拓とアウトバウンド営業の強化が急務です。'),
  ('11111111-1111-1111-1111-222222222222', '丸山製造株式会社', '製造', '201-1000名', '既存顧客の深耕と新規ルート開拓を同時に進めたいが、営業チームのリソースが不足しています。'),
  ('11111111-1111-1111-1111-333333333333', 'グリーン不動産株式会社', '不動産', '11-50名', '営業チームをこれから立ち上げるフェーズで、ノウハウが全くない状態です。');

-- =============================================
-- Advisor Profiles
-- =============================================
INSERT INTO public.advisor_profiles (user_id, catchphrase, industries, specialties, areas, career_summary, achievements, connections, status, approval_status, hourly_rate, rating_avg, rating_count) VALUES
  (
    '22222222-2222-2222-2222-111111111111',
    'SaaS新規開拓のプロ',
    ARRAY['IT'],
    ARRAY['新規開拓'],
    ARRAY['関東'],
    'Salesforce、HubSpotなど大手SaaS企業で15年以上の営業経験。エンタープライズ向け新規開拓で数十億円規模の案件を多数クロージング。現在はフリーランスの営業顧問として、スタートアップから上場企業まで幅広く支援。',
    '[{"company": "株式会社CloudTech", "description": "SaaS新規開拓の営業戦略立案と実行支援", "result": "半年で新規契約30社獲得、ARR 1.2億円増"},{"company": "AIソリューション株式会社", "description": "エンタープライズ営業チームの立ち上げ", "result": "営業チーム5名を採用・育成、初年度売上3億円達成"},{"company": "フィンテック株式会社", "description": "金融機関向け新規開拓支援", "result": "メガバンク3行との取引開始に成功"}]',
    'IT業界の経営層・CTO/CIOとの豊富な人脈。Salesforce Alumni ネットワーク。',
    'accepting', 'approved', 50000, 4.7, 12
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '製造業×ルート営業30年',
    ARRAY['製造'],
    ARRAY['ルート営業'],
    ARRAY['関西'],
    '大手機械メーカーで30年間、製造業向けルート営業に従事。既存顧客との関係深耕と新規ルート構築のエキスパート。定年後に営業顧問として独立。',
    '[{"company": "大阪精密工業株式会社", "description": "既存顧客の深耕とクロスセル戦略の立案", "result": "既存顧客からの売上を1年で40%増加"},{"company": "関西金属加工株式会社", "description": "新規取引先の開拓支援", "result": "自動車メーカー2社との新規取引を実現"}]',
    '製造業界の調達部門・購買部門との30年来の関係。業界団体の幹部とのネットワーク。',
    'accepting', 'approved', 40000, 4.5, 8
  ),
  (
    '22222222-2222-2222-2222-333333333333',
    '金融業界の人脈マスター',
    ARRAY['金融'],
    ARRAY['エンタープライズ営業'],
    ARRAY['関東'],
    '外資系投資銀行、メガバンクで20年以上のキャリア。金融機関の意思決定者との強固なリレーションを活かし、フィンテック企業やBtoB企業の金融機関向け営業を支援。',
    '[{"company": "ペイメント株式会社", "description": "メガバンク向けソリューション営業の支援", "result": "3大メガバンクとの提携契約を締結"},{"company": "保険テック株式会社", "description": "保険会社向け新規営業チャネル構築", "result": "大手保険会社5社との代理店契約を実現"}]',
    '三大メガバンク、大手証券会社、保険会社のキーパーソンとの強固な関係。',
    'accepting', 'approved', 60000, 4.8, 15
  ),
  (
    '22222222-2222-2222-2222-444444444444',
    'インサイドセールスの仕組化',
    ARRAY['IT', '小売'],
    ARRAY['インサイドセールス'],
    ARRAY['全国対応'],
    'BtoB SaaS企業でインサイドセールス部門を0から立ち上げ、年間1000件以上の商談を創出する組織に成長させた実績。ツール選定からKPI設計、チーム育成まで一貫して支援。',
    '[{"company": "MarketingCloud株式会社", "description": "インサイドセールス部門の立ち上げ支援", "result": "6ヶ月で月間商談数を50件から200件に拡大"},{"company": "EC支援株式会社", "description": "CRMとMAツールの導入・運用最適化", "result": "リードナーチャリング施策でCVR 3倍に改善"}]',
    'SaaS業界のマーケター・営業リーダーとの広いネットワーク。',
    'accepting', 'approved', 45000, 4.6, 10
  ),
  (
    '22222222-2222-2222-2222-555555555555',
    '不動産営業の改革者',
    ARRAY['不動産'],
    ARRAY['新規開拓'],
    ARRAY['中部'],
    '名古屋を拠点に不動産業界で25年。営業手法のデジタル化と組織改革を推進し、従来型の営業スタイルからデータドリブンな営業への転換を多数成功させている。',
    '[{"company": "中部不動産販売株式会社", "description": "営業プロセスのDX化支援", "result": "営業効率200%改善、成約率1.5倍に向上"},{"company": "名古屋住宅開発株式会社", "description": "新規顧客開拓のマーケティング連携", "result": "Web経由の問い合わせを月50件→200件に増加"}]',
    '中部地方の不動産デベロッパー、地銀との強固な関係。',
    'full', 'approved', 45000, 4.4, 6
  ),
  (
    '22222222-2222-2222-2222-666666666666',
    '海外展開を営業で加速',
    ARRAY['製造', 'IT'],
    ARRAY['海外営業'],
    ARRAY['全国対応'],
    '総合商社で15年、海外営業とビジネスデベロップメントを担当。東南アジア・北米市場への進出支援を得意とし、現地パートナー開拓からクロスボーダー営業まで支援。',
    '[{"company": "精密機器メーカーA社", "description": "東南アジア市場への進出支援", "result": "タイ・ベトナムで現地代理店5社と契約、初年度売上2億円"},{"company": "ITソリューション企業B社", "description": "北米市場でのパートナーセールス構築", "result": "米国SIer3社とのパートナー契約を実現"}]',
    '東南アジア・北米の現地企業・商工会との幅広い人脈。',
    'accepting', 'approved', 55000, 4.3, 5
  ),
  (
    '22222222-2222-2222-2222-777777777777',
    '代理店網構築のスペシャリスト',
    ARRAY['小売', '医療'],
    ARRAY['代理店開拓'],
    ARRAY['九州'],
    '医療機器メーカーで代理店営業を20年担当。全国の代理店網を構築・管理し、売上を5倍に成長させた経験を持つ。代理店インセンティブ設計やパートナープログラムの構築を得意とする。',
    '[{"company": "医療機器メーカーC社", "description": "九州エリアの代理店網再構築", "result": "代理店数を15社から35社に拡大、エリア売上2倍"},{"company": "ヘルスケアスタートアップD社", "description": "全国代理店チャネルの立ち上げ", "result": "1年で代理店50社と契約、月間売上5000万円達成"}]',
    '九州・中国地方の医療機関、調剤薬局チェーンとのネットワーク。',
    'paused', 'approved', 40000, 4.2, 4
  ),
  (
    '22222222-2222-2222-2222-888888888888',
    'IT営業×AI活用の最前線',
    ARRAY['IT'],
    ARRAY['新規開拓'],
    ARRAY['関東'],
    'AI系スタートアップで営業責任者を歴任。ChatGPTなどの生成AIを営業プロセスに取り入れた「AI営業」の第一人者。営業のAI化・自動化の支援で多くの実績。',
    '[{"company": "AI営業支援スタートアップE社", "description": "AI活用による営業プロセス自動化", "result": "営業工数を60%削減しながら成約率を維持"}]',
    'AI・テック系スタートアップの経営層との豊富なネットワーク。',
    'accepting', 'pending', 50000, 0, 0
  );

-- =============================================
-- Meeting Requests
-- =============================================
INSERT INTO public.meeting_requests (id, company_id, advisor_id, consultation_content, preferred_dates, status, created_at, responded_at) VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-111111111111',
    'SaaS事業の新規顧客開拓について相談したいです。現在アウトバウンドの成約率が低く、アプローチ方法の見直しとターゲティングの精度向上を図りたいと考えています。',
    '第1希望：6月10日（火）14:00〜\n第2希望：6月12日（木）10:00〜\n第3希望：6月13日（金）15:00〜',
    'approved',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '6 days'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-222222222222',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-444444444444',
    'インサイドセールスの立ち上げを検討しています。現在は全てフィールドセールスで対応していますが、リード獲得から商談化までの仕組みを作りたいです。',
    '来週以降で調整可能です。',
    'pending',
    NOW() - INTERVAL '2 days',
    NULL
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-333333333333',
    '11111111-1111-1111-1111-222222222222',
    '22222222-2222-2222-2222-222222222222',
    '既存の取引先への深耕営業と、新規ルートの開拓についてアドバイスをいただきたいです。特に自動車業界への新規参入を検討中です。',
    '第1希望：6月11日（水）13:00〜\n第2希望：6月14日（土）10:00〜',
    'approved',
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '13 days'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-444444444444',
    '11111111-1111-1111-1111-333333333333',
    '22222222-2222-2222-2222-333333333333',
    '営業チームの立ち上げにあたり、金融機関向けの営業戦略についてご相談したいです。特に地方銀行とのリレーション構築に課題を感じています。',
    '来週中に30分程度お時間いただけますか？',
    'pending',
    NOW() - INTERVAL '1 day',
    NULL
  );

-- =============================================
-- Matches (for approved requests)
-- =============================================
INSERT INTO public.matches (id, request_id, company_id, advisor_id, company_confirmed, advisor_confirmed, is_matched, matched_at, payment_status) VALUES
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-111111111111',
    FALSE, FALSE, FALSE, NULL, 'unpaid'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-222222222222',
    'aaaaaaaa-aaaa-aaaa-aaaa-333333333333',
    '11111111-1111-1111-1111-222222222222',
    '22222222-2222-2222-2222-222222222222',
    TRUE, TRUE, TRUE, NOW() - INTERVAL '5 days', 'paid'
  );

-- =============================================
-- Messages (Chat samples)
-- =============================================
INSERT INTO public.messages (request_id, sender_id, content, created_at) VALUES
  -- Chat between Company1 and Advisor1
  ('aaaaaaaa-aaaa-aaaa-aaaa-111111111111', '11111111-1111-1111-1111-111111111111', 'はじめまして、株式会社テックグロースの山本です。SaaS新規開拓についてご相談させていただければ幸いです。', NOW() - INTERVAL '6 days' + INTERVAL '1 hour'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-111111111111', '22222222-2222-2222-2222-111111111111', 'はじめまして、田中です。ご連絡ありがとうございます。SaaS新規開拓は私の専門分野ですので、ぜひお力になれればと思います。', NOW() - INTERVAL '6 days' + INTERVAL '2 hours'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-111111111111', '22222222-2222-2222-2222-111111111111', 'まずは現状をお伺いしたいので、オンラインでの面談はいかがでしょうか？ご希望の第1希望の6月10日（火）14:00〜で大丈夫です。', NOW() - INTERVAL '6 days' + INTERVAL '2 hours' + INTERVAL '10 minutes'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-111111111111', '11111111-1111-1111-1111-111111111111', 'ありがとうございます！6月10日14:00〜でお願いいたします。', NOW() - INTERVAL '5 days' + INTERVAL '3 hours'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-111111111111', '22222222-2222-2222-2222-111111111111', '承知しました。Zoom URLをお送りしますね。\nhttps://zoom.us/j/1234567890?pwd=demo\nミーティングID: 123 456 7890\nパスワード: demo123', NOW() - INTERVAL '5 days' + INTERVAL '4 hours'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-111111111111', '11111111-1111-1111-1111-111111111111', 'ありがとうございます。当日よろしくお願いいたします。事前に弊社の現状をまとめた資料をお送りすることは可能でしょうか？', NOW() - INTERVAL '4 days' + INTERVAL '1 hour'),

  -- Chat between Company2 and Advisor2
  ('aaaaaaaa-aaaa-aaaa-aaaa-333333333333', '11111111-1111-1111-1111-222222222222', '丸山製造の丸山です。既存顧客の深耕と新規ルート開拓について、ぜひお知恵を借りたいです。', NOW() - INTERVAL '13 days' + INTERVAL '1 hour'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-333333333333', '22222222-2222-2222-2222-222222222222', '鈴木です。製造業のルート営業は私のライフワークです。ぜひご支援させてください。', NOW() - INTERVAL '13 days' + INTERVAL '3 hours'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-333333333333', '22222222-2222-2222-2222-222222222222', '6月11日13:00〜で面談しましょう。Zoomでよろしいですか？\nhttps://zoom.us/j/9876543210?pwd=demo2', NOW() - INTERVAL '12 days' + INTERVAL '2 hours');

-- =============================================
-- Reviews (for completed match)
-- =============================================
INSERT INTO public.reviews (match_id, company_id, advisor_id, rating, comment) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-222222222222', '11111111-1111-1111-1111-222222222222', '22222222-2222-2222-2222-222222222222', 5, '製造業の営業に関する知見が圧倒的でした。具体的なアクションプランまで一緒に考えてくださり、実行もサポートいただきました。おかげで新規取引先を2社獲得できました。'),
  -- Additional reviews for advisor 1
  ('bbbbbbbb-bbbb-bbbb-bbbb-111111111111', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-111111111111', 5, 'SaaS営業のプロフェッショナル。ターゲット選定からアプローチまで、非常に実践的なアドバイスをいただけました。');

-- =============================================
-- Payments (for completed match)
-- =============================================
INSERT INTO public.payments (match_id, stripe_payment_intent_id, amount, status) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-222222222222', 'pi_demo_test_123456', 50000, 'succeeded');
