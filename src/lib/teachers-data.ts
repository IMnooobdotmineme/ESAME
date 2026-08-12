export type TeacherStatus = "Active" | "Pending" | "Suspended" | "Deactivated";

export interface Teacher {
  id: string;
  name: string;
  email: string;
  department: string;
  subject: string;
  status: TeacherStatus;
  joined: string;
}

export const INITIAL_TEACHERS: Teacher[] = [
  { id: "1", name: "Sok Dara", email: "sok.dara@kit.edu.kh", department: "Computer Science", subject: "Data Structures", status: "Active", joined: "Jan 12, 2026" },
  { id: "2", name: "Chan Sopheak", email: "chan.sopheak@kit.edu.kh", department: "Internet of Things", subject: "Sensor Technology", status: "Active", joined: "Feb 3, 2026" },
  { id: "3", name: "Ly Vannak", email: "ly.vannak@kit.edu.kh", department: "Computer Science", subject: "Database Systems", status: "Pending", joined: "Jul 10, 2026" },
  { id: "4", name: "Ros Chenda", email: "ros.chenda@kit.edu.kh", department: "Information Technology", subject: "Networking Basics", status: "Active", joined: "Mar 22, 2026" },
  { id: "5", name: "Heng Sreymom", email: "heng.sreymom@kit.edu.kh", department: "Information Technology", subject: "Cloud Computing", status: "Suspended", joined: "Nov 5, 2025" },
];

export function getTeacherByName(name: string): Teacher | undefined {
  return INITIAL_TEACHERS.find((t) => t.name === name);
}
