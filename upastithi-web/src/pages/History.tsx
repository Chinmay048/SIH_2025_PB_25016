import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../components/ui/pagination";
import { Badge } from "../components/ui/badge";
import {
  Calendar,
  Clock,
  Users,
  Search,
  Filter,
  MapPin,
  TrendingUp,
  Download,
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { SessionData } from "../components/sessions/types";

interface SessionWithStats extends SessionData {
  totalAttendees: number;
  attendanceRate: number;
}

interface FilterState {
  dateFrom: string;
  dateTo: string;
  classFilter: string;
  statusFilter: string;
  searchQuery: string;
}

const ITEMS_PER_PAGE = 10;

const History = () => {
  const [sessions, setSessions] = useState<SessionWithStats[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<SessionWithStats[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: "",
    dateTo: "",
    classFilter: "all",
    statusFilter: "all",
    searchQuery: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchHistoricalSessions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [sessions, filters]);

  const fetchHistoricalSessions = async () => {
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
        orderBy("startTime", "desc"),
        limit(100) // Fetch more sessions for better filtering
      );

      const sessionsSnap = await getDocs(sessionsQuery);
      const sessionList: SessionWithStats[] = [];

      for (const doc of sessionsSnap.docs) {
        const data = doc.data();
        const sessionData = {
          id: doc.id,
          ...data,
          startTime: data.startTime.toDate(),
          endTime: data.endTime.toDate(),
        } as SessionData;

        // Fetch attendance data for each session
        const attendanceStats = await fetchAttendanceStats(doc.id);

        sessionList.push({
          ...sessionData,
          totalAttendees: attendanceStats.totalAttendees,
          attendanceRate: attendanceStats.attendanceRate,
        });
      }

      setSessions(sessionList);
    } catch (error) {
      console.error("Error fetching historical sessions:", error);
    }
    setLoading(false);
  };

  const fetchAttendanceStats = async (sessionId: string) => {
    try {
      const attendanceQuery = query(
        collection(db, "attendance"),
        where("sessionId", "==", sessionId)
      );

      const attendanceSnap = await getDocs(attendanceQuery);
      const totalAttendees = attendanceSnap.size;
      const presentCount = attendanceSnap.docs.filter(
        (doc) => doc.data().status === "present"
      ).length;

      return {
        totalAttendees,
        attendanceRate:
          totalAttendees > 0 ? (presentCount / totalAttendees) * 100 : 0,
      };
    } catch (error) {
      console.error("Error fetching attendance stats:", error);
      return { totalAttendees: 0, attendanceRate: 0 };
    }
  };

  const applyFilters = () => {
    let filtered = [...sessions];

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter((session) => session.startTime >= fromDate);
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter((session) => session.startTime <= toDate);
    }

    // Class filter
    if (filters.classFilter !== "all") {
      filtered = filtered.filter(
        (session) => session.classId === filters.classFilter
      );
    }

    // Status filter
    if (filters.statusFilter !== "all") {
      const isActive = filters.statusFilter === "active";
      filtered = filtered.filter((session) => session.active === isActive);
    }

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (session) =>
          session.className.toLowerCase().includes(query) ||
          session.sessionCode?.toLowerCase().includes(query)
      );
    }

    setFilteredSessions(filtered);
    setCurrentPage(1);
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      classFilter: "all",
      statusFilter: "all",
      searchQuery: "",
    });
  };

  const exportToCSV = () => {
    const csvContent = [
      [
        "Session Code",
        "Class",
        "Date",
        "Duration",
        "Status",
        "Attendees",
        "Attendance Rate",
      ],
      ...filteredSessions.map((session) => [
        session.sessionCode || "",
        session.className,
        session.startTime.toLocaleDateString(),
        `${session.duration} min`,
        session.active ? "Active" : "Completed",
        session.totalAttendees.toString(),
        `${session.attendanceRate.toFixed(1)}%`,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "session-history.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredSessions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedSessions = filteredSessions.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const getStatusBadge = (session: SessionWithStats) => {
    if (session.active) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-600">
        <XCircle className="w-3 h-3 mr-1" />
        Completed
      </Badge>
    );
  };

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <Layout
        title="Session History"
        subtitle="View and analyze past attendance sessions"
      >
        <div className="p-4 lg:p-6 w-full max-w-none">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Session History"
      subtitle="View and analyze past attendance sessions"
    >
      <div className="p-4 lg:p-6 w-full max-w-none">
        <div className="space-y-6">
          {/* Filters and Actions */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-xl flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Filters & Search
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                  <Button
                    onClick={exportToCSV}
                    className="bg-gray-900 hover:bg-gray-800"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search */}
                <div className="lg:col-span-2">
                  <Label htmlFor="search">Search Sessions</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search by class name or session code..."
                      value={filters.searchQuery}
                      onChange={(e) =>
                        handleFilterChange("searchQuery", e.target.value)
                      }
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Date From */}
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

                {/* Date To */}
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

                {/* Status Filter */}
                <div>
                  <Label>Status</Label>
                  <Select
                    value={filters.statusFilter}
                    onValueChange={(value) =>
                      handleFilterChange("statusFilter", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Results Summary */}
              <div className="pt-2 border-t">
                <p className="text-sm text-gray-600">
                  Showing {paginatedSessions.length} of{" "}
                  {filteredSessions.length} sessions
                  {sessions.length !== filteredSessions.length &&
                    ` (filtered from ${sessions.length} total)`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sessions List */}
          {filteredSessions.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 mb-4">
                  No sessions found matching your criteria.
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {paginatedSessions.map((session) => (
                <Card
                  key={session.id}
                  className="border-0 shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Session Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {session.className}
                          </h3>
                          {getStatusBadge(session)}
                          {session.sessionCode && (
                            <Badge variant="outline" className="text-xs">
                              {session.sessionCode}
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            {session.startTime.toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            {session.startTime.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            ({session.duration}m)
                          </div>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            {session.totalAttendees} attendees
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            {session.geofence.radius}m radius
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">
                            Attendance Rate
                          </div>
                          <div
                            className={`text-2xl font-bold ${getAttendanceRateColor(
                              session.attendanceRate
                            )}`}
                          >
                            {session.attendanceRate.toFixed(1)}%
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(`/sessions/${session.id}/details`)
                            }
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(`/analytics?session=${session.id}`)
                            }
                          >
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Analytics
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center pt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            setCurrentPage(Math.max(1, currentPage - 1))
                          }
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>

                      {/* Page Numbers */}
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          const pageNum = i + 1;
                          if (totalPages <= 5) {
                            return (
                              <PaginationItem key={pageNum}>
                                <PaginationLink
                                  onClick={() => setCurrentPage(pageNum)}
                                  isActive={currentPage === pageNum}
                                  className="cursor-pointer"
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }
                          return null;
                        }
                      )}

                      {totalPages > 5 && <PaginationEllipsis />}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setCurrentPage(
                              Math.min(totalPages, currentPage + 1)
                            )
                          }
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default History;
