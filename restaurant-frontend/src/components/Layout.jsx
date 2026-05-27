import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#f5f6f2]">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-auto px-8 py-7">
        {children}
      </main>
    </div>
  );
}
