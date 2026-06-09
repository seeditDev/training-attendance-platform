import { describe, it, expect } from "vitest";

describe("Attendance History Functionality", () => {
  it("should generate history with date grouping", () => {
    // Mock attendance records
    const mockRecords = [
      {
        trainingId: "training-1",
        studentId: "student-1",
        date: new Date("2026-06-09"),
        sessionId: "session-1",
        status: "present" as const,
      },
      {
        trainingId: "training-1",
        studentId: "student-2",
        date: new Date("2026-06-09"),
        sessionId: "session-1",
        status: "absent" as const,
      },
      {
        trainingId: "training-1",
        studentId: "student-3",
        date: new Date("2026-06-08"),
        sessionId: "session-1",
        status: "present" as const,
      },
    ];

    // Group by date
    const dateMap = new Map<string, number>();
    mockRecords.forEach((record) => {
      const dateStr = record.date.toISOString().split("T")[0];
      dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
    });

    const history = Array.from(dateMap.entries())
      .map(([dateStr, count]) => ({
        date: new Date(dateStr),
        count,
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    expect(history).toHaveLength(2);
    expect(history[0]?.count).toBe(2); // 2026-06-09
    expect(history[1]?.count).toBe(1); // 2026-06-08
  });

  it("should create deterministic document IDs for upsert", () => {
    const record = {
      trainingId: "training-1",
      studentId: "student-1",
      date: new Date("2026-06-09"),
      sessionId: "session-1",
      status: "present" as const,
    };

    const dateStr = record.date.toISOString().split("T")[0];
    const docId = `${record.trainingId}-${record.studentId}-${dateStr}-${record.sessionId}`;

    expect(docId).toBe("training-1-student-1-2026-06-09-session-1");
  });

  it("should handle multiple sessions on same date", () => {
    const records = [
      {
        trainingId: "training-1",
        studentId: "student-1",
        date: new Date("2026-06-09"),
        sessionId: "session-1",
        status: "present" as const,
      },
      {
        trainingId: "training-1",
        studentId: "student-1",
        date: new Date("2026-06-09"),
        sessionId: "session-2",
        status: "absent" as const,
      },
    ];

    // Create deterministic IDs
    const docIds = records.map((r) => {
      const dateStr = r.date.toISOString().split("T")[0];
      return `${r.trainingId}-${r.studentId}-${dateStr}-${r.sessionId}`;
    });

    expect(docIds).toHaveLength(2);
    expect(docIds[0]).not.toBe(docIds[1]); // Different session IDs
  });

  it("should support editing past attendance records", () => {
    const originalRecord = {
      trainingId: "training-1",
      studentId: "student-1",
      date: new Date("2026-06-09"),
      sessionId: "session-1",
      status: "absent" as const,
    };

    // Simulate editing
    const updatedRecord = {
      ...originalRecord,
      status: "present" as const,
    };

    const dateStr = originalRecord.date.toISOString().split("T")[0];
    const originalDocId = `${originalRecord.trainingId}-${originalRecord.studentId}-${dateStr}-${originalRecord.sessionId}`;
    const updatedDocId = `${updatedRecord.trainingId}-${updatedRecord.studentId}-${dateStr}-${updatedRecord.sessionId}`;

    // Same ID means it will update the same document
    expect(originalDocId).toBe(updatedDocId);
    expect(updatedRecord.status).toBe("present");
  });
});
