/*
  # Add history tracking for date changes

  1. Changes
    - Add trigger to record changes in work_order_dates table
    - Record date changes in work_order_history table
  
  2. Security
    - No changes to existing policies required
*/

-- Create function to record date changes
CREATE OR REPLACE FUNCTION record_date_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.date IS DISTINCT FROM OLD.date THEN
      INSERT INTO work_order_history (
        work_order_id,
        field,
        old_value,
        new_value,
        changed_by
      )
      VALUES (
        NEW.work_order_id,
        NEW.stage,
        COALESCE(OLD.date::text, 'Sin fecha'),
        COALESCE(NEW.date::text, 'Sin fecha'),
        auth.uid()
      );
    END IF;
  ELSIF TG_OP = 'INSERT' AND NEW.date IS NOT NULL THEN
    INSERT INTO work_order_history (
      work_order_id,
      field,
      old_value,
      new_value,
      changed_by
    )
    VALUES (
      NEW.work_order_id,
      NEW.stage,
      'Sin fecha',
      NEW.date::text,
      auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for work_order_dates table
DROP TRIGGER IF EXISTS work_order_dates_history_trigger ON work_order_dates;
CREATE TRIGGER work_order_dates_history_trigger
  AFTER INSERT OR UPDATE ON work_order_dates
  FOR EACH ROW
  EXECUTE FUNCTION record_date_change();