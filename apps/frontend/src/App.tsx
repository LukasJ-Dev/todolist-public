import './App.css';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import AuthPage from './pages/auth';
import Dashboard from './pages/dashboard';
import LandingPage from './pages/landing';
import AdminPage from './pages/admin';
import RequireAuth from './components/RequireAuth';
import { Toaster } from './components/UI/sonner';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/">
            <Route index element={<LandingPage />} />
            <Route path="login" element={<AuthPage />} />
            <Route path="signin" element={<AuthPage />} />
            <Route path="signup" element={<AuthPage />} />
            <Route path="auth" element={<Navigate to="/login" replace />} />
            <Route path="admin" element={<AdminPage />} />
            <Route element={<RequireAuth />}>
              <Route path="app" element={<Dashboard />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </ErrorBoundary>
  );
}

export default App;
