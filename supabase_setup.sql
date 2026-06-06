-- 1. Create Campaigns Table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  slug text NOT NULL UNIQUE,
  frame_url text NOT NULL,
  banner_url text,
  creator_id text NOT NULL,
  creator_name text,
  spreadsheet_id text,
  spreadsheet_url text,
  participant_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Participants Table
CREATE TABLE IF NOT EXISTS public.participants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone_number text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create RPC Function to increment participants count
CREATE OR REPLACE FUNCTION increment_participants(campaign_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.campaigns
  SET participant_count = COALESCE(participant_count, 0) + 1
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Enable Row Level Security (RLS) on tables
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies for FULL PUBLIC ACCESS (Anyone can create/read/update/delete)
DROP POLICY IF EXISTS "Enable all access for all users" ON public.campaigns;
CREATE POLICY "Enable all access for all users" ON public.campaigns FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for all users" ON public.participants;
CREATE POLICY "Enable all access for all users" ON public.participants FOR ALL USING (true) WITH CHECK (true);

-- 6. Setup Storage Bucket for campaign assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('campaign-assets', 'campaign-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Enable Storage Policies for FULL PUBLIC ACCESS
-- (RLS is already enabled by default on storage.objects in Supabase)

DROP POLICY IF EXISTS "Public CRUD" ON storage.objects;
CREATE POLICY "Public CRUD" ON storage.objects FOR ALL USING (bucket_id = 'campaign-assets') WITH CHECK (bucket_id = 'campaign-assets');
