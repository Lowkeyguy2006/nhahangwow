import { NavLink, useNavigate } from "react-router-dom";
import {
  CaretDown,
  ChartBar,
  ChefHat,
  GearSix,
  ListChecks,
  SignOut,
  SquaresFour,
  UserCircle,
  UsersThree,
  ForkKnife,
} from "@phosphor-icons/react";
import { useState } from "react";

const menuItems = [
  { path: "/admin/dashboard", label: "Tổng quan", icon: SquaresFour },
  { path: "/admin/menu", label: "Thực đơn", icon: ForkKnife },
  { path: "/admin/kitchen", label: "Nhà bếp", icon: ChefHat },
  { path: "/admin/reports", label: "Báo cáo", icon: ChartBar },
  { path: "/admin/settings", label: "Cài đặt", icon: GearSix },
  { path: "/admin/staff", label: "Nhân sự", icon: UsersThree },
];

const upcomingItems = [
  { label: "Sơ đồ bàn", icon: ListChecks },
  { label: "Đơn hàng", icon: ListChecks },
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
    <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-gray-100 bg-white">
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
      <nav className="flex-1 space-y-1 p-3">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setAccountOpen(false)}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${
                  isActive
                    ? "bg-green-50 font-semibold text-green-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              <Icon size={20} weight="duotone" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <div className="pt-3">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-gray-300">
            Sắp có
          </p>
          <div className="mt-2 space-y-1">
            {upcomingItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm text-gray-300"
                  aria-disabled="true"
                >
                  <Icon size={19} weight="duotone" />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </nav>

    </aside>
  );
}
