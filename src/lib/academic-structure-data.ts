export interface DeptSubject {
  id: string;
  name: string;
  teacherNames: string[];
}

export interface DepartmentCard {
  id: string;
  name: string;
  category: string;
  categoryColor: "sky" | "navy" | "emerald" | "amber";
  courses: number;
  students: number;
  faculty: number;
  metricLabel: string;
  metricValue: number; // percentage 0-100
  subjects: DeptSubject[];
}

export const DEPARTMENTS: DepartmentCard[] = [
  {
    id: "d1",
    name: "Computer Science",
    category: "STEM",
    categoryColor: "sky",
    courses: 54,
    students: 1200,
    faculty: 3,
    metricLabel: "Exam Completion Rate",
    metricValue: 94,
    subjects: [
      { id: "s1", name: "Data Structures", teacherNames: ["Sok Dara"] },
      { id: "s2", name: "Database Systems", teacherNames: ["Ly Vannak"] },
      { id: "s3", name: "Algorithms", teacherNames: ["Sok Dara"] },
    ],
  },
  {
    id: "d2",
    name: "Internet of Things",
    category: "ENGINEERING",
    categoryColor: "navy",
    courses: 42,
    students: 940,
    faculty: 2,
    metricLabel: "Lab Capacity",
    metricValue: 78,
    subjects: [
      { id: "s4", name: "Sensor Technology", teacherNames: ["Chan Sopheak"] },
      { id: "s5", name: "Embedded Systems", teacherNames: ["Chan Sopheak"] },
    ],
  },
  {
    id: "d3",
    name: "Information Technology",
    category: "BUSINESS",
    categoryColor: "emerald",
    courses: 61,
    students: 2100,
    faculty: 4,
    metricLabel: "Research Grant Target",
    metricValue: 62,
    subjects: [
      { id: "s6", name: "Networking Basics", teacherNames: ["Ros Chenda"] },
      { id: "s7", name: "Cloud Computing", teacherNames: ["Heng Sreymom"] },
    ],
  },
  {
    id: "d4",
    name: "Software Engineering",
    category: "HUMANITIES",
    categoryColor: "amber",
    courses: 28,
    students: 620,
    faculty: 1,
    metricLabel: "Enrollment Trend",
    metricValue: 71,
    subjects: [
      { id: "s8", name: "Software Design Patterns", teacherNames: ["Sok Dara"] },
    ],
  },
];