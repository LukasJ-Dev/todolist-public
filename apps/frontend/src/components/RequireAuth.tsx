import { useMeQuery } from '../services/authApi';

import { Navigate, Outlet } from 'react-router-dom';

function RequireAuth() {
  const { isLoading, isError } = useMeQuery();
  if (isLoading) return null; // or a spinner
  if (isError) return <Navigate to="/signin" replace />;
  return <Outlet />;
}

export default RequireAuth;
