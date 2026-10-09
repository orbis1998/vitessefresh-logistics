-- New ops roles. Must commit before they are used in later statements.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gestionnaire';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'call_center';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'suivi';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'comptable';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'finance';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'entreprise';
