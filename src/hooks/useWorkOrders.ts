import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { WorkOrder, INCO_STAGES, ANTI_STAGES } from '../types';

export function useWorkOrders(session: any) {
  const [incoOrders, setIncoOrders] = useState<WorkOrder[]>([]);
  const [antiOrders, setAntiOrders] = useState<WorkOrder[]>([]);
  const [archivedOrders, setArchivedOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!session?.user) {
        throw new Error('No se encontró un usuario autenticado');
      }

      const { data: workOrders, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          work_order_dates (
            stage,
            date
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error('Error al cargar las órdenes de trabajo: ' + error.message);
      }

      if (!workOrders) {
        throw new Error('No se encontraron órdenes de trabajo');
      }

      const formatted = workOrders.map(wo => ({
        ot: wo.ot,
        client: wo.client,
        description: wo.description,
        tag: wo.tag,
        status: wo.status,
        progress: wo.progress,
        location: wo.location,
        dates: wo.work_order_dates.reduce((acc: Record<string, string>, curr) => {
          if (curr.date) {
            acc[curr.stage] = curr.date;
          }
          return acc;
        }, {}),
      }));

      setIncoOrders(formatted.filter(wo => wo.location === 'INCO'));
      setAntiOrders(formatted.filter(wo => wo.location === 'ANTI'));
      setArchivedOrders(formatted.filter(wo => wo.location === 'ARCHIVED'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error loading work orders:', message);
      setError(message);
      setIncoOrders([]);
      setAntiOrders([]);
      setArchivedOrders([]);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) {
      loadWorkOrders();
    }
  }, [session, loadWorkOrders]);

  const createWorkOrder = async (workOrder: WorkOrder) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('work_orders')
        .insert({
          ot: workOrder.ot,
          client: workOrder.client,
          tag: workOrder.tag,
          description: workOrder.description,
          location: 'INCO',
          created_by: user.id,
          updated_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      await loadWorkOrders();
      return data;
    } catch (error) {
      console.error('Error creating work order:', error);
      throw error;
    }
  };

  const updateWorkOrderDate = async (
    ot: string,
    stage: string,
    date: string,
    location: 'INCO' | 'ANTI'
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: workOrder } = await supabase
        .from('work_orders')
        .select('id')
        .eq('ot', ot)
        .single();

      if (!workOrder) throw new Error('Work order not found');

      // First try to update existing date
      const { data: existingDate, error: dateError } = await supabase
        .from('work_order_dates')
        .select('id')
        .eq('work_order_id', workOrder.id)
        .eq('stage', stage);

      // Handle case where no date exists yet
      if (dateError && dateError.code === 'PGRST116') {
        // Insert new date
        await supabase
          .from('work_order_dates')
          .insert({
            work_order_id: workOrder.id,
            stage,
            date: date || null,
            created_by: user.id,
            updated_by: user.id
          });
      } else if (existingDate && existingDate.length > 0) {
        // Update existing date
        await supabase
          .from('work_order_dates')
          .update({
            date: date || null,
            updated_by: user.id,
            updated_at: new Date().toISOString()
          }).eq('id', existingDate[0].id);
      } else {
        // Insert new date
        await supabase
          .from('work_order_dates')
          .insert({
            work_order_id: workOrder.id,
            stage,
            date: date || null,
            created_by: user.id,
            updated_by: user.id
          });
      }

      // Update work order status and progress
      const stages = location === 'INCO' ? INCO_STAGES : ANTI_STAGES;
      const stageIndex = stages.findIndex(s => s.name === stage);
      
      if (stageIndex !== -1 && date) {
        await supabase
          .from('work_orders')
          .update({
            status: stage,
            progress: stages[stageIndex].progress,
            location: shouldMoveLocation(location, stage) ? getNextLocation(location) : location,
            updated_by: user.id
          })
          .eq('id', workOrder.id);
      }

      await loadWorkOrders();
    } catch (error) {
      console.error('Error updating work order date:', error);
      throw error;
    }
  };

  return {
    incoOrders,
    antiOrders,
    archivedOrders,
    loading,
    createWorkOrder,
    updateWorkOrderDate,
  };
}

function shouldMoveLocation(location: string, stage: string): boolean {
  return (
    (location === 'INCO' && stage === 'Anticorr') ||
    (location === 'ANTI' && stage === 'Despacho')
  );
}

function getNextLocation(current: string): string {
  return current === 'INCO' ? 'ANTI' : 'ARCHIVED';
}