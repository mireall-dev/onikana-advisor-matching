export type UserRole = "company" | "advisor" | "admin";

export type AdvisorStatus = "accepting" | "full" | "paused";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type RequestStatus = "pending" | "approved" | "rejected";
export type PaymentStatus = "unpaid" | "paid" | "failed";
export type StripePaymentStatus = "pending" | "succeeded" | "failed";

export interface User {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
}

export interface CompanyProfile {
  id: string;
  user_id: string;
  company_name: string;
  industry: string;
  employee_scale: string;
  sales_challenge: string;
  created_at: string;
  user?: User;
}

export interface AdvisorAchievement {
  company: string;
  description: string;
  result: string;
}

export interface AdvisorProfile {
  id: string;
  user_id: string;
  catchphrase: string;
  industries: string[];
  specialties: string[];
  areas: string[];
  career_summary: string;
  achievements: AdvisorAchievement[];
  connections: string;
  status: AdvisorStatus;
  approval_status: ApprovalStatus;
  hourly_rate: number;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  user?: User;
}

export interface MeetingRequest {
  id: string;
  company_id: string;
  advisor_id: string;
  consultation_content: string;
  preferred_dates: string;
  status: RequestStatus;
  created_at: string;
  responded_at: string | null;
  company?: User;
  advisor?: User;
  company_profile?: CompanyProfile;
  advisor_profile?: AdvisorProfile;
}

export interface Match {
  id: string;
  request_id: string;
  company_id: string;
  advisor_id: string;
  company_confirmed: boolean;
  advisor_confirmed: boolean;
  is_matched: boolean;
  matched_at: string | null;
  payment_status: PaymentStatus;
  created_at: string;
  company?: User;
  advisor?: User;
  request?: MeetingRequest;
  company_profile?: CompanyProfile;
  advisor_profile?: AdvisorProfile;
}

export interface Message {
  id: string;
  request_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: User;
}

export interface Review {
  id: string;
  match_id: string;
  company_id: string;
  advisor_id: string;
  rating: number;
  comment: string;
  created_at: string;
  company?: User;
  company_profile?: CompanyProfile;
}

export interface Payment {
  id: string;
  match_id: string;
  stripe_payment_intent_id: string;
  amount: number;
  status: StripePaymentStatus;
  created_at: string;
}

// Constants
export const INDUSTRIES = [
  "IT",
  "製造",
  "金融",
  "不動産",
  "医療",
  "小売",
  "その他",
] as const;

export const SPECIALTIES = [
  "新規開拓",
  "ルート営業",
  "代理店開拓",
  "インサイドセールス",
  "エンタープライズ営業",
  "海外営業",
] as const;

export const AREAS = [
  "関東",
  "関西",
  "中部",
  "九州",
  "全国対応",
  "リモート対応",
] as const;

export const EMPLOYEE_SCALES = [
  "1-10名",
  "11-50名",
  "51-200名",
  "201-1000名",
  "1001名以上",
] as const;

export type Industry = (typeof INDUSTRIES)[number];
export type Specialty = (typeof SPECIALTIES)[number];
export type Area = (typeof AREAS)[number];
export type EmployeeScale = (typeof EMPLOYEE_SCALES)[number];
