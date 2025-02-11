import React from 'react';
import { DateCell } from './DateCell';
import { WorkOrder, Stage } from '../types';

function TruncatedDescription({ text }: { text: string }) {
  return (
    <div className="group relative">
      <div className="truncate max-w-[100px]">
        {text}
      </div>
      {text && (
        <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white p-2 rounded shadow-lg max-w-sm whitespace-normal break-words left-0 mt-1">
          {text}
        </div>
      )}
    </div>
  );
}

interface WorkOrderTableProps {
  workOrders: WorkOrder[];
  stages: Stage[];
  onDateChange: (ot: string, stage: string, date: string) => void;
  isArchived?: boolean;
}

export function WorkOrderTable({
  workOrders,
  stages,
  onDateChange,
  isArchived = false,
}: WorkOrderTableProps) {
  // Sort work orders by progress in descending order
  const sortedWorkOrders = [...workOrders].sort((a, b) => b.progress - a.progress);

  return (
    <div className="overflow-x-auto h-[calc(100vh-16rem)]">
      <table className="min-w-full bg-white shadow-sm rounded-lg">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">OT</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Cliente</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Descripción</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">TAG</th>
            {!isArchived && (
              <>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Status</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Avance</th>
              </>
            )}
            {stages.map((stage) => (
              <th key={`header-${stage.name}`} className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                {stage.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 overflow-y-auto">
          {sortedWorkOrders.map((wo) => (
            <tr key={wo.ot} className="hover:bg-gray-50">
              <td className="px-4 py-2">{wo.ot}</td>
              <td className="px-4 py-2">{wo.client}</td>
              <td className="px-4 py-2">
                <TruncatedDescription text={wo.description} />
              </td>
              <td className="px-4 py-2 whitespace-nowrap">{wo.tag}</td>
              {!isArchived && (
                <>
                  <td className="px-4 py-2">{wo.status}</td>
                  <td className="px-4 py-2">{wo.progress}%</td>
                </>
              )}
              {stages.map((stage) => (
                <td key={`${wo.ot}-${stage.name}`} className="px-4 py-2">
                  <DateCell
                    date={wo.dates[stage.name] || ''}
                    onDateChange={(date) => onDateChange(wo.ot, stage.name, date)}
                    disabled={isArchived}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}