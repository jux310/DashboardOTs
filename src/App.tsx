import React, { useState, useEffect } from 'react';
import { Factory } from 'lucide-react';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { WorkOrderTable } from './components/WorkOrderTable';
import { TabNavigation } from './components/TabNavigation';
import { Dashboard } from './components/Dashboard';
import { NewWorkOrderForm } from './components/NewWorkOrderForm';
import { Watermark } from './components/Watermark';
import { INCO_STAGES, ANTI_STAGES } from './types';
import { useWorkOrders } from './hooks/useWorkOrders';

function App() {
  const [session, setSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inco');
  const { incoOrders, antiOrders, archivedOrders, loading, error, createWorkOrder, updateWorkOrderDate } = useWorkOrders(session);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function initSession() {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
      } catch (error) {
        console.error('Session initialization error:', error);
        setSession(null);
      } finally {
        setSessionLoading(false);
      }
    }

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', session ? 'logged in' : 'logged out');
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await supabase.auth.signOut();
      setSession(null);
    } catch (error) {
      console.error('Error during logout:', error);
      // Force clear the session if the logout fails
      setSession(null);
      supabase.auth.clearSession();
    } finally {
      setLoggingOut(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="text-gray-600">Cargando órdenes de trabajo...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
            <Factory className={`h-8 w-8 ${
              activeTab === 'inco' ? 'text-[#00843D]' : 
              activeTab === 'anti' ? 'text-[#BF0900]' : 
              'text-blue-600'
            }`} />
            <h1 className="text-3xl font-bold text-gray-900">
              Seguimiento de OTs
            </h1>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              {loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-8">
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        
        {activeTab === 'dashboard' && (
          <div className="relative">
            <Watermark />
            <Dashboard
              incoOrders={incoOrders}
              antiOrders={antiOrders}
              archivedOrders={archivedOrders}
            />
          </div>
        )}

        {activeTab === 'inco' && (
          <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">INCOMET</h2>
            <NewWorkOrderForm onSubmit={createWorkOrder} />
          </div>
          <WorkOrderTable
            workOrders={incoOrders}
            stages={INCO_STAGES}
            onDateChange={(ot, stage, date) => updateWorkOrderDate(ot, stage, date, 'INCO')}
          />
        </section>
        )}

        {activeTab === 'anti' && (
          <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">ANTICORR</h2>
          <WorkOrderTable
            workOrders={antiOrders}
            stages={ANTI_STAGES}
            onDateChange={(ot, stage, date) => updateWorkOrderDate(ot, stage, date, 'ANTI')}
          />
        </section>
        )}

        {activeTab === 'archived' && archivedOrders.length > 0 && (
          <section className="mt-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Despachados</h2>
            <WorkOrderTable
              workOrders={archivedOrders}
              stages={[...INCO_STAGES, ...ANTI_STAGES]}
              onDateChange={() => {}}
              isArchived
            />
          </section>
        )}
      </main>
    </div>
  );
}

export default App