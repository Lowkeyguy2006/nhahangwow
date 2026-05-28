import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/admin/Dashboard";
import Staff from "./pages/admin/Staff";
import MenuPage from "./pages/admin/Menu";
import AdminWarehousePage from "./pages/admin/Warehouse";
import KitchenWarehousePage from "./pages/kitchen/Warehouse";
import ReportsPage from "./pages/admin/Report";
import SettingsPage from "./pages/admin/Settings";
import useAuth from "./hooks/useAuth";
import { canAccess, ROLES } from "./utils/permissions";

function PrivateRoute({ children, roles }) {
  const { isAuthenticated, user, defaultPath } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!canAccess(user, roles)) return <Navigate to={defaultPath} />;

  return children;
}

function DefaultRedirect() {
  const { defaultPath } = useAuth();
  return <Navigate to={defaultPath} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/admin/staff" element={<PrivateRoute roles={[ROLES.ADMIN]}><Staff /></PrivateRoute>} />
        <Route path="/admin/menu" element={<PrivateRoute roles={[ROLES.ADMIN]}><MenuPage /></PrivateRoute>}/>
        <Route path="/admin/dashboard" element={<PrivateRoute roles={[ROLES.ADMIN]}><Dashboard /></PrivateRoute>}/>
        <Route path="/admin/warehouse" element={<PrivateRoute roles={[ROLES.ADMIN]}><AdminWarehousePage /></PrivateRoute>} />
        <Route path="/kitchen" element={<PrivateRoute roles={[ROLES.KITCHEN]}><Navigate to="/kitchen/warehouse" /></PrivateRoute>} />
        <Route path="/kitchen/warehouse" element={<PrivateRoute roles={[ROLES.KITCHEN]}><KitchenWarehousePage /></PrivateRoute>} />
        <Route path="/admin/kitchen" element={<PrivateRoute roles={[ROLES.ADMIN]}><Navigate to="/admin/warehouse" /></PrivateRoute>} />
        <Route path="/admin/reports" element={<PrivateRoute roles={[ROLES.ADMIN]}><ReportsPage /></PrivateRoute>} />
        <Route path="/admin/settings" element={<PrivateRoute roles={[ROLES.ADMIN]}><SettingsPage /></PrivateRoute>} />
        <Route path="/admin/setting" element={<PrivateRoute roles={[ROLES.ADMIN]}><SettingsPage /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute roles={[ROLES.ADMIN]}><Navigate to="/admin/dashboard" /></PrivateRoute>} />
        <Route path="*" element={<PrivateRoute><DefaultRedirect /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
