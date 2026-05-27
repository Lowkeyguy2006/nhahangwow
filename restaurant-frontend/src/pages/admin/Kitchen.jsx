import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle,
  Clock,
  CookingPot,
  Package,
  Plus,
  WarningCircle,
} from "@phosphor-icons/react";
import Layout from "../../components/Layout";
import API from "../../services/api";

const STATUS = {
  cho: {
    label: "Chờ nấu",
    color: "bg-amber-100 text-amber-700",
    next: "dang_nau",
    nextLabel: "Bắt đầu nấu",
  },
  dang_nau: {
    label: "Đang nấu",
    color: "bg-blue-100 text-blue-700",
    next: "hoan_thanh",
    nextLabel: "Hoàn thành",
  },
  hoan_thanh: {
    label: "Hoàn thành",
    color: "bg-emerald-100 text-emerald-700",
    next: null,
    nextLabel: null,
  },
  huy: {
    label: "Đã hủy",
    color: "bg-red-100 text-red-700",
    next: null,
    nextLabel: null,
  },
};

const kitchenTabs = [
  { key: "cho", label: "Chờ nấu", icon: Clock },
  { key: "dang_nau", label: "Đang nấu", icon: CookingPot },
  { key: "hoan_thanh", label: "Hoàn thành", icon: CheckCircle },
];

const emptyIngredientForm = {
  name: "",
  unit: "kg",
};

const emptyMovementForm = {
  ingredient_id: "",
  type: "nhap",
  quantity: "",
  note: "",
};

const formatNumber = (value) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(Number(value) || 0);

const getTimeDiff = (createdAt) => {
  const diff = Math.floor((new Date() - new Date(createdAt)) / 60000);
  if (diff < 1) return "Vừa xong";
  if (diff < 60) return `${diff} phút trước`;
  return `${Math.floor(diff / 60)} giờ trước`;
};

const getTimeColor = (createdAt) => {
  const diff = Math.floor((new Date() - new Date(createdAt)) / 60000);
  if (diff > 20) return "text-red-600 font-semibold";
  if (diff > 10) return "text-amber-600 font-semibold";
  return "text-gray-500";
};

function StockBadge({ ingredient }) {
  const quantity = Number(ingredient.quantity) || 0;
  const minimum = Number(ingredient.min_quantity) || 0;

  if (quantity <= 0) {
    return <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">Hết hàng</span>;
  }

  if (quantity <= minimum) {
    return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Sắp hết</span>;
  }

  return <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Ổn định</span>;
}

