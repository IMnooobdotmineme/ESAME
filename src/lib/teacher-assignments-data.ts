// The departments + subjects THIS teacher is assigned to teach.
// Set entirely by the organization admin (see /teacher/settings, which
// displays this same list read-only) — a teacher can belong to more than
// one department, and can teach more than one subject within the same
// department, but can never add/edit this list themselves.
//
// Every exam a teacher creates must be tagged with one department and one
// subject from this list, so the organization can always tell which
// department/subject a given exam belongs to.

export interface DepartmentAssignment {
  department: string;
  subjects: string[];
}

export const TEACHER_ASSIGNMENTS: DepartmentAssignment[] = [
  {
    department: "Computer Science",
    subjects: ["Data Structures & Algorithms", "Operating Systems"],
  },
  {
    department: "Software Engineering",
    subjects: ["Database Systems"],
  },
];