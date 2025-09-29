import type { ClassData, FormData } from "./types";
import { Button } from "../ui/button";

interface SessionSummaryProps {
  selectedClass: ClassData;
  formData: FormData;
  onSubmit: (e: React.FormEvent) => void;
}

export const SessionSummary = ({
  selectedClass,
  formData,
  onSubmit,
}: SessionSummaryProps) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Step 3: Create Session</h3>
      <form onSubmit={onSubmit}>
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <h4 className="font-medium text-gray-900">Session Summary</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <strong>Class:</strong> {selectedClass.title} (
              {selectedClass.semester})
            </p>
            <p>
              <strong>Duration:</strong> {formData.duration} minutes
            </p>
            <p>
              <strong>Location:</strong> {formData.geofence.lat.toFixed(6)},{" "}
              {formData.geofence.lon.toFixed(6)} (±{formData.geofence.radius}m)
            </p>
            <p>
              <strong>Start Time:</strong> {new Date().toLocaleString()}
            </p>
            <p>
              <strong>End Time:</strong>{" "}
              {new Date(
                Date.now() + formData.duration * 60000
              ).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button type="submit" className="bg-green-600 hover:bg-green-700">
            🚀 Create & Start Session
          </Button>
        </div>
      </form>
    </div>
  );
};