function StatCard({ label, value, icon: Icon, tone = "emerald" }) {
  const toneClass = {
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
  }[tone];

  return (
    <article className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneClass}`}>
          <Icon size={22} weight="duotone" />
        </span>
      </div>
    </article>
  );
}

export default function KitchenPage() {
  const [orders, setOrders] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [filter, setFilter] = useState("cho");
  const [updating, setUpdating] = useState(null);
  const [ingredientForm, setIngredientForm] = useState(emptyIngredientForm);
  const [movementForm, setMovementForm] = useState(emptyMovementForm);
  const [submittingIngredient, setSubmittingIngredient] = useState(false);
  const [submittingMovement, setSubmittingMovement] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const fetchKitchenOrders = async (shouldUpdate = () => true) => {
    try {
      const res = await API.get("/api/orders/kitchen");
      if (shouldUpdate()) setOrders(res.data || []);
    } catch {
      if (shouldUpdate()) setError("Không tải được danh sách món trong bếp.");
    } finally {
      if (shouldUpdate()) setLoading(false);
    }
  };

  const fetchInventory = async (shouldUpdate = () => true) => {
    try {
      const [ingredientsRes, logsRes] = await Promise.all([
        API.get("/api/inventory"),
        API.get("/api/inventory/logs"),
      ]);

      if (shouldUpdate()) {
        const nextIngredients = ingredientsRes.data || [];
        setIngredients(nextIngredients);
        setLogs(logsRes.data || []);
        setMovementForm((current) => ({
          ...current,
          ingredient_id: current.ingredient_id || nextIngredients[0]?.id || "",
        }));
      }
    } catch {
      if (shouldUpdate()) setError("Không tải được dữ liệu kho nguyên liệu.");
    } finally {
      if (shouldUpdate()) setInventoryLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const shouldUpdate = () => isMounted;

    const initialLoad = setTimeout(() => {
      fetchKitchenOrders(shouldUpdate);
      fetchInventory(shouldUpdate);
    }, 0);

    const interval = setInterval(() => fetchKitchenOrders(shouldUpdate), 15000);

    return () => {
      isMounted = false;
      clearTimeout(initialLoad);
      clearInterval(interval);
    };
  }, []);

  const filteredOrders = useMemo(
    () => orders.filter((order) => order.status === filter),
    [orders, filter],
  );

  const counts = useMemo(
    () => ({
      cho: orders.filter((order) => order.status === "cho").length,
      dang_nau: orders.filter((order) => order.status === "dang_nau").length,
      hoan_thanh: orders.filter((order) => order.status === "hoan_thanh").length,
    }),
    [orders],
  );

  const inventoryStats = useMemo(() => {
    const lowStock = ingredients.filter(
      (item) => Number(item.quantity) > 0 && Number(item.quantity) <= Number(item.min_quantity),
    ).length;
    const outStock = ingredients.filter((item) => Number(item.quantity) <= 0).length;

    return {
      total: ingredients.length,
      lowStock,
      outStock,
      healthy: Math.max(ingredients.length - lowStock - outStock, 0),
    };
  }, [ingredients]);

  const handleCreateIngredient = async (event) => {
    event.preventDefault();
    setSubmittingIngredient(true);
    setNotice("");
    setError("");

    try {
      await API.post("/api/inventory", {
        ...ingredientForm,
        quantity: 0,
        min_quantity: 0,
      });
      setIngredientForm(emptyIngredientForm);
      setNotice("Đã thêm nguyên liệu mới vào kho.");
      await fetchInventory();
    } catch (err) {
      setError(err.response?.data?.message || "Không thêm được nguyên liệu.");
    } finally {
      setSubmittingIngredient(false);
    }
  };

  const handleInventoryMovement = async (event) => {
    event.preventDefault();
    setSubmittingMovement(true);
    setNotice("");
    setError("");

    const endpoint = movementForm.type === "nhap" ? "/api/inventory/import" : "/api/inventory/export";

    try {
      await API.post(endpoint, {
        ingredient_id: Number(movementForm.ingredient_id),
        quantity: Number(movementForm.quantity),
        note: movementForm.note,
      });
      setMovementForm((current) => ({ ...current, quantity: "", note: "" }));
      setNotice(movementForm.type === "nhap" ? "Đã nhập kho thành công." : "Đã xuất kho thành công.");
      await fetchInventory();
    } catch (err) {
      setError(err.response?.data?.message || "Không cập nhật được tồn kho.");
    } finally {
      setSubmittingMovement(false);
    }
  };

  const handleUpdateStatus = async (orderId, itemId, nextStatus) => {
    setUpdating(itemId);
    setError("");

    try {
      await API.patch(`/api/orders/${orderId}/items/${itemId}/status`, {
        status: nextStatus,
      });
      await fetchKitchenOrders();
    } catch {
      setError("Không cập nhật được trạng thái món.");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <Layout>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-emerald-700">Nhà bếp</p>
          <h1 className="text-2xl font-bold text-gray-900">Kho nguyên liệu và hàng chờ bếp</h1>
          <p className="max-w-3xl text-sm text-gray-500">
            Kiểm tra tồn kho trước khi xử lý món, nhập xuất nguyên liệu nhanh và cập nhật trạng thái chế biến trong cùng một màn hình.
          </p>
        </header>

        {notice ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {notice}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        <section className="space-y-4" aria-label="Quản lý kho nguyên liệu">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-gray-900">Quản lý kho nguyên liệu</h2>
            <p className="text-sm text-gray-500">
              Mục này được đặt trước để bếp kiểm tra nguyên liệu thiếu hoặc nhập xuất kho ngay đầu ca.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Package} label="Tổng nguyên liệu" value={inventoryStats.total} />
            <StatCard icon={CheckCircle} label="Tồn kho ổn định" value={inventoryStats.healthy} tone="blue" />
            <StatCard icon={WarningCircle} label="Sắp hết" value={inventoryStats.lowStock} tone="amber" />
            <StatCard icon={WarningCircle} label="Hết hàng" value={inventoryStats.outStock} tone="red" />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <h3 className="font-semibold text-gray-900">Tồn kho hiện tại</h3>
                <span className="text-xs font-medium text-gray-500">{ingredients.length} nguyên liệu</span>
              </div>

              {inventoryLoading ? (
                <div className="space-y-3 p-4" aria-label="Đang tải kho nguyên liệu">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="h-14 animate-pulse rounded-lg bg-gray-100" />
                  ))}
                </div>
              ) : ingredients.length === 0 ? (
                <div className="flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <Package size={24} weight="duotone" />
                  </div>
                  <p className="mt-4 font-semibold text-gray-900">Chưa có nguyên liệu</p>
                  <p className="mt-2 max-w-md text-sm text-gray-500">
                    Thêm nguyên liệu đầu tiên để bếp theo dõi tồn kho trong ca.
                  </p>
                </div>
              ) : (
                <>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[720px]">
                      <thead>
                        <tr className="border-b border-gray-100 text-xs font-semibold uppercase text-gray-500">
                          <th className="px-4 py-3 text-left">Nguyên liệu</th>
                          <th className="px-4 py-3 text-left">Tồn kho</th>
                          <th className="px-4 py-3 text-left">Mức tối thiểu</th>
                          <th className="px-4 py-3 text-left">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {ingredients.map((ingredient) => (
                          <tr key={ingredient.id} className="text-sm transition-colors hover:bg-gray-50">
                            <td className="px-4 py-3 font-semibold text-gray-900">{ingredient.name}</td>
                            <td className="px-4 py-3 text-gray-700">
                              {formatNumber(ingredient.quantity)} {ingredient.unit}
                            </td>
                            <td className="px-4 py-3 text-gray-500">
                              {formatNumber(ingredient.min_quantity)} {ingredient.unit}
                            </td>
                            <td className="px-4 py-3">
                              <StockBadge ingredient={ingredient} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="divide-y divide-gray-100 md:hidden">
                    {ingredients.map((ingredient) => (
                      <article key={ingredient.id} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-900">{ingredient.name}</p>
                            <p className="mt-1 text-sm text-gray-500">
                              Tồn: {formatNumber(ingredient.quantity)} {ingredient.unit}
                            </p>
                          </div>
                          <StockBadge ingredient={ingredient} />
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="space-y-4">
              <form onSubmit={handleInventoryMovement} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900">Nhập xuất kho</h3>
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: "nhap", label: "Nhập", icon: ArrowDown },
                      { key: "xuat", label: "Xuất", icon: ArrowUp },
                    ].map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.key}
                          type="button"
                          aria-pressed={movementForm.type === option.key}
                          onClick={() => setMovementForm({ ...movementForm, type: option.key })}
                          className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                            movementForm.type === option.key
                              ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                              : "border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <Icon size={18} />
                          {option.label}
                        </button>
                      );
                    })}
                  </div>

                  <label className="block text-sm font-semibold text-gray-700">
                    Nguyên liệu
                    <select
                      value={movementForm.ingredient_id}
                      onChange={(event) => setMovementForm({ ...movementForm, ingredient_id: event.target.value })}
                      className="mt-1 min-h-11 w-full rounded-lg border border-gray-200 px-3 text-sm font-normal outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                      required
                    >
                      <option value="">Chọn nguyên liệu</option>
                      {ingredients.map((ingredient) => (
                        <option key={ingredient.id} value={ingredient.id}>
                          {ingredient.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm font-semibold text-gray-700">
                    Số lượng
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={movementForm.quantity}
                      onChange={(event) => setMovementForm({ ...movementForm, quantity: event.target.value })}
                      className="mt-1 min-h-11 w-full rounded-lg border border-gray-200 px-3 text-sm font-normal outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                      required
                    />
                  </label>

                  <label className="block text-sm font-semibold text-gray-700">
                    Ghi chú
                    <input
                      type="text"
                      value={movementForm.note}
                      onChange={(event) => setMovementForm({ ...movementForm, note: event.target.value })}
                      placeholder="Ví dụ: nhập đầu ca, hủy do hỏng"
                      className="mt-1 min-h-11 w-full rounded-lg border border-gray-200 px-3 text-sm font-normal outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={submittingMovement || ingredients.length === 0}
                    className="min-h-11 w-full rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                  >
                    {submittingMovement ? "Đang cập nhật..." : "Cập nhật tồn kho"}
                  </button>
                </div>
              </form>

              <form onSubmit={handleCreateIngredient} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900">Thêm nguyên liệu nhanh</h3>
                <div className="mt-4 space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Tên nguyên liệu
                    <input
                      type="text"
                      value={ingredientForm.name}
                      onChange={(event) => setIngredientForm({ ...ingredientForm, name: event.target.value })}
                      className="mt-1 min-h-11 w-full rounded-lg border border-gray-200 px-3 text-sm font-normal outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                      required
                    />
                  </label>

                  <label className="block text-sm font-semibold text-gray-700">
                    Đơn vị
                    <input
                      type="text"
                      value={ingredientForm.unit}
                      onChange={(event) => setIngredientForm({ ...ingredientForm, unit: event.target.value })}
                      placeholder="kg, lít, chai, gói"
                      className="mt-1 min-h-11 w-full rounded-lg border border-gray-200 px-3 text-sm font-normal outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                      required
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={submittingIngredient}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                  >
                    <Plus size={18} weight="bold" />
                    {submittingIngredient ? "Đang thêm..." : "Thêm nguyên liệu"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {logs.length > 0 ? (
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900">Nhật ký kho gần đây</h3>
              <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                {logs.slice(0, 4).map((log) => (
                  <div key={log.id} className="rounded-lg bg-gray-50 p-3">
                    <p className={`text-xs font-bold uppercase ${log.type === "nhap" ? "text-emerald-700" : "text-amber-700"}`}>
                      {log.type === "nhap" ? "Nhập kho" : "Xuất kho"}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{log.ingredient_name}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatNumber(log.quantity)} {log.unit || ""} · {log.account_name || "Hệ thống"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="space-y-4" aria-label="Hàng chờ bếp">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-gray-900">Hàng chờ bếp</h2>
            <p className="text-sm text-gray-500">Tự động làm mới mỗi 15 giây.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {kitchenTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  aria-pressed={filter === tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`flex min-h-20 items-center justify-between rounded-xl border p-4 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                    filter === tab.key
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-100 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                      <Icon size={22} weight="duotone" />
                    </span>
                    <span className="text-sm font-semibold">{tab.label}</span>
                  </span>
                  <span className="text-2xl font-bold">{counts[tab.key]}</span>
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Đang tải hàng chờ bếp">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-52 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-gray-100 bg-white px-6 py-12 text-center shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <Clock size={24} weight="duotone" />
              </div>
              <p className="mt-4 font-semibold text-gray-900">Không có món ở trạng thái này</p>
              <p className="mt-2 max-w-md text-sm text-gray-500">
                Khi có món mới từ đơn hàng, bếp sẽ thấy ngay tại đây.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredOrders.map((item) => (
                <article key={item.id} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {item.table_name || `Bàn ${item.table_id}`}
                      </p>
                      <p className="text-xs text-gray-500">Đơn #{item.order_id}</p>
                    </div>
                    <span className={`text-xs ${getTimeColor(item.created_at)}`}>
                      {getTimeDiff(item.created_at)}
                    </span>
                  </div>

                  <div className="p-4">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{item.mon_ten}</p>
                        <p className="mt-1 text-sm text-gray-500">
                          Số lượng: <span className="font-semibold text-gray-800">{item.quantity}</span>
                        </p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS[item.status]?.color}`}>
                        {STATUS[item.status]?.label}
                      </span>
                    </div>

                    {item.note ? (
                      <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
                        {item.note}
                      </p>
                    ) : null}

                    {STATUS[item.status]?.next ? (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(item.order_id, item.id, STATUS[item.status].next)}
                        disabled={updating === item.id}
                        className="min-h-11 w-full rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                      >
                        {updating === item.id ? "Đang cập nhật..." : STATUS[item.status]?.nextLabel}
                      </button>
                    ) : (
                      <div className="min-h-11 rounded-lg bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700">
                        Đã hoàn thành
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
