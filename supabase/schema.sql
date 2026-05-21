-- =============================================
-- Sales Advisor Matching Platform Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Users table (synced with Supabase Auth)
-- =============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('company', 'advisor', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Company Profiles
-- =============================================
CREATE TABLE public.company_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  employee_scale TEXT NOT NULL,
  sales_challenge TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =============================================
-- Advisor Profiles
-- =============================================
CREATE TABLE public.advisor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  catchphrase TEXT NOT NULL DEFAULT '',
  industries TEXT[] NOT NULL DEFAULT '{}',
  specialties TEXT[] NOT NULL DEFAULT '{}',
  areas TEXT[] NOT NULL DEFAULT '{}',
  career_summary TEXT NOT NULL DEFAULT '',
  achievements JSONB NOT NULL DEFAULT '[]',
  connections TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'accepting' CHECK (status IN ('accepting', 'full', 'paused')),
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  hourly_rate INTEGER NOT NULL DEFAULT 0,
  rating_avg DECIMAL(3,2) NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =============================================
-- Meeting Requests
-- =============================================
CREATE TABLE public.meeting_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  consultation_content TEXT NOT NULL,
  preferred_dates TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- =============================================
-- Matches
-- =============================================
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.meeting_requests(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  advisor_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  is_matched BOOLEAN NOT NULL DEFAULT FALSE,
  matched_at TIMESTAMPTZ,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Messages (Chat)
-- =============================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.meeting_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Reviews
-- =============================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(match_id)
);

-- =============================================
-- Payments
-- =============================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX idx_company_profiles_user_id ON public.company_profiles(user_id);
CREATE INDEX idx_advisor_profiles_user_id ON public.advisor_profiles(user_id);
CREATE INDEX idx_advisor_profiles_status ON public.advisor_profiles(status);
CREATE INDEX idx_advisor_profiles_approval ON public.advisor_profiles(approval_status);
CREATE INDEX idx_meeting_requests_company ON public.meeting_requests(company_id);
CREATE INDEX idx_meeting_requests_advisor ON public.meeting_requests(advisor_id);
CREATE INDEX idx_meeting_requests_status ON public.meeting_requests(status);
CREATE INDEX idx_matches_company ON public.matches(company_id);
CREATE INDEX idx_matches_advisor ON public.matches(advisor_id);
CREATE INDEX idx_messages_request ON public.messages(request_id);
CREATE INDEX idx_messages_created ON public.messages(created_at);
CREATE INDEX idx_reviews_advisor ON public.reviews(advisor_id);
CREATE INDEX idx_payments_match ON public.payments(match_id);

-- =============================================
-- Row Level Security (RLS)
-- =============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users: Everyone can read, only self can update
CREATE POLICY "Users are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own record" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own record" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Company Profiles: Everyone can read, only owner can update
CREATE POLICY "Company profiles are viewable by everyone" ON public.company_profiles FOR SELECT USING (true);
CREATE POLICY "Company can update own profile" ON public.company_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Company can insert own profile" ON public.company_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Advisor Profiles: Approved ones are viewable by everyone, owner can update
CREATE POLICY "Approved advisor profiles are viewable" ON public.advisor_profiles FOR SELECT USING (true);
CREATE POLICY "Advisor can update own profile" ON public.advisor_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Advisor can insert own profile" ON public.advisor_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Meeting Requests: Participants can view, company can create
CREATE POLICY "Participants can view requests" ON public.meeting_requests FOR SELECT USING (
  auth.uid() = company_id OR auth.uid() = advisor_id OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Company can create requests" ON public.meeting_requests FOR INSERT WITH CHECK (auth.uid() = company_id);
CREATE POLICY "Participants can update requests" ON public.meeting_requests FOR UPDATE USING (
  auth.uid() = company_id OR auth.uid() = advisor_id OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Matches: Participants and admin can view
CREATE POLICY "Participants can view matches" ON public.matches FOR SELECT USING (
  auth.uid() = company_id OR auth.uid() = advisor_id OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "System can create matches" ON public.matches FOR INSERT WITH CHECK (
  auth.uid() = company_id OR auth.uid() = advisor_id
);
CREATE POLICY "Participants can update matches" ON public.matches FOR UPDATE USING (
  auth.uid() = company_id OR auth.uid() = advisor_id
);

-- Messages: Participants can view and create
CREATE POLICY "Participants can view messages" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.meeting_requests mr
    WHERE mr.id = request_id AND (mr.company_id = auth.uid() OR mr.advisor_id = auth.uid())
  )
);
CREATE POLICY "Participants can send messages" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.meeting_requests mr
    WHERE mr.id = request_id AND mr.status = 'approved' AND
    (mr.company_id = auth.uid() OR mr.advisor_id = auth.uid())
  )
);

-- Reviews: Everyone can view, company can create for matched advisors
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Company can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = company_id);

-- Payments: Participants and admin can view
CREATE POLICY "Participants can view payments" ON public.payments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_id AND (m.company_id = auth.uid() OR m.advisor_id = auth.uid())
  ) OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "System can manage payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update payments" ON public.payments FOR UPDATE USING (true);

-- =============================================
-- Admin override policies
-- =============================================
CREATE POLICY "Admin can update advisor profiles" ON public.advisor_profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- =============================================
-- Enable Realtime for messages
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- =============================================
-- Function to update advisor rating cache
-- =============================================
CREATE OR REPLACE FUNCTION update_advisor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.advisor_profiles
  SET
    rating_avg = (
      SELECT COALESCE(AVG(rating), 0) FROM public.reviews WHERE advisor_id = NEW.advisor_id
    ),
    rating_count = (
      SELECT COUNT(*) FROM public.reviews WHERE advisor_id = NEW.advisor_id
    )
  WHERE user_id = NEW.advisor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_advisor_rating
AFTER INSERT OR UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_advisor_rating();

-- =============================================
-- Function to auto-set is_matched when both confirmed
-- =============================================
CREATE OR REPLACE FUNCTION check_match_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.company_confirmed = TRUE AND NEW.advisor_confirmed = TRUE THEN
    NEW.is_matched := TRUE;
    NEW.matched_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_check_match_completion
BEFORE UPDATE ON public.matches
FOR EACH ROW
EXECUTE FUNCTION check_match_completion();
