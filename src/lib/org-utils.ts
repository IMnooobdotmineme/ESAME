export type TeacherAssignment = { department: string; subject: string };

export function normalizeTeacherStatus(status: string | null | undefined) {
  switch (status) {
    case "active":
      return "Active";
    case "suspended":
      return "Suspended";
    case "deleted":
      return "Deleted";
    default:
      return "Pending";
  }
}

export function normalizeAssignments(raw: unknown): TeacherAssignment[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      const department = typeof item.department === "string" ? item.department.trim() : "";
      const subject = typeof item.subject === "string" ? item.subject.trim() : "";
      if (!department || !subject) return null;
      return { department, subject };
    })
    .filter((entry): entry is TeacherAssignment => !!entry);
}

export function formatJoinedDate(date: Date | null | undefined) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatRelativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatJoinedDate(date);
}

export function mapExamStatus(status: string | null | undefined) {
  switch (status) {
    case "in_progress":
      return "Ongoing";
    case "completed":
      return "Completed";
    case "locked":
      return "Locked";
    default:
      return "Scheduled";
  }
}

export function assignmentKey(department: string, subject: string) {
  return `${department}::${subject}`;
}

export function renameDepartmentInAssignments(
  assignments: TeacherAssignment[],
  oldName: string,
  newName: string
) {
  return assignments.map((entry) =>
    entry.department === oldName ? { ...entry, department: newName } : entry
  );
}

export function renameSubjectInAssignments(
  assignments: TeacherAssignment[],
  departmentName: string,
  oldSubject: string,
  newSubject: string
) {
  return assignments.map((entry) =>
    entry.department === departmentName && entry.subject === oldSubject
      ? { ...entry, subject: newSubject }
      : entry
  );
}

export function removeDepartmentFromAssignments(
  assignments: TeacherAssignment[],
  departmentName: string
) {
  return assignments.filter((entry) => entry.department !== departmentName);
}

export function removeSubjectFromAssignments(
  assignments: TeacherAssignment[],
  departmentName: string,
  subjectName: string
) {
  return assignments.filter(
    (entry) => !(entry.department === departmentName && entry.subject === subjectName)
  );
}
