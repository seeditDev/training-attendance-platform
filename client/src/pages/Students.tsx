import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { studentService } from "@/lib/firebaseService";
import { Student, DEPARTMENTS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Edit2, Upload, Download } from "lucide-react";
import { toast } from "sonner";

export default function Students() {
  const { isAuthenticated } = useAuthStore();
  const [, navigate] = useLocation();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    registrationNo: "",
    rollNo: "",
    name: "",
    department: "",
    academicYear: "",
    batch: "",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    loadStudents();
  }, [isAuthenticated, navigate]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await studentService.getAll();
      setStudents(data);
    } catch (error) {
      console.error("Error loading students:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.registrationNo || !formData.name || !formData.department) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const studentData = {
        registrationNo: formData.registrationNo,
        rollNo: formData.rollNo,
        name: formData.name,
        department: formData.department,
        academicYear: formData.academicYear,
        batch: formData.batch,
      };

      if (editingId) {
        await studentService.update(editingId, studentData);
        toast.success("Student updated successfully");
      } else {
        await studentService.create(studentData);
        toast.success("Student added successfully");
      }

      setDialogOpen(false);
      setEditingId(null);
      setFormData({
        registrationNo: "",
        rollNo: "",
        name: "",
        department: "",
        academicYear: "",
        batch: "",
      });
      loadStudents();
    } catch (error) {
      console.error("Error saving student:", error);
      toast.error("Failed to save student");
    }
  };

  const handleEdit = (student: Student) => {
    setFormData({
      registrationNo: student.registrationNo,
      rollNo: student.rollNo,
      name: student.name,
      department: student.department,
      academicYear: student.academicYear,
      batch: student.batch || "",
    });
    setEditingId(student.id);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await studentService.delete(deleteId);
      toast.success("Student deleted successfully");
      setDeleteId(null);
      loadStudents();
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Failed to delete student");
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.registrationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Students</h1>
            <p className="text-slate-600 mt-2">Manage student master list</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      registrationNo: "",
                      rollNo: "",
                      name: "",
                      department: "",
                      academicYear: "",
                      batch: "",
                    });
                  }}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Edit Student" : "Add New Student"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingId
                      ? "Update student information"
                      : "Add a new student to the master list"}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Registration No *
                      </label>
                      <Input
                        value={formData.registrationNo}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            registrationNo: e.target.value,
                          })
                        }
                        placeholder="e.g., 727821TCS001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Roll No
                      </label>
                      <Input
                        value={formData.rollNo}
                        onChange={(e) =>
                          setFormData({ ...formData, rollNo: e.target.value })
                        }
                        placeholder="e.g., 21CS001"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Name *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Student name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Department *
                      </label>
                      <select
                        value={formData.department}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            department: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Department</option>
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Academic Year
                      </label>
                      <Input
                        value={formData.academicYear}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            academicYear: e.target.value,
                          })
                        }
                        placeholder="e.g., 2027"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Batch
                    </label>
                    <Input
                      value={formData.batch}
                      onChange={(e) =>
                        setFormData({ ...formData, batch: e.target.value })
                      }
                      placeholder="e.g., Batch A"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 justify-end pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      {editingId ? "Update Student" : "Add Student"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
        <div>
          <Input
            placeholder="Search by name, registration no, or roll no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Students Table */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Loading students...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <Card className="bg-white border-slate-200 p-12 text-center">
            <p className="text-slate-600 mb-4">
              {searchTerm ? "No students found" : "No students yet"}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setDialogOpen(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Add First Student
              </Button>
            )}
          </Card>
        ) : (
          <Card className="bg-white border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">
                      Registration No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">
                      Roll No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">
                      Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">
                      Batch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                        {student.registrationNo}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {student.rollNo}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {student.department}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {student.academicYear}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {student.batch || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEdit(student)}
                            variant="outline"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => setDeleteId(student.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Student?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. All attendance records for this student
                will be affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3 justify-end">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
