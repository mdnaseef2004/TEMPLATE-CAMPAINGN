-- Fix the foreign key constraint on the participants table to cascade deletes

ALTER TABLE public.participants
  DROP CONSTRAINT IF EXISTS participants_campaign_id_fkey;

ALTER TABLE public.participants
  ADD CONSTRAINT participants_campaign_id_fkey
  FOREIGN KEY (campaign_id)
  REFERENCES public.campaigns(id)
  ON DELETE CASCADE;
