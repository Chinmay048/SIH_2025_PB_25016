import type { ClassData, FormData } from "./types";

interface SessionDetailsProps {
  selectedClass: ClassData;
  formData: FormData;
  onFormDataChange: (formData: FormData) => void;
  onGetCurrentLocation: () => void;
}

export const SessionDetails = ({
  selectedClass,
  formData,
  onFormDataChange,
  onGetCurrentLocation,
}: SessionDetailsProps) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">
        Step 2: Session Details - {selectedClass.title}
      </h3>
      <div className="space-y-6">
        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Duration (minutes)
          </label>
          <input
            type="number"
            value={formData.duration}
            onChange={(e) =>
              onFormDataChange({
                ...formData,
                duration: parseInt(e.target.value),
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            min="15"
            max="180"
            required
          />
        </div>

        {/* Geofence Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Location (Geofence)
          </label>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={formData.geofence.lat}
              onChange={(e) =>
                onFormDataChange({
                  ...formData,
                  geofence: {
                    ...formData.geofence,
                    lat: parseFloat(e.target.value) || 0,
                  },
                })
              }
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              required
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={formData.geofence.lon}
              onChange={(e) =>
                onFormDataChange({
                  ...formData,
                  geofence: {
                    ...formData.geofence,
                    lon: parseFloat(e.target.value) || 0,
                  },
                })
              }
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              required
            />
          </div>
          <div className="mt-2 flex items-center space-x-4">
            <button
              type="button"
              onClick={onGetCurrentLocation}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              📍 Use Current Location
            </button>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-700">Radius:</label>
              <input
                type="number"
                value={formData.geofence.radius}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    geofence: {
                      ...formData.geofence,
                      radius: parseInt(e.target.value) || 50,
                    },
                  })
                }
                className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900"
                min="10"
                max="500"
              />
              <span className="text-sm text-gray-500">meters</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
