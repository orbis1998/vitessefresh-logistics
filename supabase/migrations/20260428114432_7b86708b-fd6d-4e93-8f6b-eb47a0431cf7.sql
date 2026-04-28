
DO $$
DECLARE
  admin_id uuid := gen_random_uuid();
  driver_id uuid := gen_random_uuid();
  admin_email text := 'admin@vitessefresh.cd';
  driver_email text := 'livreur@vitessefresh.cd';
BEGIN
  -- ADMIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated',
      admin_email, crypt('Admin@2026!', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Administrateur VitesseFresh","phone":"+243000000001"}'::jsonb,
      now(), now(), '', '', '', ''
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), admin_id,
      jsonb_build_object('sub', admin_id::text, 'email', admin_email, 'email_verified', true),
      'email', admin_id::text, now(), now(), now());

    -- profils + rôle (le trigger handle_new_user devrait avoir créé profil+role client; on aligne)
    INSERT INTO public.profiles (user_id, full_name, phone, email)
    VALUES (admin_id, 'Administrateur VitesseFresh', '+243000000001', admin_email)
    ON CONFLICT DO NOTHING;

    DELETE FROM public.user_roles WHERE user_id = admin_id;
    INSERT INTO public.user_roles (user_id, role) VALUES (admin_id, 'admin');
  END IF;

  -- LIVREUR
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = driver_email) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', driver_id, 'authenticated', 'authenticated',
      driver_email, crypt('Livreur@2026!', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Livreur Démo","phone":"+243000000002"}'::jsonb,
      now(), now(), '', '', '', ''
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), driver_id,
      jsonb_build_object('sub', driver_id::text, 'email', driver_email, 'email_verified', true),
      'email', driver_id::text, now(), now(), now());

    INSERT INTO public.profiles (user_id, full_name, phone, email)
    VALUES (driver_id, 'Livreur Démo', '+243000000002', driver_email)
    ON CONFLICT DO NOTHING;

    DELETE FROM public.user_roles WHERE user_id = driver_id;
    INSERT INTO public.user_roles (user_id, role) VALUES (driver_id, 'livreur');

    INSERT INTO public.driver_profiles (user_id, vehicle_type, vehicle_plate, approved, status)
    VALUES (driver_id, 'Moto', 'KIN-001', true, 'available')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
