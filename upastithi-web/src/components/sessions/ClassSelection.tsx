import type { ClassData } from "./types";
import { Card, CardContent } from "../ui/card";
import { Users } from "lucide-react";

interface ClassSelectionProps {
  classes: ClassData[];
  onClassSelect: (classData: ClassData) => void;
}

export const ClassSelection = ({
  classes,
  onClassSelect,
}: ClassSelectionProps) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Step 1: Select Class</h3>
      <div className="grid gap-4">
        {classes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No classes assigned. Contact admin to assign classes.</p>
          </div>
        ) : (
          classes.map((cls) => (
            <Card
              key={cls.id}
              className="cursor-pointer hover:shadow-md transition-shadow border-gray-200"
              onClick={() => onClassSelect(cls)}
            >
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {cls.title}
                </h4>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Semester: {cls.semester}</span>
                  <span className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    Class Available
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
