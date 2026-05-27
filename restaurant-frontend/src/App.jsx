import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/admin/Dashboard";
import Staff from "./pages/admin/Staff";
import MenuPage from "./pages/admin/Menu";
import KitchenPage from "./pages/admin/Kitchen";
import ReportsPage from "./pages/admin/Report";
import SettingsPage from "./pages/admin/Settings";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
}
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/admin/staff" element={<PrivateRoute><Staff /></PrivateRoute>} />
        <Route path="/admin/menu" element={<PrivateRoute><MenuPage /></PrivateRoute>}/>
        <Route path="/admin/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>}/>
        <Route path="/admin/kitchen" element={<PrivateRoute><KitchenPage /></PrivateRoute>} />
        <Route path="/admin/reports" element={<PrivateRoute><ReportsPage /></PrivateRoute>} />
        <Route path="/admin/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
        <Route path="/admin/setting" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><Navigate to="/admin/dashboard" /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/admin/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}
