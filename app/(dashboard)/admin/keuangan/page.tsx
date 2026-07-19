import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { PLATFORM_COMMISSION_RATE, EXPERT_PAYOUT_RATE, expertPayout } from "@/lib/finance";
import { Wallet, TrendingDown, TrendingUp, Crown, MessageCircle } from "lucide-react";
import { MarkPaidButton } from "@/components/admin/mark-paid-button";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Keuangan" };

export default async function AdminFinancePage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const [premiumAgg, consultPayments, payoutSums] = await Promise.all([
    prisma.payment.aggregate({
      where: { type: "PREMIUM_SUBSCRIPTION", status: "PAID" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.payment.findMany({
      where: { type: "CONSULTATION", status: "PAID" },
      select: {
        amount: true,
        consultation: {
          select: {
            expertId: true,
            expert: { select: { user: { select: { name: true } } } },
          },
        },
      },
    }),
    prisma.payout.groupBy({ by: ["expertId"], _sum: { amount: true } }),
  ]);

  const grossPremium = premiumAgg._sum.amount ?? 0;
  const grossConsult = consultPayments.reduce((s, p) => s + p.amount, 0);
  const grossTotal = grossPremium + grossConsult;

  const paidByExpert = new Map(payoutSums.map((p) => [p.expertId, p._sum.amount ?? 0]));

  // Per-expert: owed (87%), already paid, outstanding.
  const perExpert = new Map<string, { name: string; sessions: number; gross: number }>();
  for (const p of consultPayments) {
    if (!p.consultation) continue;
    const id = p.consultation.expertId;
    const row = perExpert.get(id) ?? {
      name: p.consultation.expert.user.name ?? "Pakar",
      sessions: 0,
      gross: 0,
    };
    row.sessions += 1;
    row.gross += p.amount;
    perExpert.set(id, row);
  }
  const rows = Array.from(perExpert.entries())
    .map(([id, r]) => {
      const owed = expertPayout(r.gross);
      const paid = paidByExpert.get(id) ?? 0;
      return { id, ...r, owed, paid, outstanding: Math.max(0, owed - paid) };
    })
    .sort((a, b) => b.outstanding - a.outstanding || b.owed - a.owed);

  const payoutTotal = rows.reduce((s, r) => s + r.owed, 0);
  const paidTotal = rows.reduce((s, r) => s + r.paid, 0);
  const outstandingTotal = rows.reduce((s, r) => s + r.outstanding, 0);
  const netProfit = grossTotal - payoutTotal;

  const cards = [
    {
      label: "Laba Kotor",
      value: grossTotal,
      icon: Wallet,
      color: "text-forest-500",
      bg: "bg-forest-50",
      sub: "Premium + Konsultasi",
    },
    {
      label: "Total Potongan (Bayar Pakar)",
      value: payoutTotal,
      icon: TrendingDown,
      color: "text-red-500",
      bg: "bg-red-50",
      sub: `${Math.round(EXPERT_PAYOUT_RATE * 100)}% dari uang konsultasi`,
    },
    {
      label: "Laba Bersih",
      value: netProfit,
      icon: TrendingUp,
      color: "text-teal-dark",
      bg: "bg-teal-dark/5",
      sub: `Komisi ${Math.round(PLATFORM_COMMISSION_RATE * 100)}% + premium`,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-forest-500">
          Keuangan
        </h1>
        <p className="text-sand-500 text-sm mt-1">
          Ringkasan pendapatan platform (komisi {Math.round(PLATFORM_COMMISSION_RATE * 100)}% per konsultasi).
        </p>
      </div>

      {/* Headline cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border border-sand-200 p-4">
            <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
              <c.icon className={`w-5 h-5 ${c.color}`} />
            </div>
            <div className={`text-2xl font-bold ${c.color}`}>{formatCurrency(c.value)}</div>
            <div className="text-sm text-forest-500 mt-0.5">{c.label}</div>
            <div className="text-xs text-sand-400 mt-0.5">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Gross breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-sand-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Crown className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="text-lg font-bold text-forest-500">{formatCurrency(grossPremium)}</div>
            <div className="text-xs text-sand-500">Langganan Premium ({premiumAgg._count})</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-sand-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5 text-forest-500" />
          </div>
          <div>
            <div className="text-lg font-bold text-forest-500">{formatCurrency(grossConsult)}</div>
            <div className="text-xs text-sand-500">Konsultasi ({consultPayments.length})</div>
          </div>
        </div>
      </div>

      {/* Payout table */}
      <div className="bg-white rounded-2xl border border-sand-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-sand-100 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-forest-500">Potongan per Pakar</h2>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-forest-500">
              Dibayar: <strong>{formatCurrency(paidTotal)}</strong>
            </span>
            <span className="text-red-500">
              Sisa: <strong>{formatCurrency(outstandingTotal)}</strong>
            </span>
          </div>
        </div>
        {rows.length === 0 ? (
          <p className="px-5 py-6 text-sm text-sand-400">Belum ada konsultasi berbayar.</p>
        ) : (
          <div className="divide-y divide-sand-100">
            {rows.map((r) => (
              <div key={r.id} className="px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-forest-500 truncate">{r.name}</div>
                  <div className="text-xs text-sand-400">
                    {r.sessions} sesi · bruto {formatCurrency(r.gross)}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-forest-500">{formatCurrency(r.owed)}</div>
                    <div className="text-[11px] text-sand-400">
                      hak pakar (87%)
                      {r.paid > 0 && r.outstanding > 0 && ` · sisa ${formatCurrency(r.outstanding)}`}
                    </div>
                  </div>
                  <MarkPaidButton expertId={r.id} outstanding={r.outstanding} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-sand-400">
        "Tandai Dibayar" mencatat bahwa Anda sudah mentransfer sisa saldo ke pakar (di luar
        sistem). Transfer otomatis ke rekening pakar perlu integrasi payout gateway.
      </p>
    </div>
  );
}
