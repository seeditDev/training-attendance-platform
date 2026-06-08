import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { trainingService } from "@/lib/firebaseService";
import { Training, Session } from "@/lib/types";
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
import { Plus, Trash2, Edit2, Calendar, Users } from "lucide-react";
import { toast } from "sonner";

export default function Trainings() {
  const { isAuthenticated } = useAuthStore();
  const [, navigate] = useLocation();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    type: string;
    academicYear: string;
    startDate: string;
    endDate: string;
    status: "active" | "completed" | "draft";
    description: string;
    sessions: Session[];
  }>({
    name: "",
    type: "",
    academicYear: "",
    startDate: "",
    endDate: "",
    status: "active",
    description: "",
    sessions: [{ id: "1", name: "Session 1", order: 1 }],
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    loadTrainings();
  }, [isAuthenticated, navigate]);

  const loadTrainings = async () => {
    try {
      setLoading(true);
      const data = await trainingService.getAll();
      setTrainings(data);
    } catch (error) {
      console.error("Error loading trainings:", error);
      toast.error("Failed to load trainings");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSession = () => {
    const newOrder = Math.max(...formData.sessions.map((s) => s.order), 0) + 1;
    setFormData({
      ...formData,
      sessions: [
        ...formData.sessions,
        { id: Date.now().toString(), name: `Session ${newOrder}`, order: newOrder },
      ],
    });
  };

  const handleRemoveSession = (id: string) => {
    setFormData({
      ...formData,
      sessions: formData.sessions.filter((s) => s.id !== id),
    });
  };

  const handleUpdateSession = (id: string, name: string) => {
    setFormData({
      ...formData,
      sessions: formData.sessions.map((s) =>
        s.id === id ? { ...s, name } : s
      ),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.type || !formData.academicYear) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const trainingData = {
        name: formData.name,
        type: formData.type,
        academicYear: formData.academicYear,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        status: formData.status,
        description: formData.description,
        sessions: formData.sessions,
      };

      if (editingId) {
        await trainingService.update(editingId, trainingData);
        toast.success("Training updated successfully");
      } else {
        await trainingService.create(trainingData);
        toast.success("Training created successfully");
      }

      setDialogOpen(false);
      setEditingId(null);
      setFormData({
        name: "",
        type: "",
        academicYear: "",
        startDate: "",
        endDate: "",
        status: "active" as const,
        description: "",
        sessions: [{ id: "1", name: "Session 1", order: 1 }],
      });
      loadTrainings();
    } catch (error) {
      console.error("Error saving training:", error);
      toast.error("Failed to save training");
    }
  };

  const handleEdit = (training: Training) => {
    setFormData({
      name: training.name,
      type: training.type,
      academicYear: training.academicYear,
      startDate: training.startDate.toISOString().split("T")[0],
      endDate: training.endDate.toISOString().split("T")[0],
      status: training.status,
      description: training.description || "",
      sessions: training.sessions,
    });
    setEditingId(training.id);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await trainingService.delete(deleteId);
      toast.success("Training deleted successfully");
      setDeleteId(null);
      loadTrainings();
    } catch (error) {
      console.error("Error deleting training:", error);
      toast.error("Failed to delete training");
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Training Programs</h1>
            <p className="text-slate-600 mt-2">Manage all training programs and sessions</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    name: "",
                    type: "",
                    academicYear: "",
                    startDate: "",
                    endDate: "",
                    status: "active" as const,
                    description: "",
                    sessions: [{ id: "1", name: "Session 1", order: 1 }],
                  });
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Training
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Edit Training" : "Create New Training"}
                </DialogTitle>
                <DialogDescription>
                  {editingId
                    ? "Update the training program details"
                    : "Create a new training program with sessions"}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Training Name *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g., Summer Training 2027"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Type *
                    </label>
                    <Input
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      placeholder="e.g., Technical, Aptitude"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Academic Year *
                    </label>
                    <Input
                      value={formData.academicYear}
                      onChange={(e) =>
                        setFormData({ ...formData, academicYear: e.target.value })
                      }
                      placeholder="e.g., 2027"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "active" || value === "completed" || value === "draft") {
                          setFormData({
                            ...formData,
                            status: value,
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      End Date
                    </label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Optional description"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                {/* Sessions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-slate-700">
                      Sessions
                    </label>
                    <Button
                      type="button"
                      onClick={handleAddSession}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Session
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.sessions.map((session) => (
                      <div key={session.id} className="flex gap-2">
                        <Input
                          value={session.name}
                          onChange={(e) =>
                            handleUpdateSession(session.id, e.target.value)
                          }
                          placeholder="Session name"
                        />
                        {formData.sessions.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => handleRemoveSession(session.id)}
                            variant="outline"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
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
                    {editingId ? "Update Training" : "Create Training"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Trainings List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Loading trainings...</p>
          </div>
        ) : trainings.length === 0 ? (
          <Card className="bg-white border-slate-200 p-12 text-center">
            <p className="text-slate-600 mb-4">No training programs yet</p>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Create First Training
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {trainings.map((training) => (
              <Card
                key={training.id}
                className="bg-white border-slate-200 hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {training.name}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {training.type} • {training.academicYear}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        training.status === "active"
                          ? "bg-green-100 text-green-800"
                          : training.status === "completed"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {training.status}
                    </span>
                  </div>

                  {training.description && (
                    <p className="text-sm text-slate-600 mb-4">
                      {training.description}
                    </p>
                  )}

                  <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-y border-slate-200">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600">
                        {training.startDate.toLocaleDateString()} -{" "}
                        {training.endDate.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600">
                        {training.sessions.length} sessions
                      </span>
                    </div>
                  </div>

                  {/* Sessions Display */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-slate-600 mb-2">
                      Sessions:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {training.sessions.map((session) => (
                        <span
                          key={session.id}
                          className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs"
                        >
                          {session.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(training)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => setDeleteId(training.id)}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Training?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. All associated attendance records will be
                affected.
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
