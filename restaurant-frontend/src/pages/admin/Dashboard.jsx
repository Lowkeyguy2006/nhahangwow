import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import API from "../../services/api";

const StatCard = ({ label, value, helper, tone = "emerald" }) => {
  const toneClass = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    slate: "bg-slate-50 text-slate-600",
  }[tone];

  return (
  <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        <p className="mt-2 text-xs font-medium text-gray-400">{helper}</p>
      </div>
      <div className={`h-10 w-10 rounded-lg ${toneClass}`} />
    </div>
  </div>
  );
};

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="h-12 animate-pulse rounded-lg bg-gray-100" />
      ))}
    </div>
  );
}

function EmptyOrders() {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-xl bg-gray-50 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
        #
      </div>
      <p className="mt-4 font-semibold text-gray-900">Chưa có đơn hàng đang mở</p>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        Khi có đơn mới hoặc bàn đang phục vụ, trạng thái sẽ xuất hiện ở đây.
      </p>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    doanh_thu: 0,
    tong_don: 0,
    tong_mon: 0,
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setError("");
      try {
        const [revenueRes, ordersRes] = await Promise.all([
          API.get("/api/reports/revenue/day"),
          API.get("/api/orders/active"),
        ]);
        setStats({
          doanh_thu: revenueRes.data.tong_doanh_thu || 0,
          tong_don: revenueRes.data.tong_don || 0,
        });
        setOrders(ordersRes.data || []);
      } catch {
        setError("Không tải được dữ liệu tổng quan. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatMoney = (amount) =>
    new Intl.NumberFormat("vi-VN").format(amount) + "đ";

  const getStatusColor = (status) => {
    switch (status) {
      case "dang_goi": return "bg-blue-100 text-blue-600";
      case "cho_thanh_toan": return "bg-yellow-100 text-yellow-600";
      case "da_thanh_toan": return "bg-green-100 text-green-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "dang_goi": return "Đang gọi";
      case "cho_thanh_toan": return "Chờ TT";
      case "da_thanh_toan": return "Đã TT";
      default: return status;
    }
  };

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Báo cáo Hiệu suất</h1>
          <p className="text-gray-500 text-sm mt-1">
            Tình hình hoạt động hôm nay
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {["Ngày", "Tuần", "Tháng"].map((t) => (
            <button
              key={t}
              className={`min-h-10 shrink-0 rounded-lg px-4 text-sm font-medium transition-colors ${
                t === "Ngày"
                  ? "bg-green-500 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {/* Stat Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Doanh thu ngày" value={formatMoney(stats.doanh_thu)} helper="Tổng doanh thu hôm nay" />
        <StatCard label="Tổng đơn hàng" value={stats.tong_don} helper="Đơn đã ghi nhận" tone="blue" />
        <StatCard label="Bàn đang dùng" value={orders.length} helper="Đơn đang hoạt động" tone="amber" />
        <StatCard label="Tổng khách hàng" value={stats.tong_khach || 0} helper="Theo dữ liệu báo cáo" tone="slate" />
      </div>
      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold text-gray-800">
            Trạng thái đơn hàng trực tiếp
          </h2>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Đang gọi
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              Chờ thanh toán
            </span>
          </div>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : orders.length === 0 ? (
          <EmptyOrders />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left pb-3">MÃ ĐƠN</th>
                <th className="text-left pb-3">BÀN</th>
                <th className="text-left pb-3">TỔNG CỘNG</th>
                <th className="text-left pb-3">THỜI GIAN</th>
                <th className="text-left pb-3">TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order) => (
                <tr key={order.id} className="text-sm transition-colors hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-800">
                    #ORD-{order.id}
                  </td>
                  <td className="py-3 text-gray-600">
                    {order.table_name || `Bàn ${order.table_id}`}
                  </td>
                  <td className="py-3 text-gray-800">
                    {formatMoney(order.total_amount || 0)}
                  </td>
                  <td className="py-3 text-gray-400">
                    {new Date(order.created_at).toLocaleTimeString("vi-VN")}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
