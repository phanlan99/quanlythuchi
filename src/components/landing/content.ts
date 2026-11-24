/** All landing-page copy in one place, so it is easy to edit (and to search). */

export const SECTION_LINKS = [
  { href: "/#features", label: "Tính năng" },
  { href: "/#how-it-works", label: "Cách dùng" },
  { href: "/#faq", label: "Câu hỏi" },
];

export const FEATURES = [
  {
    icon: "⚡",
    title: "Ghi thu chi nhanh",
    text: "Nhập số tiền, chọn danh mục là xong. Ngày mặc định là hôm nay.",
  },
  {
    icon: "📊",
    title: "Biểu đồ theo ngày",
    text: "Xem thu và chi từng ngày trong tháng để thấy ngay ngày nào tiêu nhiều.",
  },
  {
    icon: "🎯",
    title: "Ngân sách theo tháng",
    text: "Đặt hạn mức cho từng danh mục, được cảnh báo khi sắp vượt.",
  },
  {
    icon: "🏷️",
    title: "Danh mục của riêng bạn",
    text: "Dùng danh mục có sẵn hoặc tạo mới với biểu tượng tuỳ chọn.",
  },
  {
    icon: "🔒",
    title: "Dữ liệu riêng tư",
    text: "Mỗi tài khoản chỉ thấy dữ liệu của mình. Mật khẩu được mã hoá một chiều.",
  },
  {
    icon: "📱",
    title: "Dùng trên mọi thiết bị",
    text: "Giao diện gọn trên điện thoại, máy tính bảng và máy tính.",
  },
];

export const STEPS = [
  { title: "Tạo tài khoản", text: "Chỉ cần họ tên, số điện thoại và mật khẩu." },
  { title: "Ghi giao dịch", text: "Thêm khoản thu, khoản chi mỗi ngày trong vài giây." },
  { title: "Theo dõi ngân sách", text: "Đặt hạn mức tháng và xem còn lại bao nhiêu." },
];

export const FAQS = [
  {
    q: "Người khác có xem được dữ liệu của tôi không?",
    a: "Người dùng khác không xem được giao dịch, danh mục và ngân sách của bạn. Quản trị viên hệ thống có quyền xem dữ liệu để vận hành và hỗ trợ. Mật khẩu được mã hoá một chiều nên không ai xem được, kể cả quản trị viên.",
  },
  {
    q: "Tôi quên mật khẩu thì làm sao?",
    a: "Vào “Quên mật khẩu”, nhập tên đăng nhập và số điện thoại. Quản trị viên sẽ liên hệ để cấp mật khẩu tạm, bạn đổi mật khẩu mới khi đăng nhập.",
  },
  {
    q: "Có dùng được trên điện thoại không?",
    a: "Có. Mở trang web bằng trình duyệt trên điện thoại, mọi tính năng đều dùng được.",
  },
  {
    q: "Tôi có thể tạo danh mục riêng không?",
    a: "Có. Trong mục Ngân sách, chọn “Thêm danh mục” → “Tạo mới” để đặt tên và biểu tượng.",
  },
];

/* --------------------------------- Search ---------------------------------- */

export interface SearchItem {
  title: string;
  description: string;
  href: string;
  group: "Trang" | "Tính năng" | "Câu hỏi";
  /** Opens this form in the auth dialog instead of navigating. */
  auth?: "login" | "register" | "forgot";
}

export const SEARCH_ITEMS: SearchItem[] = [
  { group: "Trang", title: "Tổng quan", description: "Thu, chi, số dư và biểu đồ theo ngày", href: "/dashboard" },
  { group: "Trang", title: "Giao dịch", description: "Thêm, sửa, lọc các khoản thu chi", href: "/transactions" },
  { group: "Trang", title: "Ngân sách", description: "Hạn mức chi tiêu theo tháng", href: "/budgets" },
  { group: "Trang", title: "Tài khoản", description: "Thông tin cá nhân và đổi mật khẩu", href: "/account" },
  { group: "Trang", title: "Đăng nhập", description: "Vào tài khoản của bạn", href: "/#login", auth: "login" },
  { group: "Trang", title: "Đăng ký", description: "Tạo tài khoản mới", href: "/#register", auth: "register" },
  {
    group: "Trang",
    title: "Quên mật khẩu",
    description: "Yêu cầu cấp mật khẩu tạm",
    href: "/#forgot-password",
    auth: "forgot",
  },
  ...FEATURES.map((f) => ({
    group: "Tính năng" as const,
    title: f.title,
    description: f.text,
    href: "/#features",
  })),
  ...FAQS.map((f) => ({ group: "Câu hỏi" as const, title: f.q, description: f.a, href: "/#faq" })),
];

/** Lowercase and strip Vietnamese accents, so "ngan sach" matches "Ngân sách". */
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase();
}

export function searchSite(query: string): SearchItem[] {
  const words = normalizeText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return SEARCH_ITEMS.filter((i) => i.group === "Trang");
  return SEARCH_ITEMS.filter((item) => {
    const haystack = normalizeText(`${item.title} ${item.description}`);
    return words.every((w) => haystack.includes(w));
  }).slice(0, 8);
}
