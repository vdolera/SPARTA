import { Navigate } from 'react-router-dom';

export default function BlockRoute({ children }) {
  const auth = JSON.parse(localStorage.getItem('auth'));

  if (!auth || !auth.email) {
    return <Navigate to="/" replace />;
  }

  return children;
}
