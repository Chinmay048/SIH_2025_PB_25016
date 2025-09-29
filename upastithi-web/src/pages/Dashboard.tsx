import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import Layout from "../components/AppLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Users,
  Calendar,
  CheckCircle,
  TrendingUp,
  Plus,
  Activity,
} from "lucide-react";

interface SessionData {
  id: string;
  active: boolean;
  [key: string]: any;
}

interface AnalyticsData {
  present: number;
  absent: number;
  total: number;
}

const Dashboard = () => {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    present: 0,
    absent: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate("/login");
          return;
        }

        // Fetch sessions
        const sessionsQuery = query(
          collection(db, "sessions"),
          where("createdByFacultyId", "==", user.uid)
        );
        const sessionsSnap = await getDocs(sessionsQuery);
        const sessionList: SessionData[] = [];
        sessionsSnap.forEach((doc) => {
          sessionList.push({ id: doc.id, ...doc.data() } as SessionData);
        });

        // Fetch attendance
        const attendanceQuery = query(
          collection(db, "attendance"),
          where("facultyId", "==", user.uid)
        );
        const attendanceSnap = await getDocs(attendanceQuery);
        let present = 0,
          absent = 0;
        attendanceSnap.forEach((doc) => {
          const data = doc.data();
          if (data.status === "present") present++;
          else absent++;
        });

        setSessions(sessionList);
        setAnalytics({ present, absent, total: present + absent });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const stats = [
    {
      title: "Active Sessions",
      value: sessions.filter((s) => s.active).length,
      icon: Activity,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Sessions",
      value: sessions.length,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Present Today",
      value: analytics.present,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Total Students",
      value: analytics.total,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  const chartData = {
    labels: ["Present", "Absent"],
    datasets: [
      {
        data: [analytics.present, analytics.absent],
        backgroundColor: ["#10B981", "#EF4444"],
        borderWidth: 0,
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "#F3F4F6",
        },
      },
    },
  };

  if (loading) {
    return (
      <Layout title="Dashboard" subtitle="Welcome back! Here's your overview.">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard" subtitle="Welcome back! Here's your overview.">
      <div className="p-4 lg:p-6 w-full max-w-none">
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => navigate("/sessions/create")}
              className="bg-gray-900 hover:bg-gray-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Session
            </Button>
            <Button variant="outline" onClick={() => navigate("/analytics")}>
              <TrendingUp className="w-4 h-4 mr-2" />
              View Analytics
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={index}
                  className="border-0 shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          {stat.title}
                        </p>
                        <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                          {stat.value}
                        </p>
                      </div>
                      <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                        <Icon
                          className={`w-5 h-5 lg:w-6 lg:h-6 ${stat.color}`}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
            {/* Attendance Chart */}
            <Card className="xl:col-span-2 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Attendance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Quick Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Attendance Rate</span>
                  <span className="font-semibold">
                    {analytics.total > 0
                      ? `${Math.round(
                          (analytics.present / analytics.total) * 100
                        )}%`
                      : "0%"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active Sessions</span>
                  <span className="font-semibold text-green-600">
                    {sessions.filter((s) => s.active).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Completed Sessions</span>
                  <span className="font-semibold">
                    {sessions.filter((s) => !s.active).length}
                  </span>
                </div>
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/history")}
                  >
                    View Full History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessions.length > 0 ? (
                <div className="space-y-3">
                  {sessions.slice(0, 5).map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            session.active ? "bg-green-500" : "bg-gray-400"
                          }`}
                        ></div>
                        <span className="text-sm">Session {session.id}</span>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          session.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {session.active ? "Active" : "Completed"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>
                    No sessions yet. Create your first session to get started!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
