import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // 🚀 IMPORT REACT QUERY
import Toast from './Toast';

// --- LAZY LOADED ROUTES ---
const Login = lazy(() => import('./Login'));
const Dashboard = lazy(() => import('./Dashboard'));
const Register = lazy(() => import('./Register'));

// --- CACHE SETUP ---
// We initialize the cache and set standard rules for the whole app.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
      refetchOnWindowFocus: false, // Don't refetch just because the user clicked to another tab and back
      retry: 1, // Only retry failed requests once
    },
  },
});

const AppLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%', backgroundColor: '#f8fafc', color: '#64748b' }}>
      <div style={{ animation: 'pulse 1.5s infinite ease-in-out', fontWeight: '500' }}>Loading Application...</div>
      <style>{`@keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }`}</style>
  </div>
);

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [toast, setToast] = useState(null); 

  useEffect(() => {
    if(token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  const notify = (message, type = 'success') => {
    setToast({ message, type });
  };

  const appStyle = {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    color: '#1e293b',
  };

  return (
    // 🚀 WRAP THE APP IN THE CACHE PROVIDER
    <QueryClientProvider client={queryClient}>
        <Router>
        <div style={appStyle}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <Suspense fallback={<AppLoader />}>
            <Routes>
                <Route path="/login" element={!token ? <Login setToken={setToken} notify={notify} /> : <Navigate to="/" />} />
                <Route path="/register" element={!token ? <Register setToken={setToken} notify={notify} /> : <Navigate to="/" />} />
                <Route path="/" element={token ? <Dashboard token={token} setToken={setToken} notify={notify} /> : <Navigate to="/login" />} />
            </Routes>
            </Suspense>
        </div>
        </Router>
    </QueryClientProvider>
  );
}

export default App;