import { FeatureCard, MarketingPage } from "@/components/marketing/MarketingPage";

export default function PrivacyPage() {
  return (
    <MarketingPage eyebrow="Privacy" title="Privacy should be easy to understand." intro="This overview explains the principles Esame follows when handling account, assessment, and operational information.">
      <div className="grid gap-5 md:grid-cols-2">
        <FeatureCard icon="shield" title="Purpose-limited data">Information is used to provide authentication, examination workflows, supervision, grading, notifications, and support.</FeatureCard>
        <FeatureCard icon="shield" title="Access awareness">Workspace information is shown according to the user role and the permissions required for that workflow.</FeatureCard>
      </div>
      <div className="mt-8 space-y-5 rounded-3xl border border-slate-200 bg-white p-6 text-sm leading-7 text-slate-600 shadow-sm sm:p-8">
        <p>We aim to collect only what is needed to operate the platform, protect assessment integrity, and improve support. Organizations should make sure students and staff receive any notices required by their own policies and applicable law.</p>
        <p>For privacy questions or data requests, contact <a className="font-semibold text-sky-700 hover:underline" href="mailto:ESAME@gmail.com">ESAME@gmail.com</a>.</p>
      </div>
    </MarketingPage>
  );
}
