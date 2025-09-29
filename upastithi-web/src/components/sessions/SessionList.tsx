import type { SessionData } from "./types";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import {
  Clock,
  Users,
  MapPin,
  Share2,
  BarChart3,
  StopCircle,
} from "lucide-react";

interface SessionListProps {
  sessions: SessionData[];
  onViewAttendance: (session: SessionData) => void;
  onEndSession: (sessionId: string) => void;
  onShareSession: (session: SessionData) => void;
}

export const SessionList = ({
  sessions,
  onViewAttendance,
  onEndSession,
  onShareSession,
}: SessionListProps) => {
  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <Card
          key={session.id}
          className="border-0 shadow-sm hover:shadow-md transition-shadow"
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {session.className}
                  </h3>
                  {session.sessionCode && (
                    <span className="px-2 py-1 text-xs font-mono bg-blue-100 text-blue-800 rounded">
                      {session.sessionCode}
                    </span>
                  )}
                  <span
                    className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                      session.active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {session.active ? "Active" : "Completed"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>Started: {session.startTime.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      <span>Session Available</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>Duration: {session.duration} minutes</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>
                        Location: {session.geofence.lat.toFixed(4)},{" "}
                        {session.geofence.lon.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>

                {session.active && (
                  <div className="text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {Math.max(
                      0,
                      Math.ceil(
                        (session.endTime.getTime() - Date.now()) / 60000
                      )
                    )}{" "}
                    minutes remaining
                  </div>
                )}
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onViewAttendance(session)}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Attendance
                </Button>
                {session.active && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onShareSession(session)}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onEndSession(session.id!)}
                    >
                      <StopCircle className="w-4 h-4 mr-2" />
                      End Session
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
