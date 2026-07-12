"use client";

import { useEffect, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";

import api from "@/lib/api";

type Props = {
  onAdminCreated: () => void;
};

type School = {
  id: number;
  name: string;
};

export default function AddAdminModal({
  onAdminCreated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadSchools() {
    const res = await api.get("/schools");
    setSchools(res.data);
  }

  useEffect(() => {
    if (open) {
      loadSchools();
    }
  }, [open]);

  async function submit() {
    if (submitting) return;

    try {
      setSubmitting(true);

      await api.post("/admins", {
        email,
        password,
        school_id: Number(schoolId),
      });

      setEmail("");
      setPassword("");
      setSchoolId("");
      setOpen(false);

      onAdminCreated();
    } catch (error: any) {
      console.error(
        "Failed to create admin:",
        error.response?.data || error
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="
          flex
          items-center
          gap-2
          rounded-xl
          bg-rose-500
          px-5
          py-3
          text-sm
          font-semibold
          text-white
        "
      >
        <UserPlus size={18} />
        Add Admin
      </button>

      {open && (
        <div
          onClick={() => !submitting && setOpen(false)}
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/30
            p-4
          "
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="
              w-full
              max-w-md
              space-y-4
              rounded-2xl
              bg-white
              p-6
            "
          >
            <h2 className="text-xl font-bold">
              Create School Admin
            </h2>

            <input
              type="email"
              autoComplete="off"
              placeholder="Email"
              className="w-full rounded-xl border p-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              placeholder="Password"
              type="password"
              autoComplete="new-password"
              className="w-full rounded-xl border p-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <select
              className="w-full rounded-xl border p-3"
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
            >
              <option value="">
                Select School
              </option>

              {schools.map((school) => (
                <option
                  key={school.id}
                  value={school.id}
                >
                  {school.name}
                </option>
              ))}
            </select>

            <button
              onClick={submit}
              disabled={submitting}
              className="
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-rose-500
                p-3
                font-semibold
                text-white
                transition
                hover:bg-rose-600
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {submitting && (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              )}

              {submitting
                ? "Creating Admin..."
                : "Create Admin"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
