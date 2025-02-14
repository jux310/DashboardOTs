import React, { useEffect, useState } from 'react';
import { BarChart3, Clock, AlertTriangle, History } from 'lucide-react';
import { WorkOrder } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '../lib/supabase';

interface HistoryEntry {
  changed_at: string;
  ot: string;
  field: string;
  new_value: string;
  user_email: string;
}

interface DashboardProps {
  incoOrders: WorkOrder[];
  antiOrders: WorkOrder[];
  archivedOrders: WorkOrder[];
}

export function Dashboard({ incoOrders, antiOrders, archivedOrders }: DashboardProps) {
  const totalOrders = incoOrders.length + antiOrders.length + archivedOrders.length;
  const inProgressOrders = incoOrders.length + antiOrders.length;
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const { data, error } = await supabase
          .from('work_order_history')
          .select(`
            changed_at,
            field,
            old_value,
            new_value,
            changed_by,
            work_orders (
              ot
            )
          `)
          .not('field', 'in', '(status,progress)')
          .order('changed_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        // Fetch user emails for the changes
        const userIds = [...new Set(data.map(entry => entry.changed_by))];
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, email')
          .in('id', userIds);

        if (usersError) throw usersError;

        const userMap = new Map(users.map(user => [user.id, user.email]));

        const formattedHistory = data.map(entry => ({
          changed_at: entry.changed_at,
          ot: entry.work_orders.ot,
          field: entry.field,
          old_value: entry.old_value,
          new_value: entry.new_value,
          user_email: userMap.get(entry.changed_by) || 'Usuario desconocido'
        }));

        setHistory(formattedHistory);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setHistoryLoading(false);
      }
    }

    fetchHistory();
  }, []);

  const getDelayedOrders = (orders: WorkOrder[]) => {
    return orders.filter(order => {
      const firstDate = Object.values(order.dates)[0];
      if (!firstDate) return false;
      
      const startDate = new Date(firstDate);
      const today = new Date();
      const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff > 30;
    });
  };

  const delayedOrders = [...getDelayedOrders(incoOrders), ...getDelayedOrders(antiOrders)];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <BarChart3 className="w-6 h-6 text-[#00843D]" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total OTs</p>
              <p className="text-2xl font-semibold">{totalOrders}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-600">En Proceso</p>
              <p className="text-xl font-medium">{inProgressOrders}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Completadas</p>
              <p className="text-xl font-medium">{archivedOrders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tiempo Promedio</p>
              <p className="text-2xl font-semibold">
                {archivedOrders.length > 0 ? '45 días' : 'N/A'}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-600">INCO</p>
              <p className="text-xl font-medium">25 días</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">ANTI</p>
              <p className="text-xl font-medium">20 días</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">OTs Retrasadas</p>
              <p className="text-2xl font-semibold">{delayedOrders.length}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {delayedOrders.slice(0, 2).map(order => (
              <div key={order.ot} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">OT {order.ot}</span>
                <span className="text-sm font-medium">{order.client}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">OTs por Cliente</h3>
          <div className="space-y-4">
            {Array.from(new Set([...incoOrders, ...antiOrders].map(o => o.client)))
              .slice(0, 5)
              .map(client => {
                const count = [...incoOrders, ...antiOrders]
                  .filter(o => o.client === client).length;
                return (
                  <div key={client} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{client}</span>
                    <span className="text-sm font-medium">{count} OTs</span>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Estado Actual</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">INCO</span>
              <span className="text-sm font-medium">{incoOrders.length} OTs</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">ANTI</span>
              <span className="text-sm font-medium">{antiOrders.length} OTs</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Despachados</span>
              <span className="text-sm font-medium">{archivedOrders.length} OTs</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <History className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold">Historial de Cambios</h3>
        </div>
        
        <div className="space-y-4">
          {historyLoading ? (
            <div className="text-center text-gray-500">Cargando historial...</div>
          ) : history.length === 0 ? (
            <div className="text-center text-gray-500">No hay cambios recientes</div>
          ) : (
            <div className="space-y-2">
              {history.map((entry, index) => (
                <div
                  key={`${entry.ot}-${entry.changed_at}-${index}`}
                  className="text-sm text-gray-600 py-2 border-b last:border-b-0 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">
                      {format(new Date(entry.changed_at), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                    </span>
                    {' '}OT {entry.ot} - {entry.field}: {entry.old_value} → {entry.new_value}
                  </div>
                  <div className="text-xs text-gray-500 ml-4">
                    {entry.user_email}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}