import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Real figures from the database instead of hardcoded marketing numbers.
  const [expertCount, familyCount, ratingAgg] = await Promise.all([
    prisma.expertProfile.count({ where: { isVerified: true } }),
    prisma.user.count({ where: { role: "PARENT" } }),
    prisma.expertProfile.aggregate({
      _avg: { rating: true },
      where: { isVerified: true, totalReviews: { gt: 0 } },
    }),
  ]);
  const avgRating = ratingAgg._avg.rating;

  const stats = [
    { label: "Pakar Terverifikasi", value: expertCount > 0 ? `${expertCount}` : "—" },
    { label: "Keluarga Bergabung", value: familyCount > 0 ? `${familyCount}` : "—" },
    { label: "Rating Kepuasan", value: avgRating ? `${avgRating.toFixed(1)}/5` : "—" },
  ];

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel — hero */}
      <div className="hidden lg:flex flex-col bg-forest-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-teal-light blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-olive-400 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col h-full p-12 justify-between">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="IncluSearch"
              width={160}
              height={56}
              className="h-14 w-auto object-contain brightness-0 invert"
              priority
            />
          </Link>

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-teal-light text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-teal-light animate-pulse" />
              Platform Terpercaya untuk ABK
            </div>

            <h1 className="text-4xl xl:text-5xl font-serif font-bold text-white leading-tight">
              Bersama kita dukung{" "}
              <span className="text-teal-light">tumbuh kembang</span> anak yang
              luar biasa
            </h1>

            <p className="text-white/70 text-lg leading-relaxed max-w-md">
              Temukan pakar ortopedagogik terbaik, akses pengetahuan berkualitas,
              dan bergabung dengan komunitas yang peduli terhadap Anak
              Berkebutuhan Khusus.
            </p>

            <div className="flex items-center gap-6 pt-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {stat.value}
                  </div>
                  <div className="text-white/60 text-xs mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/40 text-sm">
            © 2026 IncluSearch. Hak cipta dilindungi.
          </p>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-sand-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center mb-8">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="IncluSearch"
                width={160}
                height={56}
                className="h-12 w-auto object-contain"
                priority
              />
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
