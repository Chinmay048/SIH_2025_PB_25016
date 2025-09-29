export interface AttendanceRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  sessionId: string;
  sessionName: string;
  className: string;
  facultyId: string;
  requestType:
    | "face_match_failed"
    | "location_issue"
    | "technical_error"
    | "other";
  status: "pending" | "approved" | "rejected";
  description: string;
  evidence?: {
    type: "image" | "screenshot" | "document";
    url: string;
    filename: string;
  }[];
  location?: {
    lat: number;
    lon: number;
    accuracy?: number;
  };
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewComments?: string;
  originalAttendanceAttempt?: {
    timestamp: Date;
    location: {
      lat: number;
      lon: number;
    };
    faceMatchScore?: number;
    error: string;
  };
}

export interface RequestFilters {
  status: string;
  requestType: string;
  dateFrom: string;
  dateTo: string;
  searchQuery: string;
  className: string;
}

export interface RequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  byType: {
    face_match_failed: number;
    location_issue: number;
    technical_error: number;
    other: number;
  };
}
