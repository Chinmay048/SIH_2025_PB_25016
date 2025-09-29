import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/config";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import Layout from "../components/AppLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Plus, ArrowLeft, ArrowRight, Clock } from "lucide-react";

// Import modular components
import { ClassSelection } from "../components/sessions/ClassSelection";
import { SessionDetails } from "../components/sessions/SessionDetails";
import { SessionSummary } from "../components/sessions/SessionSummary";
import { SessionList } from "../components/sessions/SessionList";
import { AttendanceModal } from "../components/sessions/AttendanceModal";

// Import types and data
import type {
  SessionData,
  ClassData,
  AttendanceRecord,
  FormData,
} from "../components/sessions/types";
import { loadDemoClasses } from "../components/sessions/demoData";

const Sessions = () => {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(
    null
  );
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState<FormData>({
    classId: "",
    duration: 60,
    geofence: {
      lat: 0,
      lon: 0,
      radius: 50,
    },
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchSessions();
    loadDemoData();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchAttendanceRecords(selectedSession.id!);
    }
  }, [selectedSession]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }

      const sessionsQuery = query(
        collection(db, "sessions"),
        where("createdByFacultyId", "==", user.uid),
        orderBy("startTime", "desc")
      );

      const sessionsSnap = await getDocs(sessionsQuery);
      const sessionList: SessionData[] = [];

      sessionsSnap.forEach((doc) => {
        const data = doc.data();
        sessionList.push({
          id: doc.id,
          ...data,
          startTime: data.startTime.toDate(),
          endTime: data.endTime.toDate(),
        } as SessionData);
      });

      setSessions(sessionList);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
    setLoading(false);
  };

  const loadDemoData = () => {
    setClasses(loadDemoClasses());
    setLoading(false);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      if (!user || !selectedClass) return;

      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + formData.duration * 60000);

      const sessionCode = `${selectedClass.title
        .substring(0, 3)
        .toUpperCase()}${Date.now().toString().slice(-4)}`;

      const sessionData = {
        classId: formData.classId,
        className: selectedClass.title,
        startTime,
        endTime,
        duration: formData.duration,
        createdByFacultyId: user.uid,
        geofence: formData.geofence,
        active: true,
        sessionCode,
      };

      await addDoc(collection(db, "sessions"), sessionData);

      setShowCreateForm(false);
      setCurrentStep(1);
      setSelectedClass(null);
      setFormData({
        classId: "",
        duration: 60,
        geofence: { lat: 0, lon: 0, radius: 50 },
      });

      fetchSessions();
    } catch (error) {
      console.error("Error creating session:", error);
    }
  };

  const handleClassSelect = (classData: ClassData) => {
    setSelectedClass(classData);
    setFormData((prev) => ({
      ...prev,
      classId: classData.id,
      geofence: classData.geofence || prev.geofence,
    }));
    setCurrentStep(2);
  };

  const handleEndSession = async (sessionId: string) => {
    try {
      await updateDoc(doc(db, "sessions", sessionId), {
        active: false,
        endTime: new Date(),
      });
      fetchSessions();
    } catch (error) {
      console.error("Error ending session:", error);
    }
  };

  const handleShareSession = (session: SessionData) => {
    const shareText = `Join session: ${session.className}\nCode: ${
      session.sessionCode
    }\nEnds: ${session.endTime.toLocaleString()}`;
    navigator.clipboard.writeText(shareText);
  };

  const fetchAttendanceRecords = (sessionId: string) => {
    const attendanceQuery = query(
      collection(db, "attendance"),
      where("sessionId", "==", sessionId)
    );

    const unsubscribe = onSnapshot(attendanceQuery, (snapshot) => {
      const records: AttendanceRecord[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        records.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate(),
        } as AttendanceRecord);
      });
      setAttendanceRecords(records);
    });

    return unsubscribe;
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            geofence: {
              ...prev.geofence,
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            },
          }));
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  return (
    <Layout
      title="Sessions Management"
      subtitle="Create and manage your attendance sessions"
    >
      <div className="p-4 lg:p-6 w-full max-w-none">
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-gray-900 hover:bg-gray-800"
              disabled={showCreateForm}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Session
            </Button>
          </div>

          {/* Create Session Form */}
          {showCreateForm && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Create New Session</CardTitle>
                  <div className="flex space-x-2">
                    {[1, 2, 3].map((step) => (
                      <div
                        key={step}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                          currentStep >= step
                            ? "bg-gray-900 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Step Components */}
                {currentStep === 1 && (
                  <ClassSelection
                    classes={classes}
                    onClassSelect={handleClassSelect}
                  />
                )}

                {currentStep === 2 && selectedClass && (
                  <SessionDetails
                    selectedClass={selectedClass}
                    formData={formData}
                    onFormDataChange={setFormData}
                    onGetCurrentLocation={getCurrentLocation}
                  />
                )}

                {currentStep === 3 && selectedClass && (
                  <SessionSummary
                    selectedClass={selectedClass}
                    formData={formData}
                    onSubmit={handleCreateSession}
                  />
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4 border-t">
                  <div>
                    {currentStep > 1 && (
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(currentStep - 1)}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {currentStep < 3 && currentStep === 2 && (
                      <Button
                        onClick={() => setCurrentStep(currentStep + 1)}
                        className="bg-gray-900 hover:bg-gray-800"
                      >
                        Next: Review
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false);
                        setCurrentStep(1);
                        setSelectedClass(null);
                        setFormData({
                          classId: "",
                          duration: 60,
                          geofence: { lat: 0, lon: 0, radius: 50 },
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sessions List */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="text-center py-12">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 mb-4">
                      No sessions found. Create your first session!
                    </p>
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      className="bg-gray-900 hover:bg-gray-800"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Session
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <SessionList
                  sessions={sessions}
                  onViewAttendance={setSelectedSession}
                  onEndSession={handleEndSession}
                  onShareSession={handleShareSession}
                />
              )}
            </div>
          )}

          {/* Attendance Modal */}
          {selectedSession && (
            <AttendanceModal
              selectedSession={selectedSession}
              attendanceRecords={attendanceRecords}
              onClose={() => setSelectedSession(null)}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Sessions;
