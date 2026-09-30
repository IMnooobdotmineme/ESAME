import { FeatureCard, MarketingPage } from "@/components/marketing/MarketingPage";

export default function TermsPage() {
  return (
    <MarketingPage eyebrow="Terms of service" title="A shared standard for responsible assessment." intro="These plain-language principles describe how Esame is intended to be used by organizations, teachers, and students.">
      <div className="grid gap-5 md:grid-cols-2">
        <FeatureCard icon="file" title="Use the platform responsibly">Use Esame only for authorized educational or assessment activity, and keep account credentials private.</FeatureCard>
        <FeatureCard icon="shield" title="Protect assessment integrity">Do not interfere with live exams, attempt unauthorized access, or use the platform to compromise another person’s work.</FeatureCard>
      </div>
      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 text-sm leading-7 text-slate-600 shadow-sm sm:p-8">
        <p>Organizations are responsible for their users, exam content, permissions, and notices. Esame may update the platform to improve reliability, security, or functionality. Questions about these principles can be sent to <a className="font-semibold text-sky-700 hover:underline" href="mailto:ESAME@gmail.com">ESAME@gmail.com</a>.</p>
      </div>
    </MarketingPage>
  );
}
