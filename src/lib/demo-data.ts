import type { Budget, Category, Transaction } from "./types";

/**
 * Demo data only — kept in memory, never persisted.
 * Dates are fixed strings so server and client render the same output.
 */

export const DEMO_CATEGORIES: Category[] = [
  // Expense categories
  { id: "food", name: "Ăn uống", icon: "🍜", color: "#f97316", type: "expense" },
  { id: "transport", name: "Đi lại", icon: "🛵", color: "#0ea5e9", type: "expense" },
  { id: "housing", name: "Nhà ở", icon: "🏠", color: "#8b5cf6", type: "expense" },
  { id: "bills", name: "Hóa đơn", icon: "⚡", color: "#eab308", type: "expense" },
  { id: "shopping", name: "Mua sắm", icon: "🛍️", color: "#ec4899", type: "expense" },
  { id: "entertainment", name: "Giải trí", icon: "🎬", color: "#14b8a6", type: "expense" },
  { id: "health", name: "Sức khỏe", icon: "💊", color: "#ef4444", type: "expense" },
  { id: "education", name: "Học tập", icon: "📚", color: "#6366f1", type: "expense" },
  // Income categories
  { id: "salary", name: "Lương", icon: "💰", color: "#10b981", type: "income" },
  { id: "bonus", name: "Thưởng", icon: "🎁", color: "#22c55e", type: "income" },
  { id: "other-income", name: "Thu nhập khác", icon: "💵", color: "#84cc16", type: "income" },
];

const BASE_LIMITS: Omit<Budget, "month">[] = [
  { categoryId: "food", limit: 4_000_000 },
  { categoryId: "transport", limit: 1_000_000 },
  { categoryId: "housing", limit: 5_000_000 },
  { categoryId: "bills", limit: 1_500_000 },
  { categoryId: "shopping", limit: 1_500_000 },
  { categoryId: "entertainment", limit: 800_000 },
  { categoryId: "health", limit: 500_000 },
  { categoryId: "education", limit: 1_000_000 },
];

export const DEMO_BUDGET_MONTHS = ["2026-10", "2026-11"];

export const DEMO_BUDGETS: Budget[] = DEMO_BUDGET_MONTHS.flatMap((month) =>
  BASE_LIMITS.map((b) => ({ ...b, month })),
);

export const DEMO_TRANSACTIONS: Transaction[] = [
  // ---- November 2026 ----
  { id: "t01", type: "income", amount: 15_000_000, categoryId: "salary", note: "Lương tháng 11", date: "2026-11-05" },
  { id: "t02", type: "expense", amount: 5_000_000, categoryId: "housing", note: "Tiền thuê nhà", date: "2026-11-01" },
  { id: "t03", type: "expense", amount: 45_000, categoryId: "food", note: "Phở bò buổi sáng", date: "2026-11-02" },
  { id: "t04", type: "expense", amount: 120_000, categoryId: "transport", note: "Đổ xăng", date: "2026-11-03" },
  { id: "t05", type: "expense", amount: 650_000, categoryId: "food", note: "Đi chợ cuối tuần", date: "2026-11-08" },
  { id: "t06", type: "expense", amount: 420_000, categoryId: "bills", note: "Tiền điện", date: "2026-11-10" },
  { id: "t07", type: "expense", amount: 110_000, categoryId: "bills", note: "Tiền nước", date: "2026-11-10" },
  { id: "t08", type: "expense", amount: 250_000, categoryId: "bills", note: "Internet + 4G", date: "2026-11-11" },
  { id: "t09", type: "expense", amount: 890_000, categoryId: "shopping", note: "Áo khoác mùa đông", date: "2026-11-12" },
  { id: "t10", type: "expense", amount: 180_000, categoryId: "entertainment", note: "Vé xem phim", date: "2026-11-14" },
  { id: "t11", type: "expense", amount: 320_000, categoryId: "food", note: "Ăn tối cùng bạn bè", date: "2026-11-15" },
  { id: "t12", type: "expense", amount: 65_000, categoryId: "transport", note: "Grab đi làm", date: "2026-11-17" },
  { id: "t13", type: "income", amount: 2_000_000, categoryId: "other-income", note: "Làm freelance", date: "2026-11-18" },
  { id: "t14", type: "expense", amount: 350_000, categoryId: "health", note: "Khám răng", date: "2026-11-19" },
  { id: "t15", type: "expense", amount: 499_000, categoryId: "education", note: "Khóa học online", date: "2026-11-20" },
  { id: "t16", type: "expense", amount: 720_000, categoryId: "food", note: "Đi chợ cuối tuần", date: "2026-11-22" },
  { id: "t17", type: "expense", amount: 59_000, categoryId: "entertainment", note: "Gói nhạc tháng", date: "2026-11-23" },
  { id: "t18", type: "expense", amount: 35_000, categoryId: "food", note: "Cà phê", date: "2026-11-24" },

  // ---- October 2026 ----
  { id: "t19", type: "income", amount: 15_000_000, categoryId: "salary", note: "Lương tháng 10", date: "2026-10-05" },
  { id: "t20", type: "income", amount: 1_500_000, categoryId: "bonus", note: "Thưởng dự án", date: "2026-10-25" },
  { id: "t21", type: "expense", amount: 5_000_000, categoryId: "housing", note: "Tiền thuê nhà", date: "2026-10-01" },
  { id: "t22", type: "expense", amount: 1_850_000, categoryId: "food", note: "Ăn uống cả tháng", date: "2026-10-15" },
  { id: "t23", type: "expense", amount: 1_200_000, categoryId: "food", note: "Tiệc sinh nhật", date: "2026-10-20" },
  { id: "t24", type: "expense", amount: 380_000, categoryId: "transport", note: "Xăng + gửi xe", date: "2026-10-10" },
  { id: "t25", type: "expense", amount: 760_000, categoryId: "bills", note: "Điện, nước, internet", date: "2026-10-10" },
  { id: "t26", type: "expense", amount: 2_100_000, categoryId: "shopping", note: "Giày chạy bộ", date: "2026-10-18" },
  { id: "t27", type: "expense", amount: 450_000, categoryId: "entertainment", note: "Du lịch cuối tuần", date: "2026-10-26" },
  { id: "t28", type: "expense", amount: 150_000, categoryId: "health", note: "Thuốc cảm", date: "2026-10-08" },
];
