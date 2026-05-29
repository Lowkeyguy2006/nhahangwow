import { useEffect, useState, useMemo } from "react";
import {
  ListChecks,
  Plus,
  Minus,
  Trash,
  ArrowsLeftRight,
  GitMerge,
  Check,
  Receipt,
  Percent,
  Clock,
  MagnifyingGlass,
  X,
  Note,
  UserPlus,
  BowlFood,
  CheckCircle,
  CurrencyCircleDollar,
  ArrowRight,
  User,
  Phone,
  ArrowClockwise,
  ForkKnife,
} from "@phosphor-icons/react";
import Layout from "../../components/Layout";
import API from "../../services/api";

export default function Order() {
  // Core states
  const [tables, setTables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [areas, setAreas] = useState([]); // Areas state loaded from DB
  
  // Selection states
  const [selectedTable, setSelectedTable] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  
  // Filtering & Search
  const [selectedArea, setSelectedArea] = useState("Tất cả");
  const [menuSearch, setMenuSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [tableSearch, setTableSearch] = useState("");
  
  // Sub-states
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Modal states
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

  // States for live Area/Table management inside table map
  const [isEditMode, setIsEditMode] = useState(false);
  const [areaModalOpen, setAreaModalOpen] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [mgmtTableName, setMgmtTableName] = useState("");
  const [mgmtTableAreaId, setMgmtTableAreaId] = useState("");
  const [editingTable, setEditingTable] = useState(null);
  const [editingArea, setEditingArea] = useState(null);
  const [editingAreaName, setEditingAreaName] = useState("");
  
  // Operations inputs
  const [promoCode, setPromoCode] = useState("");
  const [checkoutCustomerId, setCheckoutCustomerId] = useState("");
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState("tien_mat");
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  
  // Time updates
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [tablesRes, categoriesRes, menuRes, customersRes, areasRes] = await Promise.all([
        API.get("/api/tables"),
        API.get("/api/menu/categories"),
        API.get("/api/menu"),
        API.get("/api/customers"),
        API.get("/api/tables/areas"),
      ]);
      setTables(tablesRes.data || []);
      setCategories(categoriesRes.data || []);
      setMenuItems(menuRes.data || []);
      setCustomers(customersRes.data || []);
      setAreas(areasRes.data || []);
    } catch (err) {
      setError("Không thể tải thông tin hệ thống. Vui lòng tải lại trang.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Poll active order when a table is selected
  const fetchActiveOrder = async (tableId) => {
    setOrderLoading(true);
    try {
      const res = await API.get(`/api/orders/table/${tableId}/active`);
      setActiveOrder(res.data);
    } catch (err) {
      setError("Lỗi khi tải thông tin order của bàn.");
    } finally {
      setOrderLoading(false);
    }
  };

  const handleSelectTable = (table) => {
    setSelectedTable(table);
    setActiveOrder(null);
    setError("");
    setPromoCode("");
    if (table.status !== "trong") {
      fetchActiveOrder(table.id);
    }
  };

  // 1. Mở bàn / Tạo hóa đơn mới
  const handleOpenTable = async () => {
    if (!selectedTable) return;
    setOrderLoading(true);
    setError("");
    try {
      const res = await API.post("/api/orders", {
        table_id: selectedTable.id,
      });
      // Reload tables to show busy status and load the newly created active order
      await fetchTables();
      await fetchActiveOrder(selectedTable.id);
      
      // Update selected table locally to sync its status
      setSelectedTable(prev => ({ ...prev, status: "dang_dung" }));
      setSuccess("Mở bàn thành công! Có thể gọi món ngay.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi mở bàn.");
    } finally {
      setOrderLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const res = await API.get("/api/tables");
      setTables(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Thêm món vào hóa đơn
  const handleAddItem = async (menuItem) => {
    if (!activeOrder) {
      setError("Vui lòng mở bàn trước khi thêm món ăn!");
      setTimeout(() => setError(""), 3000);
      return;
    }
    setError("");
    try {
      await API.post(`/api/orders/${activeOrder.id}/items`, {
        menu_item_id: menuItem.id,
        quantity: 1,
      });
      await fetchActiveOrder(selectedTable.id);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi thêm món ăn.");
    }
  };

  // 3. Cập nhật số lượng hoặc ghi chú món ăn nháp
  const handleUpdateItem = async (itemId, newQty, note) => {
    if (!activeOrder) return;
    setError("");
    try {
      await API.put(`/api/orders/${activeOrder.id}/items/${itemId}`, {
        quantity: newQty,
        note: note,
      });
      await fetchActiveOrder(selectedTable.id);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi cập nhật món ăn.");
    }
  };

  // 4. Xóa món ăn nháp
  const handleDeleteItem = async (itemId) => {
    if (!activeOrder) return;
    setError("");
    try {
      await API.delete(`/api/orders/${activeOrder.id}/items/${itemId}`);
      await fetchActiveOrder(selectedTable.id);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi xóa món ăn khỏi hóa đơn.");
    }
  };

  // 5. Gửi hóa đơn xuống bếp (In chế biến)
  const handleSendToKitchen = async () => {
    if (!activeOrder) return;
    setError("");
    try {
      await API.post(`/api/orders/${activeOrder.id}/send`);
      await fetchActiveOrder(selectedTable.id);
      setSuccess("Đã gửi order xuống bếp chế biến thành công!");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi gửi bếp.");
    }
  };

  // 6. Áp dụng mã khuyến mãi
  const handleApplyPromo = async () => {
    if (!activeOrder || !promoCode.trim()) return;
    setError("");
    try {
      const res = await API.post(`/api/orders/${activeOrder.id}/promotion`, {
        code: promoCode,
      });
      await fetchActiveOrder(selectedTable.id);
      setSuccess(res.data.message || "Áp dụng khuyến mãi thành công!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Mã khuyến mãi không hợp lệ hoặc đã hết hạn.");
    }
  };

  // 7. Chuyển bàn
  const handleTransferTable = async (targetTableId) => {
    if (!activeOrder) return;
    setError("");
    try {
      await API.post(`/api/orders/${activeOrder.id}/transfer`, {
        target_table_id: targetTableId,
      });
      setSuccess(`Đã chuyển bàn sang bàn mới thành công.`);
      setTimeout(() => setSuccess(""), 3000);
      setSelectedTable(null);
      setActiveOrder(null);
      setTransferModalOpen(false);
      await fetchTables();
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi thực hiện chuyển bàn.");
    }
  };

  // 8. Gộp bàn
  const handleMergeTable = async (targetTableId) => {
    if (!activeOrder) return;
    setError("");
    try {
      await API.post(`/api/orders/${activeOrder.id}/merge`, {
        target_table_id: targetTableId,
      });
      setSuccess("Đã gộp bàn thành công.");
      setTimeout(() => setSuccess(""), 3000);
      setSelectedTable(null);
      setActiveOrder(null);
      setMergeModalOpen(false);
      await fetchTables();
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi gộp bàn.");
    }
  };

  // 9. Hủy hóa đơn
  const handleCancelOrder = async () => {
    if (!activeOrder) return;
    if (!window.confirm(`Bạn có chắc chắn muốn HỦY hóa đơn và giải phóng ${selectedTable.name}? Tất cả các món ăn chưa làm sẽ bị xóa.`)) {
      return;
    }
    setError("");
    try {
      await API.patch(`/api/payment/${activeOrder.id}/cancel`);
      setSuccess("Đã hủy hóa đơn và giải phóng bàn về trống.");
      setTimeout(() => setSuccess(""), 3000);
      setSelectedTable(null);
      setActiveOrder(null);
      await fetchTables();
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi hủy hóa đơn.");
    }
  };

  // 10. Thanh toán
  const handleCheckout = async () => {
    if (!activeOrder) return;
    setError("");
    try {
      const res = await API.post(`/api/payment/${activeOrder.id}/checkout`, {
        payment_method: checkoutPaymentMethod,
        customer_id: checkoutCustomerId || null,
      });
      setSuccess(`Thanh toán thành công! Hóa đơn đã được chốt và in ra.`);
      setTimeout(() => setSuccess(""), 4000);
      setSelectedTable(null);
      setActiveOrder(null);
      setCheckoutModalOpen(false);
      await fetchTables();
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi thực hiện thanh toán.");
    }
  };

  // 11. Tạo nhanh khách hàng
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;
    setError("");
    try {
      const res = await API.post("/api/customers", {
        full_name: newCustName,
        phone: newCustPhone,
        email: newCustEmail || null,
      });
      // Refresh customer list and set the selected customer for points
      const custsRes = await API.get("/api/customers");
      setCustomers(custsRes.data || []);
      setCheckoutCustomerId(res.data.id || "");
      setNewCustName("");
      setNewCustPhone("");
      setNewCustEmail("");
      setCustomerModalOpen(false);
      setSuccess("Đã thêm khách hàng mới thành công!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tạo khách hàng.");
    }
  };

  // 12. Quản lý Khu vực & Bàn trực tiếp tại sơ đồ
  const handleAddArea = async (e) => {
    e.preventDefault();
    if (!newAreaName.trim()) return;
    setError("");
    try {
      await API.post("/api/tables/areas", { name: newAreaName });
      setNewAreaName("");
      setAreaModalOpen(false);
      setSuccess("Đã thêm khu vực mới!");
      setTimeout(() => setSuccess(""), 3000);
      await fetchData(); // Reload areas and tables
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi thêm khu vực.");
    }
  };

  const handleEditArea = async (e) => {
    e.preventDefault();
    if (!editingArea || !editingAreaName.trim()) return;
    setError("");
    try {
      await API.put(`/api/tables/areas/${editingArea.id}`, { name: editingAreaName });
      setEditingArea(null);
      setEditingAreaName("");
      setSuccess("Đã cập nhật tên khu vực!");
      setTimeout(() => setSuccess(""), 3000);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi chỉnh sửa khu vực.");
    }
  };

  const handleDeleteArea = async (areaId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa khu vực này? Tất cả các bàn trong khu vực sẽ cần được cấu hình lại.")) return;
    setError("");
    try {
      await API.delete(`/api/tables/areas/${areaId}`);
      setSelectedArea("Tất cả");
      setSuccess("Đã xóa khu vực thành công!");
      setTimeout(() => setSuccess(""), 3000);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi xóa khu vực.");
    }
  };

  const handleSaveTable = async (e) => {
    e.preventDefault();
    if (!mgmtTableName.trim() || !mgmtTableAreaId) return;
    setError("");
    try {
      if (editingTable) {
        // Edit mode
        await API.put(`/api/tables/${editingTable.id}`, {
          name: mgmtTableName,
          area_id: Number(mgmtTableAreaId),
        });
        setSuccess("Đã cập nhật bàn ăn thành công!");
      } else {
        // Add mode
        await API.post("/api/tables", {
          name: mgmtTableName,
          area_id: Number(mgmtTableAreaId),
        });
        setSuccess("Đã thêm bàn ăn mới!");
      }
      setMgmtTableName("");
      setMgmtTableAreaId("");
      setTableModalOpen(false);
      setEditingTable(null);
      setTimeout(() => setSuccess(""), 3000);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi lưu bàn ăn.");
    }
  };

  const handleDeleteTable = async (tableId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bàn ăn này?")) return;
    setError("");
    try {
      await API.delete(`/api/tables/${tableId}`);
      setSuccess("Đã xóa bàn ăn thành công!");
      setTimeout(() => setSuccess(""), 3000);
      setSelectedTable(null);
      setActiveOrder(null);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi xóa bàn ăn.");
    }
  };

  // Filtered tables
  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      const matchesArea = selectedArea === "Tất cả" || t.area_name === selectedArea;
      const matchesSearch = t.name.toLowerCase().includes(tableSearch.toLowerCase());
      return matchesArea && matchesSearch;
    });
  }, [tables, selectedArea, tableSearch]);

  // Filtered menu items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (!item.is_visible) return false;
      const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase());
      const matchesCat =
        selectedCategory === "Tất cả" ||
        item.category_id === Number(selectedCategory);
      return matchesSearch && matchesCat;
    });
  }, [menuItems, menuSearch, selectedCategory]);

  // Helpers
  const formatMoney = (amount) =>
    new Intl.NumberFormat("vi-VN").format(amount || 0) + "đ";

  const getTableStatusColor = (status) => {
    switch (status) {
      case "trong":
        return "border-emerald-200/70 bg-emerald-50/20 text-emerald-800 hover:bg-emerald-50/40";
      case "dang_dung":
        return "border-amber-200 bg-amber-50/30 text-amber-900 hover:bg-amber-50/50";
      case "da_dat":
        return "border-blue-200 bg-blue-50/20 text-blue-800 hover:bg-blue-50/40";
      default:
        return "border-slate-200 bg-white text-slate-800";
    }
  };

  const getTableStatusBadge = (status) => {
    switch (status) {
      case "trong":
        return <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100/75 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700">Trống</span>;
      case "dang_dung":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-700">
            <span className="admin-live-dot h-1.5 w-1.5"></span> Phục vụ
          </span>
        );
      case "da_dat":
        return <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-1.5 py-0.5 text-[11px] font-bold text-blue-700">Đã đặt</span>;
      default:
        return null;
    }
  };

  // Get active time duration
  const getTableDuration = (orderDate) => {
    if (!orderDate) return "";
    const minutes = Math.floor((new Date() - new Date(orderDate)) / 60000);
    if (minutes < 60) return `${minutes} phút`;
    const hours = Math.floor(minutes / 60);
    const remMins = minutes % 60;
    return remMins > 0 ? `${hours}g ${remMins}ph` : `${hours}g`;
  };

  return (
    <Layout>
      <div className="admin-page">
        {/* Header Block */}
        <header className="admin-header flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="admin-kicker flex items-center gap-1.5">
              <span className="admin-live-dot"></span> Quầy Phục Vụ
            </p>
            <h1 className="admin-title">Hệ thống gọi món & sơ đồ bàn</h1>
            <p className="admin-subtitle">
              Hỗ trợ xem bàn trống, mở order, ghi món xuống bếp, thanh toán nhanh tích điểm VietPho.
            </p>
          </div>
          <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end">
            <div className="flex flex-col items-end text-right">
              <span className="text-xs font-bold text-slate-400">Thời gian thực tế</span>
              <span className="text-sm font-black text-slate-800">
                {currentTime.toLocaleDateString("vi-VN")} - {currentTime.toLocaleTimeString("vi-VN")}
              </span>
            </div>
            <button
              onClick={fetchData}
              type="button"
              className="admin-tab flex h-10 w-10 items-center justify-center p-0 rounded-xl"
              title="Làm mới dữ liệu"
            >
              <ArrowClockwise size={18} className="text-slate-600" />
            </button>
          </div>
        </header>

        {/* Action Alerts */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800 shadow-sm flex items-center gap-2">
            <X size={18} className="rounded-full bg-red-100 p-0.5" />
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800 shadow-sm flex items-center gap-2">
            <CheckCircle size={18} className="text-emerald-600" />
            {success}
          </div>
        )}

        {/* 3-Column POS Screen */}
        <div className="grid grid-cols-12 gap-4">
          
          {/* COLUMN 1: Sơ đồ bàn (col-span-4) */}
          <div className="col-span-12 xl:col-span-4 flex flex-col space-y-4">
            <div className="admin-panel-pad flex-1 flex flex-col min-h-[500px]">
              <div className="mb-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="admin-section-title flex items-center gap-2">
                    <ListChecks size={20} className="text-emerald-700" /> Sơ đồ bàn ăn
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditMode(!isEditMode)}
                      type="button"
                      className={`h-8 rounded-lg px-2 text-[11px] font-black tracking-tight transition ${
                        isEditMode
                          ? "bg-slate-950 text-white hover:bg-slate-900 shadow-sm"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200/60 hover:bg-emerald-100/40"
                      }`}
                    >
                      {isEditMode ? "✓ Hoàn tất" : "⚙ Thiết lập sơ đồ"}
                    </button>
                    <span className="text-xs font-bold text-slate-400">{filteredTables.length} bàn</span>
                  </div>
                </div>
                
                {/* Search Table */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm nhanh số bàn..."
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    className="admin-field pl-10 h-10"
                  />
                  <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>

                {/* Area filter tabs with live edit/delete */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <button
                    onClick={() => setSelectedArea("Tất cả")}
                    type="button"
                    className={`min-h-8 rounded-lg px-2.5 text-xs font-bold transition-colors ${
                      selectedArea === "Tất cả"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Tất cả
                  </button>
                  
                  {areas.map((area) => {
                    const isAreaSelected = selectedArea === area.name;
                    return (
                      <div key={area.id} className="relative group inline-flex items-center">
                        <button
                          onClick={() => setSelectedArea(area.name)}
                          type="button"
                          className={`min-h-8 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isAreaSelected
                              ? "bg-slate-900 text-white pl-2.5 pr-2.5"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200 pl-2.5 pr-2.5"
                          }`}
                        >
                          {editingArea?.id === area.id ? (
                            <form
                              onSubmit={handleEditArea}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1"
                            >
                              <input
                                type="text"
                                value={editingAreaName}
                                onChange={(e) => setEditingAreaName(e.target.value)}
                                className="h-6 w-20 rounded border border-slate-300 px-1 text-[10px] text-slate-950 font-bold outline-none"
                                required
                                autoFocus
                              />
                              <button type="submit" className="text-emerald-500 hover:text-emerald-700">✓</button>
                              <button type="button" onClick={() => setEditingArea(null)} className="text-slate-400 hover:text-slate-600">×</button>
                            </form>
                          ) : (
                            <>
                              <span>{area.name}</span>
                              {isEditMode && (
                                <div className="flex items-center gap-1 ml-1">
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingArea(area);
                                      setEditingAreaName(area.name);
                                    }}
                                    className="hover:bg-slate-200 hover:text-slate-900 text-slate-400 p-0.5 rounded transition text-[10px]"
                                    title="Sửa tên khu"
                                  >
                                    ✎
                                  </span>
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteArea(area.id);
                                    }}
                                    className="hover:bg-red-100 hover:text-red-700 text-slate-400 p-0.5 rounded transition"
                                    title="Xóa khu"
                                  >
                                    <Trash size={11} />
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                  
                  {isEditMode && (
                    <button
                      onClick={() => setAreaModalOpen(true)}
                      type="button"
                      className="min-h-8 rounded-lg px-2 border border-dashed border-emerald-500 text-emerald-700 bg-emerald-50/30 hover:bg-emerald-50 text-xs font-black flex items-center gap-1.5 transition"
                    >
                      <Plus size={11} weight="bold" /> Thêm khu
                    </button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="flex flex-1 flex-col items-center justify-center space-y-3 py-12">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-700 border-t-transparent"></div>
                  <span className="text-sm font-bold text-slate-500">Đang tải bàn ăn...</span>
                </div>
              ) : filteredTables.length === 0 && !isEditMode ? (
                <div className="flex flex-1 flex-col items-center justify-center rounded-xl bg-slate-50 p-8 text-center text-slate-400 border border-dashed border-slate-200">
                  <ForkKnife size={36} className="mb-2" />
                  <p className="text-sm font-bold">Không tìm thấy bàn phù hợp</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 overflow-y-auto max-h-[620px] pr-1">
                  {filteredTables.map((table) => {
                    const isSelected = selectedTable?.id === table.id;
                    return (
                      <div key={table.id} className="relative group">
                        <button
                          onClick={() => !isEditMode && handleSelectTable(table)}
                          type="button"
                          className={`w-full flex flex-col justify-between rounded-xl border p-3 text-left transition-all duration-200 h-[100px] ${getTableStatusColor(
                            table.status
                          )} ${
                            isSelected && !isEditMode
                              ? "ring-2 ring-emerald-700 ring-offset-2 scale-[0.98]"
                              : "admin-lift"
                          }`}
                        >
                          <div className="w-full flex items-start justify-between gap-1.5">
                            <span className="text-sm font-black tracking-tight">{table.name}</span>
                            {getTableStatusBadge(table.status)}
                          </div>
                          
                          <div className="mt-auto w-full flex items-end justify-between">
                            <span className="text-[11px] font-bold text-slate-400/90 truncate max-w-[80px]">
                              {table.area_name}
                            </span>
                            {table.status === "dang_dung" && (
                              <span className="flex items-center gap-0.5 text-[11px] font-black text-amber-700">
                                <Clock size={11} />
                                {table.order_time ? getTableDuration(table.order_time) : "Đang ăn"}
                              </span>
                            )}
                          </div>
                        </button>

                        {/* Edit Mode table overlays */}
                        {isEditMode && (
                          <div className="absolute inset-0 bg-slate-950/80 rounded-xl flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10">
                            <button
                              onClick={() => {
                                setEditingTable(table);
                                setMgmtTableName(table.name);
                                setMgmtTableAreaId(table.area_id?.toString() || "");
                                setTableModalOpen(true);
                              }}
                              type="button"
                              className="bg-emerald-700 text-white rounded px-2.5 py-1 text-[10px] font-black hover:bg-emerald-800 transition"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteTable(table.id)}
                              type="button"
                              className="bg-red-600 text-white rounded px-2.5 py-1 text-[10px] font-black hover:bg-red-700 transition"
                            >
                              Xóa
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add Table Card */}
                  {isEditMode && (
                    <button
                      onClick={() => {
                        setEditingTable(null);
                        setMgmtTableName("");
                        setMgmtTableAreaId(areas[0]?.id?.toString() || "");
                        setTableModalOpen(true);
                      }}
                      type="button"
                      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-emerald-500 bg-emerald-50/15 text-emerald-700 hover:bg-emerald-50/30 p-3 h-[100px] text-center transition admin-lift w-full"
                    >
                      <Plus size={20} weight="bold" />
                      <span className="text-[11px] font-black mt-2">Thêm bàn mới</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 2: Chi tiết hóa đơn (col-span-5) */}
          <div className="col-span-12 xl:col-span-5 flex flex-col space-y-4">
            <div className="admin-panel-pad flex-1 flex flex-col min-h-[500px]">
              {!selectedTable ? (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm mb-4">
                    <BowlFood size={28} weight="duotone" />
                  </div>
                  <h3 className="text-base font-black text-slate-900">Chưa chọn bàn</h3>
                  <p className="mt-2 max-w-xs text-xs font-semibold leading-5 text-slate-400">
                    Vui lòng bấm chọn một bàn trong danh sách bên trái để tạo order mới hoặc thực hiện gọi món, thanh toán.
                  </p>
                </div>
              ) : (
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    {/* Header bàn */}
                    <div className="mb-4 flex items-start justify-between border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black text-slate-900">{selectedTable.name}</h3>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
                            {selectedTable.area_name}
                          </span>
                        </div>
                        {activeOrder && (
                          <p className="text-xs font-bold text-slate-400 mt-1">
                            Hóa đơn: <span className="text-emerald-700">#ORD-{activeOrder.id}</span>
                          </p>
                        )}
                      </div>
                      
                      {selectedTable.status === "dang_dung" && activeOrder && (
                        <div className="text-right">
                          <span className="block text-[11px] font-bold text-slate-400">Giờ vào</span>
                          <span className="text-xs font-black text-slate-700">
                            {new Date(activeOrder.created_at).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Hóa đơn trống hoặc nút Mở bàn */}
                    {selectedTable.status === "trong" ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <p className="text-sm font-semibold text-slate-500 mb-5">
                          Bàn hiện đang trống. Hãy tạo hóa đơn mới để bắt đầu gọi món.
                        </p>
                        <button
                          onClick={handleOpenTable}
                          disabled={orderLoading}
                          type="button"
                          className="admin-primary-btn px-6 py-5 rounded-2xl flex items-center gap-2 w-full max-w-[240px] text-sm justify-center shadow-md shadow-emerald-700/10"
                        >
                          {orderLoading ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          ) : (
                            <>
                              <Plus size={18} weight="bold" /> Mở bàn phục vụ
                            </>
                          )}
                        </button>
                      </div>
                    ) : orderLoading && !activeOrder ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-700 border-t-transparent"></div>
                        <span className="text-xs font-bold text-slate-400 mt-3">Đang tải hóa đơn...</span>
                      </div>
                    ) : activeOrder ? (
                      <div>
                        {/* Danh sách món gọi */}
                        <div className="mb-4 overflow-y-auto max-h-[300px] border border-slate-100 rounded-xl pr-1">
                          {activeOrder.items?.length === 0 ? (
                            <div className="py-12 text-center text-xs font-bold text-slate-400">
                              Chưa có món ăn nào trong order này!
                            </div>
                          ) : (
                            <table className="admin-table">
                              <thead>
                                <tr className="text-[10px] text-slate-400/90 font-black tracking-wider">
                                  <th className="pl-3 py-2 text-left">MÓN</th>
                                  <th className="py-2 text-center">SL</th>
                                  <th className="py-2 text-right">GIÁ</th>
                                  <th className="pr-3 py-2 text-right">TỔNG</th>
                                  <th className="py-2"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {activeOrder.items?.map((item) => {
                                  const isPending = item.status === "cho";
                                  const itemTotal = item.price * item.quantity;
                                  return (
                                    <tr key={item.id} className="text-xs hover:bg-slate-50/50">
                                      {/* Tên món & Ghi chú */}
                                      <td className="pl-3 py-2">
                                        <div className="font-bold text-slate-800">{item.mon_ten}</div>
                                        {isPending ? (
                                          <div className="mt-1 flex items-center gap-1">
                                            <Note size={12} className="text-emerald-700" />
                                            <input
                                              type="text"
                                              placeholder="Ghi chú bếp..."
                                              value={item.note || ""}
                                              onChange={(e) =>
                                                handleUpdateItem(item.id, item.quantity, e.target.value)
                                              }
                                              className="h-5 bg-transparent text-[11px] font-semibold text-emerald-700 outline-none border-b border-transparent hover:border-slate-200 focus:border-emerald-700 w-[120px] transition-colors"
                                            />
                                          </div>
                                        ) : (
                                          item.note && (
                                            <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                                              *{item.note}
                                            </span>
                                          )
                                        )}
                                      </td>
                                      
                                      {/* Số lượng */}
                                      <td className="py-2 text-center">
                                        {isPending ? (
                                          <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-0.5">
                                            <button
                                              onClick={() => handleUpdateItem(item.id, item.quantity - 1, item.note)}
                                              type="button"
                                              className="flex h-5 w-5 items-center justify-center rounded bg-slate-50 text-slate-600 transition hover:bg-slate-100"
                                            >
                                              <Minus size={11} />
                                            </button>
                                            <span className="text-[11px] font-black w-3 text-center">{item.quantity}</span>
                                            <button
                                              onClick={() => handleUpdateItem(item.id, item.quantity + 1, item.note)}
                                              type="button"
                                              className="flex h-5 w-5 items-center justify-center rounded bg-slate-50 text-slate-600 transition hover:bg-slate-100"
                                            >
                                              <Plus size={11} />
                                            </button>
                                          </div>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-[11px] font-black text-slate-600">
                                            SL: {item.quantity}
                                          </span>
                                        )}
                                      </td>

                                      {/* Giá */}
                                      <td className="py-2 text-right font-semibold text-slate-500">
                                        {formatMoney(item.price)}
                                      </td>

                                      {/* Thành tiền */}
                                      <td className="pr-3 py-2 text-right font-black text-slate-800">
                                        {formatMoney(itemTotal)}
                                      </td>

                                      {/* Trạng thái / Xóa */}
                                      <td className="py-2 text-right">
                                        {isPending ? (
                                          <button
                                            onClick={() => handleDeleteItem(item.id)}
                                            type="button"
                                            className="text-red-500 hover:text-red-700 p-1 flex items-center justify-center mx-auto"
                                            title="Xóa khỏi hóa đơn"
                                          >
                                            <Trash size={14} />
                                          </button>
                                        ) : (
                                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-block ${
                                            item.status === "dang_nau" ? "bg-amber-100 text-amber-700 border border-amber-200" :
                                            item.status === "hoan_thanh" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                                            "bg-slate-100 text-slate-500"
                                          }`}>
                                            {item.status === "dang_nau" ? "Chế biến" : "Hoàn thành"}
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>

                        {/* Tổng cộng & KM */}
                        <div className="border-t border-slate-100 pt-3 space-y-2">
                          {/* Khuyến mãi input */}
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <input
                                type="text"
                                placeholder="Nhập mã giảm giá..."
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value)}
                                className="admin-field pl-9 h-9"
                              />
                              <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                            <button
                              onClick={handleApplyPromo}
                              type="button"
                              className="admin-secondary-btn h-9 px-3 rounded-xl border border-slate-200 hover:border-emerald-700 text-xs text-slate-700 hover:text-emerald-700 shrink-0"
                            >
                              Áp dụng
                            </button>
                          </div>

                          {/* Bảng kê tổng tiền */}
                          <div className="rounded-xl bg-slate-50/70 p-3 space-y-1.5 text-xs text-slate-600 font-semibold border border-slate-100">
                            <div className="flex justify-between">
                              <span>Tổng tiền món</span>
                              <span className="font-bold text-slate-800">
                                {formatMoney(activeOrder.total_amount)}
                              </span>
                            </div>
                            {activeOrder.discount_amount > 0 && (
                              <div className="flex justify-between text-emerald-700">
                                <span>Khuyến mãi</span>
                                <span className="font-bold">
                                  -{formatMoney(activeOrder.discount_amount)}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between border-t border-slate-200/60 pt-2 text-sm font-black text-slate-900">
                              <span>Tổng cộng phải thu</span>
                              <span className="text-emerald-700 text-base">
                                {formatMoney(
                                  Math.max(
                                    0,
                                    (activeOrder.total_amount || 0) - (activeOrder.discount_amount || 0)
                                  )
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Nút hành động POS của Bàn đang phục vụ */}
                  {selectedTable.status === "dang_dung" && activeOrder && (
                    <div className="mt-6 border-t border-slate-100 pt-4 space-y-3">
                      
                      {/* Gửi chế biến bếp */}
                      <button
                        onClick={handleSendToKitchen}
                        disabled={!activeOrder.items?.some((i) => i.status === "cho")}
                        type="button"
                        className="w-full admin-primary-btn py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/10 font-bold"
                      >
                        <BowlFood size={18} /> In chế biến (Gửi yêu cầu bếp)
                      </button>

                      {/* Tiện ích POS */}
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setTransferModalOpen(true)}
                          type="button"
                          className="admin-secondary-btn py-3 rounded-xl flex flex-col items-center justify-center gap-1.5 h-auto text-[11px] font-bold"
                        >
                          <ArrowsLeftRight size={16} className="text-slate-500" />
                          Chuyển bàn
                        </button>
                        <button
                          onClick={() => setMergeModalOpen(true)}
                          type="button"
                          className="admin-secondary-btn py-3 rounded-xl flex flex-col items-center justify-center gap-1.5 h-auto text-[11px] font-bold"
                        >
                          <GitMerge size={16} className="text-slate-500" />
                          Gộp bàn
                        </button>
                        <button
                          onClick={handleCancelOrder}
                          type="button"
                          className="admin-secondary-btn py-3 rounded-xl border-red-200 text-red-500 hover:text-red-700 hover:bg-red-50 hover:border-red-300 flex flex-col items-center justify-center gap-1.5 h-auto text-[11px] font-bold"
                        >
                          <X size={16} />
                          Hủy order
                        </button>
                      </div>

                      {/* Thanh toán & Hóa đơn */}
                      <button
                        onClick={() => {
                          setCheckoutCustomerId("");
                          setCheckoutModalOpen(true);
                        }}
                        type="button"
                        className="w-full rounded-xl bg-amber-500 text-white font-bold text-sm h-12 flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/10"
                      >
                        <Receipt size={18} /> Thanh toán & In hóa đơn
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 3: Thực đơn / Danh mục (col-span-3) */}
          <div className="col-span-12 xl:col-span-3 flex flex-col space-y-4">
            <div className="admin-panel-pad flex-1 flex flex-col min-h-[500px]">
              
              <div className="mb-3.5 space-y-3">
                <h2 className="admin-section-title flex items-center gap-2">
                  <BowlFood size={20} className="text-emerald-700" /> Thực đơn món
                </h2>
                
                {/* Search Menu */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm món ăn nhanh..."
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    className="admin-field pl-10 h-10"
                  />
                  <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-1 border-b border-slate-100 pb-2">
                  <button
                    onClick={() => setSelectedCategory("Tất cả")}
                    type="button"
                    className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                      selectedCategory === "Tất cả"
                        ? "bg-emerald-700 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Tất cả
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id.toString())}
                      type="button"
                      className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                        selectedCategory === cat.id.toString()
                          ? "bg-emerald-700 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu items scrollable grid */}
              <div className="overflow-y-auto max-h-[520px] pr-1 flex-1">
                {filteredMenuItems.length === 0 ? (
                  <div className="py-12 text-center text-xs font-bold text-slate-400">
                    Không tìm thấy món ăn nào!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {filteredMenuItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleAddItem(item)}
                        type="button"
                        className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-2.5 text-left transition-all duration-200 admin-lift hover:border-emerald-600/40 w-full"
                        disabled={selectedTable?.status === "trong" || !selectedTable}
                        title={
                          selectedTable?.status === "trong" || !selectedTable
                            ? "Vui lòng mở bàn phục vụ trước khi chọn món"
                            : `Thêm ${item.name} vào order`
                        }
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="h-10 w-10 rounded-lg object-cover bg-slate-100 border border-slate-200"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23eff1ea'/%3E%3C/svg%3E";
                              }}
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100 font-black text-sm">
                              {item.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-black text-slate-900 leading-tight">
                              {item.name}
                            </span>
                            <span className="block text-[11px] font-bold text-slate-400 mt-0.5 leading-none">
                              {categories.find((c) => c.id === item.category_id)?.name || "Món ăn"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 ml-2">
                          <span className="text-xs font-black text-emerald-700">
                            {formatMoney(item.price)}
                          </span>
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 transition shadow-sm font-bold text-xs">
                            +
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ========================================================
          MODAL: CHUYỂN BÀN
      ======================================================== */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-950 flex items-center gap-1.5">
                <ArrowsLeftRight size={18} className="text-emerald-700" /> Chuyển {selectedTable?.name}
              </h3>
              <button
                onClick={() => setTransferModalOpen(false)}
                type="button"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-xs font-semibold text-slate-500 mb-4">
              Vui lòng chọn một bàn trống đích dưới đây để chuyển hóa đơn và khách hàng sang bàn đó.
            </p>

            <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[240px] pr-1 mb-6">
              {tables
                .filter((t) => t.status === "trong" && t.id !== selectedTable?.id)
                .map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleTransferTable(t.id)}
                    type="button"
                    className="rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-emerald-50 hover:border-emerald-300 p-2.5 text-center text-xs font-bold transition duration-150 text-slate-800 hover:text-emerald-800"
                  >
                    {t.name}
                    <span className="block text-[10px] text-slate-400 font-semibold mt-1">
                      {t.area_name}
                    </span>
                  </button>
                ))}
              {tables.filter((t) => t.status === "trong" && t.id !== selectedTable?.id).length === 0 && (
                <div className="col-span-3 text-center py-6 text-xs font-semibold text-slate-400">
                  Không có bàn trống nào khả dụng vào lúc này!
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setTransferModalOpen(false)}
                type="button"
                className="admin-secondary-btn rounded-xl"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: GỘP BÀN
      ======================================================== */}
      {mergeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-950 flex items-center gap-1.5">
                <GitMerge size={18} className="text-emerald-700" /> Gộp bàn {selectedTable?.name}
              </h3>
              <button
                onClick={() => setMergeModalOpen(false)}
                type="button"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-xs font-semibold text-slate-500 mb-4">
              Vui lòng chọn bàn đang sử dụng muốn gộp chung hóa đơn. Tất cả món ăn sẽ gộp dồn về bàn đó và bàn hiện tại sẽ giải phóng về trống.
            </p>

            <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[240px] pr-1 mb-6">
              {tables
                .filter((t) => t.status === "dang_dung" && t.id !== selectedTable?.id)
                .map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleMergeTable(t.id)}
                    type="button"
                    className="rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-amber-50 hover:border-amber-300 p-2.5 text-center text-xs font-bold transition duration-150 text-slate-800 hover:text-amber-800"
                  >
                    {t.name}
                    <span className="block text-[10px] text-slate-400 font-semibold mt-1">
                      {t.area_name}
                    </span>
                  </button>
                ))}
              {tables.filter((t) => t.status === "dang_dung" && t.id !== selectedTable?.id).length === 0 && (
                <div className="col-span-3 text-center py-6 text-xs font-semibold text-slate-400">
                  Không có bàn đang hoạt động khác để thực hiện gộp!
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setMergeModalOpen(false)}
                type="button"
                className="admin-secondary-btn rounded-xl"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: THANH TOÁN (CHECKOUT)
      ======================================================== */}
      {checkoutModalOpen && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-950 flex items-center gap-1.5">
                <Receipt size={20} className="text-emerald-700" /> Xác nhận thanh toán & Chốt bàn
              </h3>
              <button
                onClick={() => setCheckoutModalOpen(false)}
                type="button"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Receipt Summary */}
            <div className="mb-5 space-y-3">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl text-xs font-semibold text-slate-600">
                <div>
                  <span className="block text-[11px] text-slate-400 font-bold">BÀN PHỤC VỤ</span>
                  <span className="text-sm font-black text-slate-800">{selectedTable?.name}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[11px] text-slate-400 font-bold">MÃ HÓA ĐƠN</span>
                  <span className="text-sm font-black text-emerald-700">#ORD-{activeOrder.id}</span>
                </div>
              </div>

              {/* Items check list */}
              <div className="border border-slate-100 rounded-xl p-3 text-xs max-h-[140px] overflow-y-auto space-y-2">
                {activeOrder.items?.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span className="font-bold text-slate-700">
                      {item.mon_ten} <span className="text-slate-400 font-semibold">x{item.quantity}</span>
                    </span>
                    <span className="font-black text-slate-800">{formatMoney(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer loyalty block */}
            <div className="mb-5 border border-slate-200/80 rounded-xl p-4 bg-emerald-50/10">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <User size={16} className="text-emerald-700" /> Thành viên tích điểm
                </h4>
                <button
                  onClick={() => setCustomerModalOpen(true)}
                  type="button"
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <UserPlus size={14} /> Thêm mới hội viên
                </button>
              </div>

              <div className="relative">
                <select
                  value={checkoutCustomerId}
                  onChange={(e) => setCheckoutCustomerId(e.target.value)}
                  className="admin-field pr-10"
                >
                  <option value="">-- Chọn hội viên (không bắt buộc) --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} - {c.phone} ({c.membership || "Hội viên"}) - {c.points} điểm
                    </option>
                  ))}
                </select>
              </div>
              
              {checkoutCustomerId && (
                <div className="mt-3 bg-emerald-50 border border-emerald-100 text-emerald-800 p-2.5 rounded-lg text-[11px] font-bold">
                  ★ Hóa đơn này dự kiến tích lũy +
                  {Math.floor(
                    Math.max(
                      0,
                      (activeOrder.total_amount || 0) - (activeOrder.discount_amount || 0)
                    ) / 10000
                  )}{" "}
                  điểm cho hội viên được chọn.
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="mb-6">
              <h4 className="text-xs font-black text-slate-900 mb-3 flex items-center gap-1.5">
                <CurrencyCircleDollar size={16} className="text-emerald-700" /> Phương thức thanh toán
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "tien_mat", label: "Tiền mặt" },
                  { value: "chuyen_khoan", label: "Chuyển khoản" },
                  { value: "qr", label: "Quét mã QR" },
                ].map((method) => (
                  <button
                    key={method.value}
                    onClick={() => setCheckoutPaymentMethod(method.value)}
                    type="button"
                    className={`py-3 px-2 rounded-xl border text-xs font-black transition-all duration-150 flex flex-col items-center justify-center gap-1 ${
                      checkoutPaymentMethod === method.value
                        ? "border-emerald-700 bg-emerald-50/40 text-emerald-800 font-black shadow-sm"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cost totals */}
            <div className="border-t border-slate-100 pt-4 space-y-2 mb-6">
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>Tổng tiền hàng</span>
                <span>{formatMoney(activeOrder.total_amount)}</span>
              </div>
              {activeOrder.discount_amount > 0 && (
                <div className="flex justify-between text-xs font-bold text-emerald-700">
                  <span>Mã giảm giá đã áp</span>
                  <span>-{formatMoney(activeOrder.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-slate-950 pt-2 border-t border-slate-100">
                <span>TỔNG THANH TOÁN</span>
                <span className="text-lg text-emerald-700 font-black leading-none">
                  {formatMoney(
                    Math.max(
                      0,
                      (activeOrder.total_amount || 0) - (activeOrder.discount_amount || 0)
                    )
                  )}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setCheckoutModalOpen(false)}
                type="button"
                className="flex-1 admin-secondary-btn py-3.5 rounded-xl text-sm"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleCheckout}
                type="button"
                className="flex-1 rounded-xl bg-emerald-700 text-white font-black text-sm hover:bg-emerald-800 transition shadow-lg shadow-emerald-700/10 flex items-center justify-center gap-1.5"
              >
                <Check size={18} weight="bold" /> Xác nhận thanh toán
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: THÊM MỚI HỘI VIÊN (CUSTOMER CREATION)
      ======================================================== */}
      {customerModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-950 flex items-center gap-1.5">
                <UserPlus size={18} className="text-emerald-700" /> Thêm nhanh hội viên mới
              </h3>
              <button
                onClick={() => setCustomerModalOpen(false)}
                type="button"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="admin-label mb-1.5 flex items-center gap-1">
                  <User size={13} /> Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nhập tên khách hàng"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="admin-field h-10"
                  required
                />
              </div>

              <div>
                <label className="admin-label mb-1.5 flex items-center gap-1">
                  <Phone size={13} /> Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="Nhập số điện thoại"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="admin-field h-10"
                  required
                />
              </div>

              <div>
                <label className="admin-label mb-1.5 flex items-center gap-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Địa chỉ email (nếu có)"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  className="admin-field h-10"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setCustomerModalOpen(false)}
                  type="button"
                  className="flex-1 admin-secondary-btn h-10 rounded-xl text-xs"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-emerald-700 text-white font-black text-xs hover:bg-emerald-800 transition"
                >
                  Đăng ký hội viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================
          MODAL: THÊM KHU VỰC MỚI
      ======================================================== */}
      {areaModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-950 flex items-center gap-1.5">
                <Plus size={18} className="text-emerald-700" /> Thêm khu vực mới
              </h3>
              <button
                onClick={() => setAreaModalOpen(false)}
                type="button"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddArea} className="space-y-4">
              <div>
                <label className="admin-label mb-1.5 flex items-center gap-1">
                  Tên khu vực mới <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nhập tên khu vực (VD: Khu VIP, Ngoài Trời...)"
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  className="admin-field h-10"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setAreaModalOpen(false)}
                  type="button"
                  className="flex-1 admin-secondary-btn h-10 rounded-xl text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-emerald-700 text-white font-black text-xs hover:bg-emerald-800 transition"
                >
                  Thêm khu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: THÊM / SỬA BÀN ĂN
      ======================================================== */}
      {tableModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-950 flex items-center gap-1.5">
                {editingTable ? "✎ Chỉnh sửa bàn ăn" : "+ Thêm bàn ăn mới"}
              </h3>
              <button
                onClick={() => {
                  setTableModalOpen(false);
                  setEditingTable(null);
                }}
                type="button"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="space-y-4">
              <div>
                <label className="admin-label mb-1.5">
                  Tên bàn ăn <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nhập tên bàn (VD: Bàn 01, VIP 05...)"
                  value={mgmtTableName}
                  onChange={(e) => setMgmtTableName(e.target.value)}
                  className="admin-field h-10"
                  required
                />
              </div>

              <div>
                <label className="admin-label mb-1.5">
                  Khu vực <span className="text-red-500">*</span>
                </label>
                <select
                  value={mgmtTableAreaId}
                  onChange={(e) => setMgmtTableAreaId(e.target.value)}
                  className="admin-field h-10"
                  required
                >
                  <option value="">-- Chọn khu vực --</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setTableModalOpen(false);
                    setEditingTable(null);
                  }}
                  type="button"
                  className="flex-1 admin-secondary-btn h-10 rounded-xl text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-emerald-700 text-white font-black text-xs hover:bg-emerald-800 transition"
                >
                  {editingTable ? "Cập nhật" : "Lưu bàn mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
