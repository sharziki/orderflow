-- OrderFlow Multi-Tenant Schema
-- Each restaurant is a "tenant" with their own data

-- Tenants (Restaurants)
CREATE TABLE tenants (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- subdomain: slug.orderflow.io
  custom_domain TEXT UNIQUE, -- optional custom domain
  
  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#1E40AF',
  accent_color TEXT DEFAULT '#F59E0B',
  
  -- Contact
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  timezone TEXT DEFAULT 'America/Chicago',
  
  -- Business Hours (JSON)
  hours JSONB DEFAULT '{
    "monday": {"open": "11:00", "close": "21:00"},
    "tuesday": {"open": "11:00", "close": "21:00"},
    "wednesday": {"open": "11:00", "close": "21:00"},
    "thursday": {"open": "11:00", "close": "21:00"},
    "friday": {"open": "11:00", "close": "22:00"},
    "saturday": {"open": "11:00", "close": "22:00"},
    "sunday": {"open": "12:00", "close": "20:00"}
  }',
  
  -- Features
  pickup_enabled BOOLEAN DEFAULT true,
  delivery_enabled BOOLEAN DEFAULT false,
  scheduled_orders_enabled BOOLEAN DEFAULT true,
  gift_cards_enabled BOOLEAN DEFAULT true,
  
  -- Integrations
  stripe_account_id TEXT, -- Stripe Connect account
  stripe_onboarding_complete BOOLEAN DEFAULT false,
  doordash_store_id TEXT,
  doordash_business_id TEXT,
  printnode_printer_id TEXT,
  
  -- Settings
  tax_rate DECIMAL(5,4) DEFAULT 0.0925, -- 9.25%
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, active, suspended
  deployed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenant Users (Restaurant Staff)
CREATE TABLE tenant_users (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'staff', -- owner, admin, staff
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

-- Categories (per tenant)
CREATE TABLE categories (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu Items (per tenant)
CREATE TABLE menu_items (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  -- Options/Modifiers (JSON)
  options JSONB DEFAULT '[]',
  
  -- Dietary info
  is_vegetarian BOOLEAN DEFAULT false,
  is_vegan BOOLEAN DEFAULT false,
  is_gluten_free BOOLEAN DEFAULT false,
  is_spicy BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers (per tenant)
CREATE TABLE customers (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, email),
  UNIQUE(tenant_id, phone)
);

-- Orders (per tenant)
CREATE TABLE orders (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id TEXT REFERENCES customers(id),
  
  order_type TEXT NOT NULL, -- PICKUP, DELIVERY
  status TEXT DEFAULT 'PENDING', -- PENDING, CONFIRMED, PREPARING, READY, COMPLETED, CANCELLED
  
  -- Amounts
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  tip DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  
  -- Delivery info
  delivery_address TEXT,
  delivery_instructions TEXT,
  doordash_delivery_id TEXT,
  doordash_tracking_url TEXT,
  
  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE,
  
  -- Payment
  payment_intent_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  
  -- Meta
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items
CREATE TABLE order_items (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id TEXT REFERENCES menu_items(id),
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  options JSONB DEFAULT '[]',
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gift Cards (per tenant)
CREATE TABLE gift_cards (
  id TEXT PRIMARY KEY DEFAULT generate_cuid(),
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  initial_amount DECIMAL(10,2) NOT NULL,
  current_balance DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'ACTIVE', -- ACTIVE, REDEEMED, EXPIRED
  purchased_by TEXT REFERENCES customers(id),
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(tenant_id, code)
);

-- Indexes for performance
CREATE INDEX idx_menu_items_tenant ON menu_items(tenant_id);
CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_orders_status ON orders(tenant_id, status);
CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_domain ON tenants(custom_domain);

-- Row Level Security
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;

-- Function to get current tenant from request
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.current_tenant_id', true);
END;
$$ LANGUAGE plpgsql;
