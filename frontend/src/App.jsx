import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import DepartmentDashboard from './pages/DepartmentDashboard';
import LabDashboard from './pages/LabDashboard';
import RegisterEquipment from './pages/RegisterEquipment';
import AssignLocation from './pages/AssignLocation';

function RootRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={user?.role === 'Department' ? '/department' : '/lab'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />
          
          {/* Public Registration Routes */}
          <Route path="/register-equipment" element={<RegisterEquipment />} />
          <Route path="/register-equipment/assign" element={<AssignLocation />} />

          <Route
            path="/department"
            element={
              <PrivateRoute allowedRoles={['Department']}>
                <DepartmentDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/lab"
            element={
              <PrivateRoute allowedRoles={['Lab']}>
                <LabDashboard />
              </PrivateRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
