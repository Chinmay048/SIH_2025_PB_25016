import type { SessionData, AttendanceRecord } from "./types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Users, X } from "lucide-react";

interface AttendanceModalProps {
  selectedSession: SessionData;
  attendanceRecords: AttendanceRecord[];
  onClose: () => void;
}

export const AttendanceModal = ({
  selectedSession,
  attendanceRecords,
  onClose,
}: AttendanceModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Attendance - {selectedSession.className}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-96">
          <div className="space-y-3">
            {attendanceRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No attendance records yet</p>
              </div>
            ) : (
              attendanceRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {record.studentName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {record.timestamp.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        record.status === "present"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {record.status}
                    </span>
                    {record.faceMatchScore && (
                      <span className="text-xs text-gray-500">
                        Face: {(record.faceMatchScore * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
