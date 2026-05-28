import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle,
  ClockCounterClockwise,
  MagnifyingGlass,
  Package,
  Plus,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import Layout from "../../components/Layout";
import API from "../../services/api";

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

const formatDateTime = (value) => {
  if (!value) return "Chưa có thời gian";

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
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
    <article className="admin-panel-pad admin-lift">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneClass}`}>
          <Icon size={22} weight="duotone" />
        </span>
      </div>
    </article>
  );
}

export default function WarehousePage() {
  const [ingredients, setIngredients] = useState([]);
  const [logs, setLogs] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [ingredientForm, setIngredientForm] = useState(emptyIngredientForm);
  const [movementForm, setMovementForm] = useState(emptyMovementForm);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [ingredientDropdownOpen, setIngredientDropdownOpen] = useState(false);
  const [submittingIngredient, setSubmittingIngredient] = useState(false);
  const [submittingMovement, setSubmittingMovement] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

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
        setIngredientSearch((current) => current || nextIngredients[0]?.name || "");
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
      fetchInventory(shouldUpdate);
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(initialLoad);
    };
  }, []);

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

  const selectedIngredient = useMemo(
    () => ingredients.find((ingredient) => String(ingredient.id) === String(movementForm.ingredient_id)),
    [ingredients, movementForm.ingredient_id],
  );

  const searchedIngredients = useMemo(() => {
    const query = ingredientSearch.trim().toLowerCase();
    if (!query) return ingredients;

    return ingredients.filter((ingredient) =>
      `${ingredient.name} ${ingredient.unit}`.toLowerCase().includes(query),
    );
  }, [ingredients, ingredientSearch]);

  const handleSelectIngredient = (ingredient) => {
    setMovementForm((current) => ({
      ...current,
      ingredient_id: ingredient.id,
    }));
    setIngredientSearch(ingredient.name);
    setIngredientDropdownOpen(false);
  };

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

  return (
    <Layout>
      <div className="admin-page">
        <header className="admin-header">
          <div>
            <p className="admin-kicker">Nhà bếp</p>
            <h1 className="admin-title">Kho nguyên liệu</h1>
            <p className="admin-subtitle">
              Theo dõi tồn kho, nhập xuất nguyên liệu và nhật ký vận hành trong ca.
            </p>
          </div>
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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Package} label="Tổng nguyên liệu" value={inventoryStats.total} />
            <StatCard icon={CheckCircle} label="Tồn kho ổn định" value={inventoryStats.healthy} tone="blue" />
            <StatCard icon={WarningCircle} label="Sắp hết" value={inventoryStats.lowStock} tone="amber" />
            <StatCard icon={WarningCircle} label="Hết hàng" value={inventoryStats.outStock} tone="red" />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
            <div className="admin-panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <h3 className="font-semibold text-gray-900">Tồn kho hiện tại</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">{ingredients.length} nguyên liệu</span>
                  <button
                    type="button"
                    onClick={() => setLogOpen(true)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                    aria-label="Xem nhật ký kho"
                    title="Nhật ký kho"
                  >
                    <ClockCounterClockwise size={19} weight="duotone" />
                  </button>
                </div>
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
              <form onSubmit={handleInventoryMovement} className="admin-panel-pad">
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

                  <div>
                    <p className="text-sm font-semibold text-gray-700">Nguyên liệu</p>
                    <div className="relative mt-1">
                      <MagnifyingGlass
                        size={18}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="search"
                        value={ingredientSearch}
                        onFocus={() => setIngredientDropdownOpen(true)}
                        onBlur={() => {
                          setTimeout(() => setIngredientDropdownOpen(false), 120);
                        }}
                        onChange={(event) => {
                          setIngredientSearch(event.target.value);
                          setIngredientDropdownOpen(true);
                          if (selectedIngredient && event.target.value !== selectedIngredient.name) {
                            setMovementForm((current) => ({ ...current, ingredient_id: "" }));
                          }
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Escape") setIngredientDropdownOpen(false);
                        }}
                        placeholder="Tìm nguyên liệu..."
                        className="min-h-11 w-full rounded-lg border border-gray-200 pl-10 pr-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                        required
                      />

                      {ingredientDropdownOpen ? (
                        <div
                          className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-lg border border-gray-100 bg-white p-2 shadow-xl"
                          onMouseDown={(event) => event.preventDefault()}
                        >
                          {searchedIngredients.length === 0 ? (
                            <div className="px-3 py-6 text-center">
                              <p className="text-sm font-semibold text-gray-900">Không tìm thấy nguyên liệu</p>
                              <p className="mt-1 text-xs text-gray-500">Thử từ khóa khác hoặc thêm nguyên liệu mới.</p>
                            </div>
                          ) : (
                            searchedIngredients.map((ingredient) => (
                              <button
                                key={ingredient.id}
                                type="button"
                                onClick={() => handleSelectIngredient(ingredient)}
                                className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                                  String(movementForm.ingredient_id) === String(ingredient.id)
                                    ? "bg-emerald-50"
                                    : "hover:bg-gray-50"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">{ingredient.name}</p>
                                    <p className="mt-0.5 text-xs text-gray-500">
                                      Tồn: {formatNumber(ingredient.quantity)} {ingredient.unit}
                                    </p>
                                  </div>
                                  <StockBadge ingredient={ingredient} />
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <label className="block text-sm font-semibold text-gray-700">
                    Số lượng
                    <div className="mt-1 flex min-h-11 overflow-hidden rounded-lg border border-gray-200 focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-100">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={movementForm.quantity}
                        onChange={(event) => setMovementForm({ ...movementForm, quantity: event.target.value })}
                        className="min-w-0 flex-1 px-3 text-sm font-normal outline-none"
                        required
                      />
                      <span className="flex items-center border-l border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-600">
                        {selectedIngredient?.unit || "đơn vị"}
                      </span>
                    </div>
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
                    disabled={submittingMovement || ingredients.length === 0 || !movementForm.ingredient_id}
                    className="min-h-11 w-full rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                  >
                    {submittingMovement ? "Đang cập nhật..." : "Cập nhật tồn kho"}
                  </button>
                </div>
              </form>

              <form onSubmit={handleCreateIngredient} className="admin-panel-pad">
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

          {logOpen ? (
            <div className="fixed inset-0 z-50 flex items-start justify-end bg-slate-950/30 p-4 backdrop-blur-sm sm:p-6">
              <section className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100vh-3rem)]">
                <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
                      Lịch sử
                    </p>
                    <h3 className="mt-1 text-lg font-black text-gray-950">Nhật ký kho</h3>
                    <p className="mt-1 text-sm font-medium text-gray-500">{logs.length} giao dịch nhập xuất</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLogOpen(false)}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                    aria-label="Đóng nhật ký kho"
                  >
                    <X size={18} weight="bold" />
                  </button>
                </div>

                {logs.length === 0 ? (
                  <div className="flex min-h-72 flex-col items-center justify-center px-6 py-10 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                      <ClockCounterClockwise size={24} weight="duotone" />
                    </div>
                    <p className="mt-4 font-semibold text-gray-900">Chưa có nhật ký kho</p>
                    <p className="mt-2 max-w-sm text-sm text-gray-500">
                      Khi có nhập hoặc xuất kho, lịch sử sẽ hiển thị đầy đủ ở đây.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-y-auto p-4">
                    <div className="space-y-2">
                      {logs.map((log) => (
                        <article key={log.id} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-black text-gray-950">{log.ingredient_name}</p>
                              <p className="mt-1 text-xs font-semibold text-gray-500">
                                {formatDateTime(log.created_at)} · {log.account_name || "Hệ thống"}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${
                                log.type === "nhap"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {log.type === "nhap" ? "Nhập kho" : "Xuất kho"}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                            <span className="rounded-lg bg-white px-2.5 py-1 font-bold text-gray-800">
                              {formatNumber(log.quantity)} {log.unit || ""}
                            </span>
                            {log.note ? (
                              <span className="min-w-0 rounded-lg bg-white px-2.5 py-1 font-medium text-gray-500">
                                {log.note}
                              </span>
                            ) : null}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </div>
          ) : null}
        </section>

      </div>

    </Layout>
  );
}
