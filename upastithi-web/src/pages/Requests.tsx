import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  updateDoc,
  Timestamp,
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
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import {
  FileText,
  Search,
  Filter,
  Clock,
  User,
  MapPin,
  Camera,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  Download,
} from "lucide-react";
import type {
  AttendanceRequest,
  RequestFilters,
  RequestStats,
} from "../components/requests/types";

const Requests = () => {
  const [requests, setRequests] = useState<AttendanceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AttendanceRequest[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] =
    useState<AttendanceRequest | null>(null);
  const [reviewComments, setReviewComments] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [stats, setStats] = useState<RequestStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    byType: {
      face_match_failed: 0,
      location_issue: 0,
      technical_error: 0,
      other: 0,
    },
  });

  const [filters, setFilters] = useState<RequestFilters>({
    status: "all",
    requestType: "all",
    dateFrom: "",
    dateTo: "",
    searchQuery: "",
    className: "all",
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    applyFilters();
    calculateStats();
  }, [requests, filters]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }

      const requestsQuery = query(
        collection(db, "attendanceRequests"),
        where("facultyId", "==", user.uid),
        orderBy("submittedAt", "desc")
      );

      const requestsSnap = await getDocs(requestsQuery);
      const requestsList: AttendanceRequest[] = [];

      requestsSnap.forEach((doc) => {
        const data = doc.data();
        requestsList.push({
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt.toDate(),
          reviewedAt: data.reviewedAt?.toDate(),
          originalAttendanceAttempt: data.originalAttendanceAttempt
            ? {
                ...data.originalAttendanceAttempt,
                timestamp: data.originalAttendanceAttempt.timestamp.toDate(),
              }
            : undefined,
        } as AttendanceRequest);
      });

      setRequests(requestsList);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...requests];

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((req) => req.status === filters.status);
    }

    // Request type filter
    if (filters.requestType !== "all") {
      filtered = filtered.filter(
        (req) => req.requestType === filters.requestType
      );
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter((req) => req.submittedAt >= fromDate);
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((req) => req.submittedAt <= toDate);
    }

    // Class filter
    if (filters.className !== "all") {
      filtered = filtered.filter((req) => req.className === filters.className);
    }

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.studentName.toLowerCase().includes(query) ||
          req.studentEmail.toLowerCase().includes(query) ||
          req.sessionName.toLowerCase().includes(query) ||
          req.description.toLowerCase().includes(query)
      );
    }

    setFilteredRequests(filtered);
  };

  const calculateStats = () => {
    const newStats: RequestStats = {
      total: requests.length,
      pending: requests.filter((r) => r.status === "pending").length,
      approved: requests.filter((r) => r.status === "approved").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
      byType: {
        face_match_failed: requests.filter(
          (r) => r.requestType === "face_match_failed"
        ).length,
        location_issue: requests.filter(
          (r) => r.requestType === "location_issue"
        ).length,
        technical_error: requests.filter(
          (r) => r.requestType === "technical_error"
        ).length,
        other: requests.filter((r) => r.requestType === "other").length,
      },
    };
    setStats(newStats);
  };

  const handleFilterChange = (key: keyof RequestFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: "all",
      requestType: "all",
      dateFrom: "",
      dateTo: "",
      searchQuery: "",
      className: "all",
    });
  };

  const handleApproveRequest = async (requestId: string) => {
    setSubmittingReview(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      await updateDoc(doc(db, "attendanceRequests", requestId), {
        status: "approved",
        reviewedAt: Timestamp.now(),
        reviewedBy: user.uid,
        reviewComments,
      });

      // Also mark the student as present for this session
      const request = requests.find((r) => r.id === requestId);
      if (request) {
        await updateDoc(
          doc(db, "attendance", request.sessionId + "_" + request.studentId),
          {
            status: "present",
            timestamp: Timestamp.now(),
            location: request.location || { lat: 0, lon: 0 },
            approvedManually: true,
            approvedBy: user.uid,
            originalRequestId: requestId,
          }
        );
      }

      await fetchRequests();
      setSelectedRequest(null);
      setReviewComments("");
    } catch (error) {
      console.error("Error approving request:", error);
    }
    setSubmittingReview(false);
  };

  const handleRejectRequest = async (requestId: string) => {
    setSubmittingReview(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      await updateDoc(doc(db, "attendanceRequests", requestId), {
        status: "rejected",
        reviewedAt: Timestamp.now(),
        reviewedBy: user.uid,
        reviewComments,
      });

      await fetchRequests();
      setSelectedRequest(null);
      setReviewComments("");
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
    setSubmittingReview(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="default" className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="default" className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case "face_match_failed":
        return <Camera className="w-4 h-4" />;
      case "location_issue":
        return <MapPin className="w-4 h-4" />;
      case "technical_error":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case "face_match_failed":
        return "Face Match Failed";
      case "location_issue":
        return "Location Issue";
      case "technical_error":
        return "Technical Error";
      case "other":
        return "Other Issue";
      default:
        return type;
    }
  };

  const exportRequests = () => {
    const csvContent = [
      [
        "Student Name",
        "Email",
        "Session",
        "Class",
        "Type",
        "Status",
        "Submitted",
        "Description",
      ],
      ...filteredRequests.map((req) => [
        req.studentName,
        req.studentEmail,
        req.sessionName,
        req.className,
        getRequestTypeLabel(req.requestType),
        req.status.toUpperCase(),
        req.submittedAt.toLocaleDateString(),
        req.description.replace(/,/g, ";"), // Replace commas to avoid CSV issues
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "attendance-requests.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Layout
        title="Attendance Requests"
        subtitle="Review and manage student attendance requests"
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
      title="Attendance Requests"
      subtitle="Review and manage student attendance requests"
    >
      <div className="p-4 lg:p-6 w-full max-w-none">
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Requests
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.total}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Pending Review
                    </p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {stats.pending}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-yellow-50 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Approved
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.approved}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Rejected
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {stats.rejected}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
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
                    onClick={exportRequests}
                    className="bg-gray-900 hover:bg-gray-800"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                {/* Search */}
                <div className="lg:col-span-2">
                  <Label htmlFor="search">Search Requests</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search by student name, email, or description..."
                      value={filters.searchQuery}
                      onChange={(e) =>
                        handleFilterChange("searchQuery", e.target.value)
                      }
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <Label>Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) =>
                      handleFilterChange("status", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Type Filter */}
                <div>
                  <Label>Request Type</Label>
                  <Select
                    value={filters.requestType}
                    onValueChange={(value) =>
                      handleFilterChange("requestType", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="face_match_failed">
                        Face Match Failed
                      </SelectItem>
                      <SelectItem value="location_issue">
                        Location Issue
                      </SelectItem>
                      <SelectItem value="technical_error">
                        Technical Error
                      </SelectItem>
                      <SelectItem value="other">Other Issue</SelectItem>
                    </SelectContent>
                  </Select>
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
              </div>

              {/* Results Summary */}
              <div className="pt-2 border-t">
                <p className="text-sm text-gray-600">
                  Showing {filteredRequests.length} of {requests.length}{" "}
                  requests
                  {requests.length !== filteredRequests.length &&
                    ` (filtered from ${requests.length} total)`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Requests List */}
          {filteredRequests.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 mb-4">
                  No requests found matching your criteria.
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <Card
                  key={request.id}
                  className="border-0 shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Request Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            {getRequestTypeIcon(request.requestType)}
                            <span className="ml-2">{request.studentName}</span>
                          </h3>
                          {getStatusBadge(request.status)}
                          <Badge variant="outline" className="text-xs">
                            {getRequestTypeLabel(request.requestType)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            {request.studentEmail}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            {request.sessionName}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            {request.submittedAt.toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 mr-2" />
                            {request.className}
                          </div>
                        </div>

                        <p className="text-sm text-gray-700 line-clamp-2">
                          {request.description}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedRequest(request)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center">
                                {getRequestTypeIcon(request.requestType)}
                                <span className="ml-2">Request Details</span>
                              </DialogTitle>
                              <DialogDescription>
                                Review and manage this attendance request
                              </DialogDescription>
                            </DialogHeader>

                            {selectedRequest && (
                              <div className="space-y-6">
                                {/* Student Info */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Student Name
                                    </Label>
                                    <p className="text-sm text-gray-700">
                                      {selectedRequest.studentName}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Email
                                    </Label>
                                    <p className="text-sm text-gray-700">
                                      {selectedRequest.studentEmail}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Session
                                    </Label>
                                    <p className="text-sm text-gray-700">
                                      {selectedRequest.sessionName}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Class
                                    </Label>
                                    <p className="text-sm text-gray-700">
                                      {selectedRequest.className}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Request Type
                                    </Label>
                                    <p className="text-sm text-gray-700">
                                      {getRequestTypeLabel(
                                        selectedRequest.requestType
                                      )}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Status
                                    </Label>
                                    {getStatusBadge(selectedRequest.status)}
                                  </div>
                                </div>

                                {/* Description */}
                                <div>
                                  <Label className="text-sm font-medium">
                                    Description
                                  </Label>
                                  <p className="text-sm text-gray-700 mt-1 p-3 bg-gray-50 rounded-md">
                                    {selectedRequest.description}
                                  </p>
                                </div>

                                {/* Location Info */}
                                {selectedRequest.location && (
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Student Location
                                    </Label>
                                    <p className="text-sm text-gray-700">
                                      Lat:{" "}
                                      {selectedRequest.location.lat.toFixed(6)},
                                      Lon:{" "}
                                      {selectedRequest.location.lon.toFixed(6)}
                                      {selectedRequest.location.accuracy &&
                                        ` (Accuracy: ±${selectedRequest.location.accuracy}m)`}
                                    </p>
                                  </div>
                                )}

                                {/* Original Attempt Info */}
                                {selectedRequest.originalAttendanceAttempt && (
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Original Attempt
                                    </Label>
                                    <div className="text-sm text-gray-700 mt-1 p-3 bg-red-50 rounded-md">
                                      <p>
                                        <strong>Time:</strong>{" "}
                                        {selectedRequest.originalAttendanceAttempt.timestamp.toLocaleString()}
                                      </p>
                                      <p>
                                        <strong>Error:</strong>{" "}
                                        {
                                          selectedRequest
                                            .originalAttendanceAttempt.error
                                        }
                                      </p>
                                      {selectedRequest.originalAttendanceAttempt
                                        .faceMatchScore && (
                                        <p>
                                          <strong>Face Match Score:</strong>{" "}
                                          {
                                            selectedRequest
                                              .originalAttendanceAttempt
                                              .faceMatchScore
                                          }
                                          %
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Review Section */}
                                {selectedRequest.status === "pending" && (
                                  <div className="space-y-4 border-t pt-4">
                                    <Label htmlFor="reviewComments">
                                      Review Comments (Optional)
                                    </Label>
                                    <Textarea
                                      id="reviewComments"
                                      placeholder="Add any comments about your decision..."
                                      value={reviewComments}
                                      onChange={(e) =>
                                        setReviewComments(e.target.value)
                                      }
                                      rows={3}
                                    />
                                  </div>
                                )}

                                {/* Review Info */}
                                {selectedRequest.status !== "pending" && (
                                  <div className="border-t pt-4">
                                    <Label className="text-sm font-medium">
                                      Review Information
                                    </Label>
                                    <div className="text-sm text-gray-700 mt-1">
                                      <p>
                                        <strong>Status:</strong>{" "}
                                        {selectedRequest.status.toUpperCase()}
                                      </p>
                                      <p>
                                        <strong>Reviewed:</strong>{" "}
                                        {selectedRequest.reviewedAt?.toLocaleString()}
                                      </p>
                                      {selectedRequest.reviewComments && (
                                        <div className="mt-2">
                                          <strong>Comments:</strong>
                                          <p className="mt-1 p-2 bg-gray-50 rounded">
                                            {selectedRequest.reviewComments}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            <DialogFooter className="flex gap-2">
                              {selectedRequest?.status === "pending" && (
                                <>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button className="bg-green-600 hover:bg-green-700">
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Approve
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Approve Request
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will approve the attendance
                                          request and mark the student as
                                          present for this session. Are you sure
                                          you want to approve this request?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            selectedRequest &&
                                            handleApproveRequest(
                                              selectedRequest.id
                                            )
                                          }
                                          disabled={submittingReview}
                                        >
                                          {submittingReview
                                            ? "Approving..."
                                            : "Approve Request"}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>

                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className="border-red-300 text-red-600 hover:bg-red-50"
                                      >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Reject Request
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will reject the attendance
                                          request. The student will remain
                                          absent for this session. Are you sure
                                          you want to reject this request?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            selectedRequest &&
                                            handleRejectRequest(
                                              selectedRequest.id
                                            )
                                          }
                                          disabled={submittingReview}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          {submittingReview
                                            ? "Rejecting..."
                                            : "Reject Request"}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </>
                              )}
                              <Button
                                variant="outline"
                                onClick={() => setSelectedRequest(null)}
                              >
                                Close
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        {request.status === "pending" && (
                          <div className="flex gap-1">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Quick Approve
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Approve this request and mark the student as
                                    present?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleApproveRequest(request.id)
                                    }
                                  >
                                    Approve
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-300 text-red-600"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Quick Reject
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Reject this attendance request?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleRejectRequest(request.id)
                                    }
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Reject
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Requests;
