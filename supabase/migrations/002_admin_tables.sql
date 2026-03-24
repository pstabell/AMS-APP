-- Carriers table
CREATE TABLE IF NOT EXISTS carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  notes TEXT,
  active BOOLEAN DEFAULT true,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_carriers_user_id ON carriers(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_carriers_user_code ON carriers(user_id, code);

-- Commission Rules table
CREATE TABLE IF NOT EXISTS commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT NOT NULL,
  description TEXT NOT NULL,
  agent_rate NUMERIC(5, 2) NOT NULL,
  condition_field TEXT,
  condition_operator TEXT,
  condition_value TEXT,
  priority INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  notes TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commission_rules_user_id ON commission_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_commission_rules_tx_type ON commission_rules(user_id, transaction_type);

-- Column Mappings table
CREATE TABLE IF NOT EXISTS column_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  carrier_id UUID REFERENCES carriers(id) ON DELETE SET NULL,
  carrier_name TEXT,
  mappings JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  notes TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_column_mappings_user_id ON column_mappings(user_id);

-- User Settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  default_date_range TEXT DEFAULT 'month',
  default_page_size INTEGER DEFAULT 25,
  currency_format TEXT DEFAULT 'USD',
  date_format TEXT DEFAULT 'MM/DD/YYYY',
  timezone TEXT DEFAULT 'America/New_York',
  theme TEXT DEFAULT 'light',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- RLS Policies for carriers
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;

CREATE POLICY carriers_select ON carriers FOR SELECT 
  USING (auth.uid() = user_id);
  
CREATE POLICY carriers_insert ON carriers FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY carriers_update ON carriers FOR UPDATE 
  USING (auth.uid() = user_id);
  
CREATE POLICY carriers_delete ON carriers FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for commission_rules
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY commission_rules_select ON commission_rules FOR SELECT 
  USING (auth.uid() = user_id);
  
CREATE POLICY commission_rules_insert ON commission_rules FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY commission_rules_update ON commission_rules FOR UPDATE 
  USING (auth.uid() = user_id);
  
CREATE POLICY commission_rules_delete ON commission_rules FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for column_mappings
ALTER TABLE column_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY column_mappings_select ON column_mappings FOR SELECT 
  USING (auth.uid() = user_id);
  
CREATE POLICY column_mappings_insert ON column_mappings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY column_mappings_update ON column_mappings FOR UPDATE 
  USING (auth.uid() = user_id);
  
CREATE POLICY column_mappings_delete ON column_mappings FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_settings_select ON user_settings FOR SELECT 
  USING (auth.uid() = user_id);
  
CREATE POLICY user_settings_insert ON user_settings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY user_settings_update ON user_settings FOR UPDATE 
  USING (auth.uid() = user_id);
  
CREATE POLICY user_settings_delete ON user_settings FOR DELETE 
  USING (auth.uid() = user_id);
