export interface OrgDirectoryEntry {
  id: string;
  name: string;
  code: string;
  teachersCount: number;
  studentsCount: number;
}

export const ORG_DIRECTORY: OrgDirectoryEntry[] = [
  { id: "org-01", name: "Faculty of Computer Science & Engineering", code: "FCSE-MAIN", teachersCount: 14, studentsCount: 320 },
  { id: "org-02", name: "School of Software Development", code: "SSD-CAMPUS", teachersCount: 8, studentsCount: 180 },
  { id: "org-03", name: "Institute of Technology & Science", code: "ITS-MAIN", teachersCount: 24, studentsCount: 520 },
  { id: "org-04", name: "National School of Engineering", code: "NSE-CAMPUS", teachersCount: 18, studentsCount: 340 },
];

export interface TeacherDirectoryEntry {
  id: string;
  name: string;
  email: string;
  orgId: string;
  orgName: string;
}

export const TEACHER_DIRECTORY: TeacherDirectoryEntry[] = [
  { id: "USR-101", name: "Professor Julian Vance", email: "j.vance@university.edu", orgId: "org-01", orgName: "Faculty of Computer Science & Engineering" },
  { id: "USR-102", name: "Dr. Aris Thorne", email: "a.thorne@university.edu", orgId: "org-01", orgName: "Faculty of Computer Science & Engineering" },
  { id: "USR-103", name: "Sok Dara", email: "sok.dara@kit.edu.kh", orgId: "org-02", orgName: "School of Software Development" },
  { id: "USR-104", name: "Chan Sopheak", email: "chan.sopheak@kit.edu.kh", orgId: "org-02", orgName: "School of Software Development" },
  { id: "USR-105", name: "Ly Vannak", email: "ly.vannak@kit.edu.kh", orgId: "org-03", orgName: "Institute of Technology & Science" },
  { id: "USR-106", name: "Ros Chenda", email: "ros.chenda@kit.edu.kh", orgId: "org-03", orgName: "Institute of Technology & Science" },
  { id: "USR-107", name: "Heng Sreymom", email: "heng.sreymom@kit.edu.kh", orgId: "org-04", orgName: "National School of Engineering" },
];

export const TOTAL_STUDENTS = ORG_DIRECTORY.reduce((sum, o) => sum + o.studentsCount, 0);
export const TOTAL_TEACHERS = ORG_DIRECTORY.reduce((sum, o) => sum + o.teachersCount, 0);
