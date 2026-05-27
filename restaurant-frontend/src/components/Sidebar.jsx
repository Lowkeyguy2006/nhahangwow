import { NavLink, useNavigate } from "react-router-dom";
import { CaretDown, SignOut, UserCircle } from "@phosphor-icons/react";
import { useState } from "react";

const menuItems = [
  { path: "/admin/dashboard", label: "Tổng quan" },
  { path: "/admin/menu",  label: "Thực đơn" },
  { path: "/admin/tables", label: "Sơ đồ bàn" },
  { path: "/admin/orders", label: "Đơn hàng" },
  { path: "/admin/kitchen", label: "Nhà bếp" },
  { path: "/admin/reports", label: "Báo cáo" },
  { path: "/admin/settings", label: "Cài đặt" },
  { path: "/admin/staff",  label: "Nhân sự" },
  { path: "/admin/menu",label: "Thực đơn" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [accountOpen, setAccountOpen] = useState(false);
  const displayName = user.full_name || "Admin";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="w-56 min-h-screen bg-white border-r border-gray-100 flex flex-col">
      <div className="relative p-3 border-b border-gray-100">
        <button
          type="button"
          onClick={() => setAccountOpen((open) => !open)}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500/30"
          aria-expanded={accountOpen}
          aria-haspopup="menu"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-50 text-green-600">
            {displayName ? (
              <span className="text-sm font-semibold">{displayName.charAt(0).toUpperCase()}</span>
            ) : (
              <UserCircle size={22} weight="duotone" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-800">{displayName}</p>
            <p className="text-xs text-gray-400">Admin</p>
          </div>
          <CaretDown
            size={16}
            className={`text-gray-400 transition-transform ${accountOpen ? "rotate-180" : ""}`}
          />
        </button>

        {accountOpen && (
          <div
            role="menu"
            className="absolute left-3 right-3 top-[68px] z-20 rounded-lg border border-gray-100 bg-white p-1 shadow-lg"
          >
            <button
              type="button"
              onClick={handleLogout}
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            >
              <SignOut size={18} />
              Đăng xuất
            </button>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-green-50 text-green-600 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

    </div>
  );
}
