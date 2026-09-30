import { FeatureCard, MarketingPage } from "@/components/marketing/MarketingPage";

export default function AboutPage() {
  return (
    <MarketingPage eyebrow="About Esame" title="Assessment infrastructure built for trust." intro="Esame brings organizations, teachers, and students into one calm, secure workspace for creating, delivering, monitoring, and reviewing online examinations.">
      <div className="grid gap-5 md:grid-cols-3">
        <FeatureCard icon="building" title="For organizations">Give your academic teams one reliable place to manage structure, teachers, exams, and reporting.</FeatureCard>
        <FeatureCard icon="graduation" title="For teachers">Create thoughtful assessments, supervise live sessions, and move from submissions to results with less friction.</FeatureCard>
        <FeatureCard icon="shield" title="Built around integrity">Proctoring signals, controlled exam flows, and clear audit trails help protect every assessment.</FeatureCard>
      </div>
      <div className="mt-8 rounded-3xl border border-sky-100 bg-sky-50/60 p-6 sm:p-8">
        <p className="max-w-3xl text-sm leading-8 text-slate-700 sm:text-base">Our goal is simple: make high-integrity assessment feel approachable. Every screen is designed to keep important actions clear, reduce administrative overhead, and give educators better visibility into learning.</p>
      </div>
    </MarketingPage>
  );
}
