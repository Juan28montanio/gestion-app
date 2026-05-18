export function normalizeAuthUser(user) {
  if (!user) return null;

  return {
    id: user.id || user.uid || "",
    uid: user.id || user.uid || "",
    email: user.email || "",
    displayName: user.displayName || user.display_name || user.user_metadata?.display_name || "",
    metadata: user.metadata || user.user_metadata || {},
    provider: "supabase",
  };
}

export function normalizeBusinessUser(row) {
  if (!row) return null;

  return {
    id: row.id || "",
    business_id: row.business_id || "",
    businessId: row.business_id || "",
    user_id: row.user_id || "",
    userId: row.user_id || "",
    display_name: row.display_name || row.profiles?.display_name || "",
    displayName: row.display_name || row.profiles?.display_name || "",
    email: row.email || row.profiles?.email || "",
    role: row.role || "staff",
    status: row.status || "active",
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

export function normalizeBusiness(row) {
  if (!row) return null;

  return {
    ...row,
    id: row.id || "",
    name: row.name || "SmartProfit",
    logo_url: row.logo_url || "",
    logoUrl: row.logo_url || "",
    owner_user_id: row.owner_user_id || "",
    ownerUserId: row.owner_user_id || "",
    status: row.status || "active",
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

export function buildAuthSession({ user, businessUser, business }) {
  const normalizedUser = normalizeAuthUser(user);
  const normalizedBusinessUser = normalizeBusinessUser(businessUser);
  const normalizedBusiness = normalizeBusiness(business || businessUser?.businesses);

  return {
    currentUser: normalizedUser,
    userProfile: normalizedBusinessUser,
    business: normalizedBusiness,
    businessId: normalizedBusinessUser?.business_id || normalizedBusiness?.id || "",
    role: normalizedBusinessUser?.role || "",
    isBusinessActive: normalizedBusinessUser?.status === "active" && normalizedBusiness?.status === "active",
  };
}
