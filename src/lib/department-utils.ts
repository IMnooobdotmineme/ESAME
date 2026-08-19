// Derives a short, uppercase badge code from a full department name
// (e.g. "Computer Science" -> "CS"), so exam cards can show a compact
// tag while the full name is still available on hover.

const KNOWN_DEPARTMENT_CODES: Record<string, string> = {
  "Computer Science": "CS",
  "Software Engineering": "SE",
  "Information Technology": "IT",
  "Database Systems": "DB",
  Cybersecurity: "CYB",
  "Web Development": "WEB",
  Chemistry: "CHEM",
  Biology: "BIO",
  Physics: "PHYS",
  Mathematics: "MATH",
  Economics: "ECON",
  Psychology: "PSY",
  "Business Administration": "BUS",
  "Electrical Engineering": "EE",
  "Mechanical Engineering": "ME",
  "Civil Engineering": "CE",
};

const IGNORED_WORDS = new Set(["of", "and", "the", "&", "for", "in"]);

/** e.g. "Computer Science" -> "CS", "Chemistry" -> "CHEM" */
export function getDepartmentCode(department: string): string {
  const trimmed = department.trim();
  if (!trimmed) return "EXAM";
  if (KNOWN_DEPARTMENT_CODES[trimmed]) return KNOWN_DEPARTMENT_CODES[trimmed];

  const words = trimmed.split(/\s+/).filter((w) => !IGNORED_WORDS.has(w.toLowerCase()));
  if (words.length === 0) return "EXAM";
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase();

  return words
    .map((w) => w[0])
    .join("")
    .slice(0, 4)
    .toUpperCase();
}