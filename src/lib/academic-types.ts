export interface AcademicYear {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  status: "Active" | "Archived";
}

export interface Semester {
  id: string;
  name: string;
  academicYearId: string;
  startDate: string;
  endDate: string;
  status: "Active" | "Upcoming" | "Completed";
}

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  credits: number;
  teacherIds: string[];
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
}