import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/config";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import Layout from "../components/AppLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import {
  TrendingUp,
  Users,
  Calendar,
  Clock,
  Download,
  Filter,
  BarChart3,
  PieChart,
  Activity,
  Target,
} from "lucide-react";
import type { SessionData } from "../components/sessions/types";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AttendanceData {
  date: string;
  present: number;
  total: number;
  rate: number;
}

interface ClassAnalytics {
  className: string;
  totalSessions: number;
  avgAttendance: number;
  totalAttendees: number;
  attendanceRate: number;
}

interface TimeAnalytics {
  hour: string;
  sessions: number;
  avgAttendance: number;
}

interface AnalyticsFilters {
  dateFrom: string;
  dateTo: string;
  classFilter: string;
}

const Analytics = () => {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [classAnalytics, setClassAnalytics] = useState<ClassAnalytics[]>([]);
  const [timeAnalytics, setTimeAnalytics] = useState<TimeAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateFrom: "",
    dateTo: "",
    classFilter: "all",
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      processAnalyticsData();
    }
  }, [sessions, filters]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }

      // Fetch sessions
      const sessionsQuery = query(
        collection(db, "sessions"),
        where("createdByFacultyId", "==", user.uid),
        orderBy("startTime", "desc")
      );

      const sessionsSnap = await getDocs(sessionsQuery);
      const sessionList: SessionData[] = [];

      for (const doc of sessionsSnap.docs) {
        const data = doc.data();
        const sessionData = {
          id: doc.id,
          ...data,
          startTime: data.startTime.toDate(),
          endTime: data.endTime.toDate(),
        } as SessionData;

        // Fetch attendance for each session
        const attendanceQuery = query(
          collection(db, "attendance"),
          where("sessionId", "==", doc.id)
        );
        const attendanceSnap = await getDocs(attendanceQuery);

        (sessionData as any).attendanceRecords = attendanceSnap.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate(),
          })
        );

        sessionList.push(sessionData);
      }

      setSessions(sessionList);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    }
    setLoading(false);
  };

  const processAnalyticsData = () => {
    let filteredSessions = [...sessions];

    // Apply date filters
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filteredSessions = filteredSessions.filter(
        (s) => s.startTime >= fromDate
      );
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filteredSessions = filteredSessions.filter((s) => s.startTime <= toDate);
    }
    if (filters.classFilter !== "all") {
      filteredSessions = filteredSessions.filter(
        (s) => s.classId === filters.classFilter
      );
    }

    // Process attendance trends
    const attendanceTrends: {
      [key: string]: { present: number; total: number };
    } = {};

    filteredSessions.forEach((session) => {
      const dateKey = session.startTime.toISOString().split("T")[0];
      const records = (session as any).attendanceRecords || [];
      const presentCount = records.filter(
        (r: any) => r.status === "present"
      ).length;

      if (!attendanceTrends[dateKey]) {
        attendanceTrends[dateKey] = { present: 0, total: 0 };
      }
      attendanceTrends[dateKey].present += presentCount;
      attendanceTrends[dateKey].total += records.length;
    });

    const attendanceArray = Object.entries(attendanceTrends)
      .map(([date, data]) => ({
        date,
        present: data.present,
        total: data.total,
        rate: data.total > 0 ? (data.present / data.total) * 100 : 0,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 days

    setAttendanceData(attendanceArray);

    // Process class analytics
    const classData: {
      [key: string]: {
        sessions: SessionData[];
        totalAttendees: number;
        totalPresent: number;
      };
    } = {};

    filteredSessions.forEach((session) => {
      if (!classData[session.className]) {
        classData[session.className] = {
          sessions: [],
          totalAttendees: 0,
          totalPresent: 0,
        };
      }
      classData[session.className].sessions.push(session);

      const records = (session as any).attendanceRecords || [];
      classData[session.className].totalAttendees += records.length;
      classData[session.className].totalPresent += records.filter(
        (r: any) => r.status === "present"
      ).length;
    });

    const classAnalyticsArray = Object.entries(classData)
      .map(([className, data]) => ({
        className,
        totalSessions: data.sessions.length,
        totalAttendees: data.totalAttendees,
        avgAttendance:
          data.totalAttendees > 0
            ? data.totalAttendees / data.sessions.length
            : 0,
        attendanceRate:
          data.totalAttendees > 0
            ? (data.totalPresent / data.totalAttendees) * 100
            : 0,
      }))
      .sort((a, b) => b.attendanceRate - a.attendanceRate);

    setClassAnalytics(classAnalyticsArray);

    // Process time analytics
    const timeData: {
      [key: string]: { sessions: number; totalAttendees: number };
    } = {};

    filteredSessions.forEach((session) => {
      const hour = session.startTime.getHours();
      const hourKey = `${hour}:00`;

      if (!timeData[hourKey]) {
        timeData[hourKey] = { sessions: 0, totalAttendees: 0 };
      }
      timeData[hourKey].sessions += 1;

      const records = (session as any).attendanceRecords || [];
      timeData[hourKey].totalAttendees += records.length;
    });

    const timeAnalyticsArray = Object.entries(timeData)
      .map(([hour, data]) => ({
        hour,
        sessions: data.sessions,
        avgAttendance:
          data.sessions > 0 ? data.totalAttendees / data.sessions : 0,
      }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

    setTimeAnalytics(timeAnalyticsArray);
  };

  const handleFilterChange = (key: keyof AnalyticsFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      classFilter: "all",
    });
  };

  // Chart configurations
  const attendanceTrendConfig = {
    data: {
      labels: attendanceData.map((d) =>
        new Date(d.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      ),
      datasets: [
        {
          label: "Attendance Rate (%)",
          data: attendanceData.map((d) => d.rate),
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top" as const,
        },
        title: {
          display: true,
          text: "Attendance Trend (Last 30 Days)",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function (value: any) {
              return value + "%";
            },
          },
        },
      },
    },
  };

  const classAnalyticsConfig = {
    data: {
      labels: classAnalytics.map((c) => c.className),
      datasets: [
        {
          label: "Average Attendance Rate (%)",
          data: classAnalytics.map((c) => c.attendanceRate),
          backgroundColor: [
            "rgba(255, 99, 132, 0.2)",
            "rgba(54, 162, 235, 0.2)",
            "rgba(255, 205, 86, 0.2)",
            "rgba(75, 192, 192, 0.2)",
            "rgba(153, 102, 255, 0.2)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 205, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top" as const,
        },
        title: {
          display: true,
          text: "Class-wise Attendance Rates",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function (value: any) {
              return value + "%";
            },
          },
        },
      },
    },
  };

  const timeAnalyticsConfig = {
    data: {
      labels: timeAnalytics.map((t) => t.hour),
      datasets: [
        {
          label: "Average Attendance",
          data: timeAnalytics.map((t) => t.avgAttendance),
          backgroundColor: "rgba(153, 102, 255, 0.2)",
          borderColor: "rgba(153, 102, 255, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top" as const,
        },
        title: {
          display: true,
          text: "Peak Attendance Hours",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  };

  // Calculate overall statistics
  const totalSessions = sessions.length;
  const activeSessions = sessions.filter((s) => s.active).length;
  const totalAttendanceRecords = sessions.reduce((sum, session) => {
    return sum + ((session as any).attendanceRecords?.length || 0);
  }, 0);
  const totalPresentRecords = sessions.reduce((sum, session) => {
    const records = (session as any).attendanceRecords || [];
    return sum + records.filter((r: any) => r.status === "present").length;
  }, 0);
  const overallAttendanceRate =
    totalAttendanceRecords > 0
      ? (totalPresentRecords / totalAttendanceRecords) * 100
      : 0;

  const exportAnalytics = () => {
    const csvContent = [
      ["Metric", "Value"],
      ["Total Sessions", totalSessions.toString()],
      ["Active Sessions", activeSessions.toString()],
      ["Overall Attendance Rate", `${overallAttendanceRate.toFixed(1)}%`],
      ["Total Attendance Records", totalAttendanceRecords.toString()],
      ["", ""],
      ["Class Analytics", ""],
      ["Class Name", "Sessions", "Avg Attendance", "Attendance Rate"],
      ...classAnalytics.map((c) => [
        c.className,
        c.totalSessions.toString(),
        c.avgAttendance.toFixed(1),
        `${c.attendanceRate.toFixed(1)}%`,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analytics-report.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Layout title="Analytics" subtitle="View detailed analytics and reports">
        <div className="p-4 lg:p-6 w-full max-w-none">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Analytics" subtitle="View detailed analytics and reports">
      <div className="p-4 lg:p-6 w-full max-w-none">
        <div className="space-y-6">
          {/* Filters */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-xl flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Filters
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                  <Button
                    onClick={exportAnalytics}
                    className="bg-gray-900 hover:bg-gray-800"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="dateFrom">From Date</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) =>
                      handleFilterChange("dateFrom", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="dateTo">To Date</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) =>
                      handleFilterChange("dateTo", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label>Class</Label>
                  <Select
                    value={filters.classFilter}
                    onValueChange={(value) =>
                      handleFilterChange("classFilter", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {Array.from(
                        new Set(sessions.map((s) => s.className))
                      ).map((className) => (
                        <SelectItem key={className} value={className}>
                          {className}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Sessions
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {totalSessions}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Active Sessions
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {activeSessions}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Overall Attendance
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        overallAttendanceRate >= 80
                          ? "text-green-600"
                          : overallAttendanceRate >= 60
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {overallAttendanceRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-50 flex items-center justify-center">
                    <Target className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Records
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {totalAttendanceRecords}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center">
                    <Users className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Trend */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Attendance Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Line {...attendanceTrendConfig} />
                </div>
              </CardContent>
            </Card>

            {/* Class Analytics */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Class Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Bar {...classAnalyticsConfig} />
                </div>
              </CardContent>
            </Card>

            {/* Time Analytics */}
            <Card className="border-0 shadow-sm lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Peak Hours Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Bar {...timeAnalyticsConfig} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Class Details Table */}
          {classAnalytics.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="w-5 h-5 mr-2" />
                  Class Performance Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="pb-3 font-medium text-gray-900">
                          Class
                        </th>
                        <th className="pb-3 font-medium text-gray-900">
                          Sessions
                        </th>
                        <th className="pb-3 font-medium text-gray-900">
                          Avg Attendance
                        </th>
                        <th className="pb-3 font-medium text-gray-900">
                          Total Attendees
                        </th>
                        <th className="pb-3 font-medium text-gray-900">Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {classAnalytics.map((classData, index) => (
                        <tr key={index}>
                          <td className="py-3 font-medium text-gray-900">
                            {classData.className}
                          </td>
                          <td className="py-3 text-gray-600">
                            {classData.totalSessions}
                          </td>
                          <td className="py-3 text-gray-600">
                            {classData.avgAttendance.toFixed(1)}
                          </td>
                          <td className="py-3 text-gray-600">
                            {classData.totalAttendees}
                          </td>
                          <td className="py-3">
                            <Badge
                              className={
                                classData.attendanceRate >= 80
                                  ? "bg-green-100 text-green-800"
                                  : classData.attendanceRate >= 60
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {classData.attendanceRate.toFixed(1)}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
