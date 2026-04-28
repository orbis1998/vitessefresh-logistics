-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('client', 'livreur', 'admin');
CREATE TYPE public.order_status AS ENUM ('pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled');
CREATE TYPE public.driver_status AS ENUM ('offline', 'available', 'busy');

-- ============ UTILITY: updated_at ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_profiles_updated
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============ AUTO-CREATE PROFILE + DEFAULT ROLE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'phone',
    NEW.email
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ DELIVERY ZONES ============
CREATE TABLE public.delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  latitude NUMERIC(10,7) NOT NULL,
  longitude NUMERIC(10,7) NOT NULL,
  base_price NUMERIC(10,2) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- ============ PRICING PLANS ============
CREATE TABLE public.pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  included_deliveries INT NOT NULL DEFAULT 0,
  max_distance_km NUMERIC(6,2),
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

-- ============ DRIVER PROFILES ============
CREATE TABLE public.driver_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_type TEXT,
  vehicle_plate TEXT,
  status driver_status NOT NULL DEFAULT 'offline',
  approved BOOLEAN NOT NULL DEFAULT false,
  rating NUMERIC(3,2) DEFAULT 5.0,
  total_deliveries INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_driver_profiles_updated
BEFORE UPDATE ON public.driver_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ORDERS ============
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  pickup_address TEXT NOT NULL,
  pickup_lat NUMERIC(10,7) NOT NULL,
  pickup_lng NUMERIC(10,7) NOT NULL,
  dropoff_address TEXT NOT NULL,
  dropoff_lat NUMERIC(10,7) NOT NULL,
  dropoff_lng NUMERIC(10,7) NOT NULL,
  distance_km NUMERIC(6,2) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  package_type TEXT,
  notes TEXT,
  recipient_name TEXT,
  recipient_phone TEXT,
  status order_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_orders_client ON public.orders(client_id);
CREATE INDEX idx_orders_driver ON public.orders(driver_id);
CREATE INDEX idx_orders_status ON public.orders(status);

CREATE TRIGGER trg_orders_updated
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ DRIVER LOCATIONS (realtime) ============
CREATE TABLE public.driver_locations (
  driver_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude NUMERIC(10,7) NOT NULL,
  longitude NUMERIC(10,7) NOT NULL,
  heading NUMERIC(5,2),
  speed NUMERIC(6,2),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER TABLE public.driver_locations REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;

-- ============ RLS POLICIES ============

-- profiles
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_roles
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- delivery_zones
CREATE POLICY "Anyone reads zones" ON public.delivery_zones
  FOR SELECT USING (true);
CREATE POLICY "Admins manage zones" ON public.delivery_zones
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- pricing_plans
CREATE POLICY "Anyone reads plans" ON public.pricing_plans
  FOR SELECT USING (true);
CREATE POLICY "Admins manage plans" ON public.pricing_plans
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- driver_profiles
CREATE POLICY "Drivers view own driver profile" ON public.driver_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all driver profiles" ON public.driver_profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients view assigned driver profile" ON public.driver_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.driver_id = driver_profiles.user_id
        AND o.client_id = auth.uid()
        AND o.status IN ('accepted','picked_up','in_transit')
    )
  );
CREATE POLICY "Drivers update own driver profile" ON public.driver_profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Drivers insert own driver profile" ON public.driver_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage driver profiles" ON public.driver_profiles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- orders
CREATE POLICY "Clients view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Drivers view assigned orders" ON public.orders
  FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY "Drivers view pending orders" ON public.orders
  FOR SELECT USING (status = 'pending' AND public.has_role(auth.uid(), 'livreur'));
CREATE POLICY "Admins view all orders" ON public.orders
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Clients update own pending orders" ON public.orders
  FOR UPDATE USING (auth.uid() = client_id AND status = 'pending');
CREATE POLICY "Drivers update assigned orders" ON public.orders
  FOR UPDATE USING (auth.uid() = driver_id);
CREATE POLICY "Admins manage orders" ON public.orders
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- driver_locations
CREATE POLICY "Drivers manage own location" ON public.driver_locations
  FOR ALL USING (auth.uid() = driver_id)
  WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "Admins view all locations" ON public.driver_locations
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients view active driver location" ON public.driver_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.driver_id = driver_locations.driver_id
        AND o.client_id = auth.uid()
        AND o.status IN ('accepted','picked_up','in_transit')
    )
  );

-- ============ SEED DATA ============
INSERT INTO public.delivery_zones (name, latitude, longitude, base_price) VALUES
  ('Gombe', -4.3047, 15.3050, 2500),
  ('Limete', -4.3450, 15.3150, 3000),
  ('Kintambo', -4.3300, 15.2700, 3000),
  ('Bandalungwa', -4.3500, 15.2900, 3000),
  ('Lemba', -4.3800, 15.3200, 3500),
  ('Ngaliema', -4.3600, 15.2500, 3500),
  ('Masina', -4.3900, 15.4000, 4500),
  ('N''djili', -4.3950, 15.4200, 5000);

INSERT INTO public.pricing_plans (name, description, price, included_deliveries, max_distance_km, features, display_order) VALUES
  ('Basique', 'Pour les besoins ponctuels', 0, 0, 10, '["Tarif à la course","Suivi temps réel","Support standard"]', 1),
  ('Essentiel', 'Idéal petites entreprises', 25000, 10, 15, '["10 courses incluses","Suivi temps réel","Support prioritaire","Validité 30 jours"]', 2),
  ('Standard', 'Volume régulier', 60000, 30, 20, '["30 courses incluses","Suivi temps réel","Support prioritaire 7j/7","Tableau de bord","Validité 30 jours"]', 3),
  ('Premium', 'Solution illimitée pro', 150000, 100, 30, '["100 courses incluses","Suivi temps réel","Support dédié 24/7","Tableau de bord complet","Facturation mensuelle","Validité 30 jours"]', 4);