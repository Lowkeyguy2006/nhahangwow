export const ROLES = {
  ADMIN: 1,
  STAFF: 2,
  KITCHEN: 3,
};

export const ROLE_HOME = {
  [ROLES.ADMIN]: "/admin/dashboard",
  [ROLES.STAFF]: "/staff/order",
  [ROLES.KITCHEN]: "/kitchen/warehouse",
};

export const FEATURE_PERMISSIONS = {
  adminWarehouse: {
    canViewInventory: true,
    canViewLogs: true,
    canMoveStock: true,
    canCreateIngredient: true,
  },
  kitchenWarehouse: {
    canViewInventory: true,
    canViewLogs: true,
    canMoveStock: true,
    canCreateIngredient: false,
  },
};

export const getRoleId = (user) => Number(user?.role_id) || null;

export const getDefaultPath = (user) => ROLE_HOME[getRoleId(user)] || "/admin/dashboard";

export const canAccess = (user, roles) => {
  if (!roles) return true;
  return roles.includes(getRoleId(user));
};
