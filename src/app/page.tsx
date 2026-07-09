import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Link
        href="/sign-up"
        className="px-6 py-3 bg-[#4F46E5] text-white rounded-xl font-semibold hover:bg-opacity-90 transition-all"
      >
        Go to Organization Sign Up
      </Link>
    </div>
  );
}
