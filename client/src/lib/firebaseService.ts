import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  Training,
  Student,
  Attendance,
  AttendanceSummary,
  Session,
} from "./types";

/**
 * Training Service
 */
export const trainingService = {
  async create(training: Omit<Training, "id" | "createdAt" | "updatedAt">) {
    const docRef = await addDoc(collection(db, "trainings"), {
      ...training,
      startDate: Timestamp.fromDate(training.startDate),
      endDate: Timestamp.fromDate(training.endDate),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async getAll(): Promise<Training[]> {
    const q = query(
      collection(db, "trainings"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate.toDate(),
      endDate: doc.data().endDate.toDate(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as Training[];
  },

  async getById(id: string): Promise<Training | null> {
    const docRef = doc(db, "trainings", id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    return {
      id: snapshot.id,
      ...data,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as Training;
  },

  async update(id: string, updates: Partial<Training>) {
    const docRef = doc(db, "trainings", id);
    const updateData: any = { ...updates };
    if (updates.startDate) {
      updateData.startDate = Timestamp.fromDate(updates.startDate);
    }
    if (updates.endDate) {
      updateData.endDate = Timestamp.fromDate(updates.endDate);
    }
    updateData.updatedAt = Timestamp.now();
    await updateDoc(docRef, updateData);
  },

  async delete(id: string) {
    await deleteDoc(doc(db, "trainings", id));
  },
};

/**
 * Student Service
 */
export const studentService = {
  async create(student: Omit<Student, "id" | "createdAt" | "updatedAt">) {
    const docRef = await addDoc(collection(db, "students"), {
      ...student,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async getAll(): Promise<Student[]> {
    const q = query(
      collection(db, "students"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as Student[];
  },

  async getById(id: string): Promise<Student | null> {
    const docRef = doc(db, "students", id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    return {
      id: snapshot.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as Student;
  },

  async getByTraining(trainingId: string): Promise<Student[]> {
    // Get attendance records for this training
    const attendanceQuery = query(
      collection(db, "attendance"),
      where("trainingId", "==", trainingId)
    );
    const attendanceSnapshot = await getDocs(attendanceQuery);
    const studentIds = new Set(
      attendanceSnapshot.docs.map((doc) => doc.data().studentId)
    );

    // Get all students and filter by those in the training
    const allStudents = await this.getAll();
    return allStudents.filter((student) => studentIds.has(student.id));
  },

  async update(id: string, updates: Partial<Student>) {
    const docRef = doc(db, "students", id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  async delete(id: string) {
    await deleteDoc(doc(db, "students", id));
  },

  async bulkCreate(students: Omit<Student, "id" | "createdAt" | "updatedAt">[]) {
    const batch = writeBatch(db);
    const studentsRef = collection(db, "students");

    students.forEach((student) => {
      const docRef = doc(studentsRef);
      batch.set(docRef, {
        ...student,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    });

    await batch.commit();
  },
};

/**
 * Attendance Service
 */
export const attendanceService = {
  async create(attendance: Omit<Attendance, "id" | "createdAt" | "updatedAt">) {
    const docRef = await addDoc(collection(db, "attendance"), {
      ...attendance,
      date: Timestamp.fromDate(attendance.date),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async getByDateAndTraining(
    trainingId: string,
    date: Date
  ): Promise<Attendance[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, "attendance"),
      where("trainingId", "==", trainingId),
      where("date", ">=", Timestamp.fromDate(startOfDay)),
      where("date", "<=", Timestamp.fromDate(endOfDay))
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as Attendance[];
  },

  async getByTraining(trainingId: string): Promise<Attendance[]> {
    const q = query(
      collection(db, "attendance"),
      where("trainingId", "==", trainingId),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as Attendance[];
  },

  async getByStudent(studentId: string): Promise<Attendance[]> {
    const q = query(
      collection(db, "attendance"),
      where("studentId", "==", studentId),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as Attendance[];
  },

  async update(id: string, updates: Partial<Attendance>) {
    const docRef = doc(db, "attendance", id);
    const updateData: any = { ...updates };
    if (updates.date) {
      updateData.date = Timestamp.fromDate(updates.date);
    }
    updateData.updatedAt = Timestamp.now();
    await updateDoc(docRef, updateData);
  },

  async delete(id: string) {
    await deleteDoc(doc(db, "attendance", id));
  },

  async bulkUpsert(attendanceRecords: Attendance[]) {
    const batch = writeBatch(db);
    const attendanceRef = collection(db, "attendance");

    attendanceRecords.forEach((record) => {
      const dateStr = record.date.toISOString().split("T")[0];
      const docId = `${record.trainingId}-${record.studentId}-${dateStr}-${record.sessionId}`;
      const docRef = doc(attendanceRef, docId);
      batch.set(
        docRef,
        {
          ...record,
          date: Timestamp.fromDate(record.date),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      );
    });

    await batch.commit();
  },

  async getHistoryByTraining(
    trainingId: string,
    limit: number = 100
  ): Promise<{ date: Date; count: number }[]> {
    const q = query(
      collection(db, "attendance"),
      where("trainingId", "==", trainingId),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);

    const dateMap = new Map<string, number>();
    snapshot.docs.forEach((doc) => {
      const dateStr = doc.data().date.toDate().toISOString().split("T")[0];
      dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
    });

    return Array.from(dateMap.entries())
      .map(([dateStr, count]) => ({
        date: new Date(dateStr),
        count,
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
  },
};

/**
 * Analytics Service
 */
export const analyticsService = {
  async getAttendanceSummary(
    trainingId: string,
    studentId: string
  ): Promise<AttendanceSummary | null> {
    const q = query(
      collection(db, "attendance"),
      where("trainingId", "==", trainingId),
      where("studentId", "==", studentId)
    );

    const snapshot = await getDocs(q);
    const records = snapshot.docs.map((doc) => doc.data());

    if (records.length === 0) {
      return null;
    }

    const totalSessions = records.length;
    const presentCount = records.filter((r) => r.status === "present").length;
    const absentCount = records.filter((r) => r.status === "absent").length;
    const odCount = records.filter((r) => r.status === "od").length;
    const driveCount = records.filter((r) => r.status === "drive").length;

    return {
      trainingId,
      studentId,
      totalSessions,
      presentCount,
      absentCount,
      odCount,
      driveCount,
      attendancePercentage:
        totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0,
    };
  },

  async getTrainingStats(trainingId: string) {
    const training = await trainingService.getById(trainingId);
    if (!training) return null;

    const attendanceRecords = await attendanceService.getByTraining(trainingId);
    const uniqueStudents = new Set(
      attendanceRecords.map((r) => r.studentId)
    );

    const presentCount = attendanceRecords.filter(
      (r) => r.status === "present"
    ).length;
    const totalRecords = attendanceRecords.length;

    return {
      trainingId,
      totalStudents: uniqueStudents.size,
      totalAttendanceRecords: totalRecords,
      averageAttendance:
        totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0,
    };
  },

  async getAllAttendanceForTraining(trainingId: string): Promise<Attendance[]> {
    return await attendanceService.getByTraining(trainingId);
  },
};
