import { Users, BookOpen, Building2, Star } from "lucide-react";

interface QuickStatsProps {
  expertCount: number;
  contentCount: number;
  communityCount: number;
}

export function QuickStats({ expertCount, contentCount, communityCount }: QuickStatsProps) {
  const stats = [
    {
      icon: Users,
      value: `${expertCount}+`,
      label: "Pakar Terverifikasi",
      color: "text-forest-500",
      bg: "bg-forest-50",
      border: "border-forest-100",
    },
    {
      icon: BookOpen,
      value: `${contentCount}+`,
      label: "Konten Edukasi",
      color: "text-teal-dark",
      bg: "bg-teal-dark/5",
      border: "border-teal-dark/10",
    },
    {
      icon: Building2,
      value: `${communityCount}+`,
      label: "Komunitas ABK",
      color: "text-olive-500",
      bg: "bg-olive-50",
      border: "border-olive-100",
    },
    {
      icon: Star,
      value: "4.9",
      label: "Rating Rata-rata",
      color: "text-amber-500",
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`rounded-xl border ${stat.border} ${stat.bg} p-4 flex items-center gap-3`}
        >
          <div className={`w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0`}>
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
          </div>
          <div>
            <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-sand-600 leading-tight mt-0.5">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
