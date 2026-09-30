import { FaqItem, MarketingPage } from "@/components/marketing/MarketingPage";

const FAQS = [
  ["Who is Esame for?", "Esame is designed for organizations, teachers, and students who need a dependable online examination workflow."],
  ["Can teachers create different question types?", "Yes. Teachers can build structured exams with objective, written, coding, matching, ordering, and other supported question formats."],
  ["How does live supervision work?", "Teachers can monitor an active exam session, review student status, and respond to approval or continuation requests from the monitoring workspace."],
  ["Can results include manual review?", "Yes. Exams with written or other manually graded responses can remain pending until the teacher completes review."],
  ["How do I get started?", "Organizations can create an account from the Get Started button. Teachers and students can then use the access flow provided by their organization or instructor."],
];

export default function FaqPage() {
  return (
    <MarketingPage eyebrow="Help center" title="Answers before your first exam." intro="Explore the common questions organizations, teachers, and students ask about the Esame assessment workflow.">
      <div className="mx-auto max-w-3xl space-y-3">
        {FAQS.map(([question, answer], index) => <FaqItem key={question} question={question} answer={answer} defaultOpen={index === 0} />)}
      </div>
    </MarketingPage>
  );
}
