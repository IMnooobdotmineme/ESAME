import { ContactPanel, FeatureCard, MarketingPage } from "@/components/marketing/MarketingPage";

export default function SupportPage() {
  return (
    <MarketingPage eyebrow="Support" title="Clear help when an assessment matters." intro="Find a starting point for setup, live exam operations, and result review—or contact the Esame team directly.">
      <div className="grid gap-5 md:grid-cols-3">
        <FeatureCard icon="book" title="Setup guidance">Review the FAQ, then use your organization or teacher workspace to configure departments, courses, and exams.</FeatureCard>
        <FeatureCard icon="lifeBuoy" title="Live exam help">For an active exam, teachers can use Live Monitoring to review participants and handle requests as they arrive.</FeatureCard>
        <FeatureCard icon="message" title="Contact support">Send us a message with your organization, browser, and a short description of the issue so we can respond faster.</FeatureCard>
      </div>
      <div className="mt-8"><ContactPanel /></div>
    </MarketingPage>
  );
}
