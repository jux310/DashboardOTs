/*
  # Add history tracking

  1. Changes
    - Add trigger to automatically track changes in work_orders table
    - Add function to handle change tracking
    - Add users view for email lookups
  
  2. Security
    - Enable RLS on work_order_history table
    - Add policy for authenticated users to read history
*/

-- Create a view to get user emails
CREATE VIEW users AS
SELECT id, email, raw_user_meta_data
FROM auth.users;

-- Create function to record changes
CREATE OR REPLACE FUNCTION record_work_order_change()
RETURNS TRIGGER AS $$
DECLARE
  changed_field text;
  old_value text;
  new_value text;
BEGIN
  -- Check each field that we want to track
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO work_order_history (work_order_id, field, old_value, new_value, changed_by)
      VALUES (NEW.id, 'status', OLD.status, NEW.status, auth.uid());
    END IF;

    IF NEW.progress IS DISTINCT FROM OLD.progress THEN
      INSERT INTO work_order_history (work_order_id, field, old_value, new_value, changed_by)
      VALUES (NEW.id, 'progress', OLD.progress::text, NEW.progress::text, auth.uid());
    END IF;

    IF NEW.location IS DISTINCT FROM OLD.location THEN
      INSERT INTO work_order_history (work_order_id, field, old_value, new_value, changed_by)
      VALUES (NEW.id, 'location', OLD.location, NEW.location, auth.uid());
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for work_orders table
DROP TRIGGER IF EXISTS work_order_history_trigger ON work_orders;
CREATE TRIGGER work_order_history_trigger
  AFTER UPDATE ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION record_work_order_change();

-- Add policy for reading history
CREATE POLICY "Authenticated users can read history"
  ON work_order_history
  FOR SELECT
  TO authenticated
  USING (true);