import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-auto p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}
