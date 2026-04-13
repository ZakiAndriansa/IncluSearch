import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel — hero */}
      <div className="hidden lg:flex flex-col bg-forest-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-teal-light blur-[80px]" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-olive-300 blur-[100px]" />
        </div>

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14 justify-between">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="IncluSearch"
              width={160}
              height={56}
              className="h-12 w-auto object-contain brightness-0 invert"
              priority
            />
          </Link>

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-teal-light text-sm font-medium backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-light animate-pulse" />
              Platform Terpercaya untuk ABK
            </div>

            <h1 className="text-3xl xl:text-4xl font-serif font-bold text-white leading-snug">
              Bersama kita dukung{" "}
              <span className="text-teal-light">tumbuh kembang</span> anak yang
              luar biasa
            </h1>

            <p className="text-white/60 text-base leading-relaxed max-w-md">
              Temukan pakar ortopedagogik terbaik, akses pengetahuan berkualitas,
              dan bergabung dengan komunitas yang peduli terhadap Anak
              Berkebutuhan Khusus.
            </p>

            <div className="flex items-center gap-8 pt-4">
              {[
                { label: "Pakar Terverifikasi", value: "200+" },
                { label: "Keluarga Terbantu", value: "5.000+" },
                { label: "Rating Kepuasan", value: "4.9/5" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold text-white">
                    {stat.value}
                  </div>
                  <div className="text-white/40 text-xs mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/30 text-xs">
            &copy; 2025 IncluSearch. Hak cipta dilindungi.
          </p>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center mb-8">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="IncluSearch"
                width={160}
                height={56}
                className="h-11 w-auto object-contain"
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
