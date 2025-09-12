import { useMeQuery } from '../features/auth/services/authApi';
import { Navigate, Outlet } from 'react-router-dom';
import { Spinner } from './UI/spinner';

function RequireAuth() {
  const { isLoading, isError } = useMeQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Spinner size="lg" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isError) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default RequireAuth;
