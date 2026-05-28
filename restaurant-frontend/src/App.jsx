import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/admin/Dashboard";
import Staff from "./pages/admin/Staff";
import MenuPage from "./pages/admin/Menu";
import WarehousePage from "./pages/kitchen/Warehouse";
import ReportsPage from "./pages/admin/Report";
import SettingsPage from "./pages/admin/Settings";

const getDefaultPath = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const roleId = Number(user.role_id);
  if (roleId === 3) return "/kitchen/warehouse";
  if (roleId === 2) return "/staff/order";
  return "/admin/dashboard";
};

function PrivateRoute({ children, roles }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const roleId = Number(user.role_id);

  if (!token) return <Navigate to="/login" />;
  if (roles && !roles.includes(roleId)) return <Navigate to={getDefaultPath()} />;

  return children;
}
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/admin/staff" element={<PrivateRoute roles={[1]}><Staff /></PrivateRoute>} />
        <Route path="/admin/menu" element={<PrivateRoute roles={[1]}><MenuPage /></PrivateRoute>}/>
        <Route path="/admin/dashboard" element={<PrivateRoute roles={[1]}><Dashboard /></PrivateRoute>}/>
        <Route path="/kitchen" element={<PrivateRoute roles={[1, 3]}><Navigate to="/kitchen/warehouse" /></PrivateRoute>} />
        <Route path="/kitchen/warehouse" element={<PrivateRoute roles={[1, 3]}><WarehousePage /></PrivateRoute>} />
        <Route path="/admin/kitchen" element={<PrivateRoute roles={[1, 3]}><Navigate to="/kitchen/warehouse" /></PrivateRoute>} />
        <Route path="/admin/reports" element={<PrivateRoute roles={[1]}><ReportsPage /></PrivateRoute>} />
        <Route path="/admin/settings" element={<PrivateRoute roles={[1]}><SettingsPage /></PrivateRoute>} />
        <Route path="/admin/setting" element={<PrivateRoute roles={[1]}><SettingsPage /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute roles={[1]}><Navigate to="/admin/dashboard" /></PrivateRoute>} />
        <Route path="*" element={<PrivateRoute><Navigate to={getDefaultPath()} /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
