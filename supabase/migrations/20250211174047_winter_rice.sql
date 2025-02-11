/*
  # Initial schema setup for work order tracking system

  1. New Tables
    - `users`
      - Managed by Supabase Auth
    - `work_orders`
      - Main table for work orders
      - Stores basic information and current status
    - `work_order_dates`
      - Stores dates for each stage of work orders
      - Includes audit trail (who made the change)
    - `work_order_history`
      - Tracks all changes to work orders
      - Stores who made the change and when

  2. Security
    - Enable RLS on all tables
    - Users can read all work orders
    - Only authenticated users can create/update work orders
    - All changes are tracked with user information
*/

-- Create work_orders table
CREATE TABLE work_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ot text UNIQUE NOT NULL,
  client text NOT NULL,
  tag text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT '',
  progress integer NOT NULL DEFAULT 0,
  location text NOT NULL CHECK (location IN ('INCO', 'ANTI', 'ARCHIVED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NOT NULL REFERENCES auth.users(id)
);

-- Create work_order_dates table
CREATE TABLE work_order_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  stage text NOT NULL,
  date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NOT NULL REFERENCES auth.users(id),
  UNIQUE(work_order_id, stage)
);

-- Create work_order_history table
CREATE TABLE work_order_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  field text NOT NULL,
  old_value text,
  new_value text,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by uuid NOT NULL REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_history ENABLE ROW LEVEL SECURITY;

-- Policies for work_orders
CREATE POLICY "Anyone can read work orders"
  ON work_orders
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create work orders"
  ON work_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update work orders"
  ON work_orders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = updated_by);

-- Policies for work_order_dates
CREATE POLICY "Anyone can read work order dates"
  ON work_order_dates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert work order dates"
  ON work_order_dates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update work order dates"
  ON work_order_dates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = updated_by);

-- Policies for work_order_history
CREATE POLICY "Anyone can read work order history"
  ON work_order_history
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert work order history"
  ON work_order_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = changed_by);

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_work_orders_updated_at
  BEFORE UPDATE ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_work_order_dates_updated_at
  BEFORE UPDATE ON work_order_dates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();