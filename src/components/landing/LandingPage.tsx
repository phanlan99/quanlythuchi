import { FAQS, FEATURES, STEPS } from "./content";
import { HeroActions } from "./HeroActions";
import { LandingFooter } from "./LandingFooter";
import { LandingNavbar } from "./LandingNavbar";

/** Public introduction page shown at "/". */
export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-white dark:bg-zinc-950">
      <LandingNavbar />

      <main className="flex-1">
        {/* ---------- Hero ---------- */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-2 md:px-6 md:py-24">
          <div className="space-y-6">
            <p className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Tài chính cá nhân, đơn giản
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Biết tiền của bạn đi đâu mỗi ngày
            </h1>
            <p className="max-w-md text-zinc-600 dark:text-zinc-400">
              Ghi thu chi trong vài giây, đặt ngân sách theo tháng và xem biểu đồ để chi tiêu có kế hoạch hơn.
            </p>
            <HeroActions />
          </div>
          <ProductPreview />
        </section>

        {/* ---------- Features ---------- */}
        <section id="features" className="scroll-mt-16 border-t border-zinc-100 bg-zinc-50 py-16 md:py-20 dark:border-zinc-900 dark:bg-black">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <SectionTitle title="Mọi thứ bạn cần, không thừa" subtitle="Tập trung vào những việc làm hằng ngày." />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <li
                  key={f.title}
                  className="rounded-xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span className="text-2xl" aria-hidden>
                    {f.icon}
                  </span>
                  <h3 className="mt-3 text-sm font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{f.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- How it works ---------- */}
        <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-16 md:px-6 md:py-20">
          <SectionTitle title="Bắt đầu trong 3 bước" />
          <ol className="grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-sm font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- FAQ ---------- */}
        <section id="faq" className="scroll-mt-16 border-t border-zinc-100 bg-zinc-50 py-16 md:py-20 dark:border-zinc-900 dark:bg-black">
          <div className="mx-auto max-w-3xl px-4 md:px-6">
            <SectionTitle title="Câu hỏi thường gặp" />
            <div className="space-y-3">
              {FAQS.map((f) => (
                <details
                  key={f.q}
                  className="group rounded-xl border border-zinc-200/80 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium">
                    {f.q}
                    <span className="text-zinc-400 transition-transform group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-zinc-500">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Closing CTA ---------- */}
        <section className="mx-auto max-w-6xl px-4 py-16 text-center md:px-6 md:py-20">
          <h2 className="text-2xl font-semibold tracking-tight">Sẵn sàng quản lý chi tiêu?</h2>
          <p className="mx-auto mt-2 mb-6 max-w-md text-sm text-zinc-500">
            Mỗi tài khoản có dữ liệu riêng — bắt đầu từ giao dịch đầu tiên hôm nay.
          </p>
          <HeroActions align="center" />
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-10 text-center">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-2 text-sm text-zinc-500">{subtitle}</p>}
    </div>
  );
}

/* Decorative mock of the dashboard (fixed sample numbers, hidden from screen readers). */
const SAMPLE_DAYS = [
  [0, 35], [0, 20], [0, 55], [90, 25], [0, 40], [0, 15], [0, 60],
  [0, 30], [0, 45], [0, 20], [35, 50], [0, 25], [0, 35], [0, 70],
];

function ProductPreview() {
  const stats = [
    { label: "Thu", value: "18,5tr", color: "var(--series-income)" },
    { label: "Chi", value: "9,2tr", color: "var(--series-expense)" },
    { label: "Số dư", value: "9,3tr" },
  ];
  return (
    <div
      aria-hidden
      className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-zinc-200/80 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="flex items-center gap-1.5 text-[11px] text-zinc-500">
              {s.color && <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />}
              {s.label}
            </p>
            <p className="text-sm font-semibold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-zinc-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="mb-3 text-xs font-medium text-zinc-500">Thu chi theo ngày</p>
        <div className="flex h-36 items-end gap-1.5 border-b border-zinc-200 dark:border-zinc-800">
          {SAMPLE_DAYS.map(([income, expense], i) => (
            <div key={i} className="flex h-full flex-1 items-end justify-center gap-px">
              {income > 0 && (
                <span className="w-full max-w-2 rounded-t-sm" style={{ height: `${income}%`, background: "var(--series-income)" }} />
              )}
              <span className="w-full max-w-2 rounded-t-sm" style={{ height: `${expense}%`, background: "var(--series-expense)" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
