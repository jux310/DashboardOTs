import React from 'react';
import { BarChart3, Clock, AlertTriangle } from 'lucide-react';
import { WorkOrder } from '../types';

interface DashboardProps {
  incoOrders: WorkOrder[];
  antiOrders: WorkOrder[];
  archivedOrders: WorkOrder[];
}

export function Dashboard({ incoOrders, antiOrders, archivedOrders }: DashboardProps) {
  const totalOrders = incoOrders.length + antiOrders.length + archivedOrders.length;
  const inProgressOrders = incoOrders.length + antiOrders.length;
  const completedOrders = archivedOrders.length;
  
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
            <div className="p-3 bg-blue-100 rounded-full">
              <BarChart3 className="w-6 h-6 text-blue-600" />
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
              <p className="text-xl font-medium">{completedOrders}</p>
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
                {completedOrders > 0 ? '45 días' : 'N/A'}
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
    </div>
  );
}