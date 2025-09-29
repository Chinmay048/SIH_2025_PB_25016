export interface SessionData {
  id?: string;
  classId: string;
  className: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  createdByFacultyId: string;
  geofence: {
    lat: number;
    lon: number;
    radius: number;
  };
  active: boolean;
  sessionCode?: string;
}

export interface ClassData {
  id: string;
  title: string;
  semester: string;
  facultyId: string;
  geofence?: {
    lat: number;
    lon: number;
    radius: number;
  };
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  timestamp: Date;
  status: "present" | "absent";
  location: {
    lat: number;
    lon: number;
  };
  faceMatchScore?: number;
}

export interface FormData {
  classId: string;
  duration: number;
  geofence: {
    lat: number;
    lon: number;
    radius: number;
  };
}
