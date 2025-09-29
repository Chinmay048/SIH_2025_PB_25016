import type { ClassData } from "./types";

export const loadDemoClasses = (): ClassData[] => [
  {
    id: "class1",
    title: "Computer Science 101",
    semester: "Fall 2025",
    facultyId: "demo-faculty",
    geofence: { lat: 28.6139, lon: 77.209, radius: 100 },
  },
  {
    id: "class2",
    title: "Data Structures & Algorithms",
    semester: "Fall 2025",
    facultyId: "demo-faculty",
    geofence: { lat: 28.6129, lon: 77.2085, radius: 75 },
  },
  {
    id: "class3",
    title: "Database Management Systems",
    semester: "Fall 2025",
    facultyId: "demo-faculty",
    geofence: { lat: 28.6149, lon: 77.2095, radius: 120 },
  },
];
