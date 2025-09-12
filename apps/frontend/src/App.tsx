import './App.css';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import AuthPage from './pages/auth';
import Dashboard from './pages/dashboard';
import RequireAuth from './components/RequireAuth';
import { Toaster } from './components/UI/sonner';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/">
            <Route element={<RequireAuth />}>
              <Route index element={<Dashboard />} />
            </Route>
            <Route path="login" element={<AuthPage />} />
            <Route path="signin" element={<AuthPage />} />
            <Route path="signup" element={<AuthPage />} />
            <Route path="auth" element={<Navigate to="/login" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </ErrorBoundary>
  );
}

export default App;
