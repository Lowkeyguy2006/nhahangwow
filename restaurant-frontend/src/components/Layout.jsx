import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  return (
    <div className="admin-soft-grid flex min-h-screen bg-[#eff1ea]">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-auto px-6 py-5">
        {children}
      </main>
    </div>
  );
}
