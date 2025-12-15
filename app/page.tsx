import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#152211] text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center space-y-12">
        {/* Logo / Header */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-cover bg-center border-2 border-[#2c4823]"
            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAtk02XUI2TjvCyvZJ55eiIaXagtiaUdmPVL8golyshCvOwCS99zCFsivZkCk1miLFdxIBEDjdqqALhfD7lEytt89hub5hDQ0XOjW3HYsW3KyI6mKR-tyW1VrVBDVeUmOX6a7HJOtyTGmHVfRqQi3lkOgwA612Kx7XV0BSqDr2v0Jar6NpELhRJ_GZywhEDHE822GsWriy4l4vNwCLPbA0uBek_pXak-Z4D1lBUtbO9q_SWEWgtOp7n4BZGzNhgpGFtkB8Tly_E6nt1")' }}>
          </div>
          <h1 className="text-5xl font-bold tracking-tight">Stitch</h1>
          <p className="text-xl text-[#9fc992]">The modern interview scheduling platform.</p>
        </div>

        {/* Portal Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Recruiter Portal */}
          <Link href="/recruiter/login"
            className="group block p-8 rounded-3xl bg-[#2c4823]/20 border border-[#2c4823] hover:bg-[#2c4823]/40 hover:border-primary transition-all duration-300">
            <div className="flex flex-col items-center gap-4">
              <span className="material-symbols-outlined text-4xl text-primary group-hover:scale-110 transition-transform">work</span>
              <h2 className="text-2xl font-bold">Recruiter Portal</h2>
              <p className="text-[#9fc992] text-sm">Manage templates, track metrics, and oversee the hiring process.</p>
            </div>
          </Link>

          {/* Hiring Manager Portal */}
          <Link href="/manager/login"
            className="group block p-8 rounded-3xl bg-[#2c4823]/20 border border-[#2c4823] hover:bg-[#2c4823]/40 hover:border-[#0078d4] transition-all duration-300">
            <div className="flex flex-col items-center gap-4">
              {/* Using a different color for manager hover effect manually via style or just standard primary for consistency */}
              <span className="material-symbols-outlined text-4xl text-white group-hover:scale-110 transition-transform">calendar_month</span>
              <h2 className="text-2xl font-bold">Hiring Manager</h2>
              <p className="text-[#9fc992] text-sm">Set your availability and manage interview slots.</p>
            </div>
          </Link>
        </div>

        <div className="pt-12 text-[#9fc992]/40 text-sm">
          <p>Debug Links:</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link href="/booking/demo-template-id" className="hover:text-white underline">Candidate Booking Demo</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
