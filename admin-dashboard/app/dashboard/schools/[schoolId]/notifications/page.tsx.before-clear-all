"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Bell, Send, Users, User } from "lucide-react";
import api from "@/lib/api";

type Student = {
  id: number;
  first_name?: string;
  last_name?: string;
  admission_number?: string;
};

type Notification = {
  id: number;
  title: string;
  message: string;
  recipient_type?: string | null;
  sent_at: string;
};

export default function NotificationsPage() {
  const params = useParams();
  const schoolId = String(params.schoolId);

  const [students, setStudents] = useState<Student[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recipientType, setRecipientType] = useState<"GENERAL" | "STUDENT">(
    "GENERAL"
  );
  const [studentId, setStudentId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);

      const [studentsRes, notificationsRes] = await Promise.all([
        api.get("/students/", {
          params: { school_id: schoolId },
        }),
        api.get("/notifications"),
      ]);

      setStudents(studentsRes.data || []);
      setNotifications(notificationsRes.data || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load notification data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [schoolId]);

  const sendNotification = async () => {
    setError("");
    setSuccess("");

    if (!title.trim() || !message.trim()) {
      setError("Please enter both a title and message.");
      return;
    }

    if (recipientType === "STUDENT" && !studentId) {
      setError("Please select a student.");
      return;
    }

    try {
      setSending(true);

      await api.post("/notifications", {
        school_id: Number(schoolId),
        title: title.trim(),
        message: message.trim(),
        recipient_type:
          recipientType === "STUDENT" ? `STUDENT:${studentId}` : null,
      });

      setTitle("");
      setMessage("");
      setStudentId("");
      setSuccess("Notification sent successfully.");

      await loadData();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          "Unable to send notification."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-rose-100 p-3">
            <Bell className="text-rose-600" size={24} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Notifications
            </h1>
            <p className="text-sm text-slate-500">
              Send announcements and notifications to students.
            </p>
          </div>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900">
            Send Notification
          </h2>
          <p className="text-sm text-slate-500">
            Choose whether this notification goes to everyone or one student.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setRecipientType("GENERAL");
              setStudentId("");
            }}
            className={`rounded-2xl border p-5 text-left transition ${
              recipientType === "GENERAL"
                ? "border-rose-500 bg-rose-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <Users
              size={22}
              className={
                recipientType === "GENERAL"
                  ? "text-rose-600"
                  : "text-slate-500"
              }
            />
            <div className="mt-3 font-bold text-slate-900">
              General Notification
            </div>
            <div className="mt-1 text-sm text-slate-500">
              Send to the school generally.
            </div>
          </button>

          <button
            type="button"
            onClick={() => setRecipientType("STUDENT")}
            className={`rounded-2xl border p-5 text-left transition ${
              recipientType === "STUDENT"
                ? "border-rose-500 bg-rose-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <User
              size={22}
              className={
                recipientType === "STUDENT"
                  ? "text-rose-600"
                  : "text-slate-500"
              }
            />
            <div className="mt-3 font-bold text-slate-900">
              Individual Student
            </div>
            <div className="mt-1 text-sm text-slate-500">
              Send privately to one student.
            </div>
          </button>
        </div>

        {recipientType === "STUDENT" && (
          <div className="mt-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Select Student
            </label>

            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-rose-400"
            >
              <option value="">Select a student...</option>

              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.first_name || ""} {student.last_name || ""}
                  {student.admission_number
                    ? ` — ${student.admission_number}`
                    : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-5">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Title
          </label>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notification title"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-400"
          />
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Message
          </label>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your notification..."
            rows={5}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-400"
          />
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
            {success}
          </div>
        )}

        <button
          type="button"
          onClick={sendNotification}
          disabled={sending}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-50"
        >
          <Send size={17} />
          {sending ? "Sending..." : "Send Notification"}
        </button>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          Notification History
        </h2>

        {loading ? (
          <p className="mt-5 text-sm text-slate-500">
            Loading notifications...
          </p>
        ) : notifications.length === 0 ? (
          <p className="mt-5 text-sm text-slate-500">
            No notifications have been sent yet.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {notifications.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {item.message}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                    {item.recipient_type?.startsWith("STUDENT:")
                      ? "Individual Student"
                      : "General"}
                  </span>
                </div>

                <p className="mt-3 text-xs text-slate-400">
                  {new Date(item.sent_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
