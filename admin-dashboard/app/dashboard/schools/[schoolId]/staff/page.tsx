"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  UserRound,
  Plus,
  X,
  UserPlus,
  Pencil,
  Power,
  Mail,
  IdCard,
  Trash2,
} from "lucide-react";
import api from "@/lib/api";

type Staff = {
  id: number;
  user_id: number;
  employee_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;

  gender: string | null;
  date_of_birth: string | null;
  phone: string | null;
  address: string | null;

  job_title: string | null;
  department: string | null;
  employment_type: string | null;
  date_employed: string | null;

  qualification: string | null;

  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_contact_phone: string | null;

  profile_photo: string | null;
  notes: string | null;

  email: string;
  is_active: boolean;
};

export default function Page({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);

  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const emptyProfileForm = {
    first_name: "",
    middle_name: "",
    last_name: "",
    employee_number: "",
    email: "",
    password: "",

    gender: "",
    date_of_birth: "",
    phone: "",
    address: "",

    job_title: "",
    department: "",
    employment_type: "",
    date_employed: "",

    qualification: "",

    emergency_contact_name: "",
    emergency_contact_relationship: "",
    emergency_contact_phone: "",

    profile_photo: "",
    notes: "",
  };

  const [form, setForm] = useState(emptyProfileForm);
  const [editForm, setEditForm] = useState({
    ...emptyProfileForm,
    password: "",
  });

  async function loadStaff() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<Staff[]>("/staff");
      setStaff(response.data);
    } catch (error) {
      console.error("Failed to load staff:", error);
      setError("Unable to load staff.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, []);

  function resetAddForm() {
    setForm({ ...emptyProfileForm });
    setFormError("");
  }

  function openEdit(member: Staff) {
    setFormError("");

    setEditForm({
      ...emptyProfileForm,
      first_name: member.first_name || "",
      middle_name: member.middle_name || "",
      last_name: member.last_name || "",
      employee_number: member.employee_number || "",
      email: member.email || "",

      gender: member.gender || "",
      date_of_birth: member.date_of_birth || "",
      phone: member.phone || "",
      address: member.address || "",

      job_title: member.job_title || "",
      department: member.department || "",
      employment_type: member.employment_type || "",
      date_employed: member.date_employed || "",

      qualification: member.qualification || "",

      emergency_contact_name: member.emergency_contact_name || "",
      emergency_contact_relationship:
        member.emergency_contact_relationship || "",
      emergency_contact_phone: member.emergency_contact_phone || "",

      profile_photo: member.profile_photo || "",
      notes: member.notes || "",
    });

    setEditingStaff(member);
    setSelectedStaff(null);
  }

  async function handleCreateStaff(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setFormError("");

    if (
      !form.first_name.trim() ||
      !form.last_name.trim() ||
      !form.employee_number.trim() ||
      !form.email.trim() ||
      !form.password
    ) {
      setFormError("Please fill in all fields.");
      return;
    }

    try {
      setSaving(true);

      await api.post("/staff", {
        school_id: Number(schoolId),

        first_name: form.first_name.trim(),
        middle_name: form.middle_name.trim() || null,
        last_name: form.last_name.trim(),
        employee_number: form.employee_number.trim(),

        email: form.email.trim(),
        password: form.password,

        gender: form.gender || null,
        date_of_birth: form.date_of_birth || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,

        job_title: form.job_title.trim() || null,
        department: form.department.trim() || null,
        employment_type: form.employment_type || null,
        date_employed: form.date_employed || null,

        qualification: form.qualification.trim() || null,

        emergency_contact_name:
          form.emergency_contact_name.trim() || null,
        emergency_contact_relationship:
          form.emergency_contact_relationship.trim() || null,
        emergency_contact_phone:
          form.emergency_contact_phone.trim() || null,

        profile_photo: form.profile_photo.trim() || null,
        notes: form.notes.trim() || null,
      });

      resetAddForm();
      setShowAddForm(false);

      await loadStaff();
    } catch (error: any) {
      console.error("Failed to create staff:", error);

      setFormError(
        error?.response?.data?.detail ||
          "Unable to create staff account."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateStaff(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!editingStaff) return;

    setFormError("");

    try {
      setSaving(true);

      await api.patch(`/staff/${editingStaff.id}`, {
        first_name: editForm.first_name.trim(),
        middle_name: editForm.middle_name.trim() || null,
        last_name: editForm.last_name.trim(),
        employee_number: editForm.employee_number.trim(),
        email: editForm.email.trim(),

        gender: editForm.gender || null,
        date_of_birth: editForm.date_of_birth || null,
        phone: editForm.phone.trim() || null,
        address: editForm.address.trim() || null,

        job_title: editForm.job_title.trim() || null,
        department: editForm.department.trim() || null,
        employment_type: editForm.employment_type || null,
        date_employed: editForm.date_employed || null,

        qualification: editForm.qualification.trim() || null,

        emergency_contact_name:
          editForm.emergency_contact_name.trim() || null,
        emergency_contact_relationship:
          editForm.emergency_contact_relationship.trim() || null,
        emergency_contact_phone:
          editForm.emergency_contact_phone.trim() || null,

        profile_photo: editForm.profile_photo.trim() || null,
        notes: editForm.notes.trim() || null,
      });

      setEditingStaff(null);
      await loadStaff();
    } catch (error: any) {
      console.error("Failed to update staff:", error);

      setFormError(
        error?.response?.data?.detail ||
          "Unable to update staff."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(member: Staff) {
    const action = member.is_active
      ? "deactivate"
      : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${member.first_name} ${member.last_name}?`
    );

    if (!confirmed) return;

    try {
      await api.patch(
        `/staff/${member.id}/status`,
        null,
        {
          params: {
            is_active: !member.is_active,
          },
        }
      );

      await loadStaff();

      if (selectedStaff?.id === member.id) {
        setSelectedStaff({
          ...member,
          is_active: !member.is_active,
        });
      }
    } catch (error: any) {
      console.error("Failed to update staff status:", error);

      alert(
        error?.response?.data?.detail ||
          "Unable to update staff status."
      );
    }
  }


  async function deleteStaff(member: Staff) {
    const confirmed = window.confirm(
      `PERMANENTLY DELETE ${member.first_name} ${member.last_name}?\n\nThis will remove the staff account and staff record from the database. This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/staff/${member.id}`);

      setSelectedStaff(null);
      await loadStaff();
    } catch (error: any) {
      console.error("Failed to delete staff:", error);

      alert(
        error?.response?.data?.detail ||
          "Unable to delete staff."
      );
    }
  }

  return (
    <div className="space-y-8">
      <Link
        href={`/dashboard/schools/${schoolId}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-rose-500"
      >
        <ArrowLeft size={16} />
        Back to School Workspace
      </Link>

      <section className="rounded-[28px] border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-pink-50 p-8 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-sm">
              <UserRound size={26} />
            </div>

            <h1 className="mt-6 text-3xl font-bold text-slate-900">
              Staff
            </h1>

            <p className="mt-3 text-sm text-slate-500">
              Manage administrative and non-teaching personnel.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={`/dashboard/schools/${schoolId}/staff`}
                className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Staff
              </Link>

              <Link
                href={`/dashboard/schools/${schoolId}/staff/attendance`}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Attendance
              </Link>

              <Link
                href={`/dashboard/schools/${schoolId}/staff/leave`}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Leave
              </Link>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              resetAddForm();
              setShowAddForm(true);
              setEditingStaff(null);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-rose-600"
          >
            <Plus size={18} />
            Add Staff
          </button>
        </div>
      </section>

      {showAddForm && (
        <section className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <UserPlus size={20} className="text-rose-500" />
                <h2 className="text-xl font-bold text-slate-900">
                  Add Staff Member
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Create the staff profile and login account.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                resetAddForm();
                setShowAddForm(false);
              }}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={20} />
            </button>
          </div>

          <form
            onSubmit={handleCreateStaff}
            className="mt-6 space-y-5"
          >
            {formError && (
              <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
                {formError}
              </div>
            )}

            <div className="space-y-7">
              <div>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-400">
                  Personal Information
                </h3>

                <div className="grid gap-5 md:grid-cols-2">
                  <Input
                    label="First Name"
                    value={form.first_name}
                    onChange={(value) =>
                      setForm({ ...form, first_name: value })
                    }
                  />

                  <Input
                    label="Middle Name"
                    value={form.middle_name}
                    onChange={(value) =>
                      setForm({ ...form, middle_name: value })
                    }
                  />

                  <Input
                    label="Last Name"
                    value={form.last_name}
                    onChange={(value) =>
                      setForm({ ...form, last_name: value })
                    }
                  />

                  <Input
                    label="Employee Number"
                    value={form.employee_number}
                    onChange={(value) =>
                      setForm({ ...form, employee_number: value })
                    }
                  />

                  <Input
                    label="Phone Number"
                    value={form.phone}
                    onChange={(value) =>
                      setForm({ ...form, phone: value })
                    }
                  />

                  <SelectInput
                    label="Gender"
                    value={form.gender}
                    onChange={(value) =>
                      setForm({ ...form, gender: value })
                    }
                    options={["Male", "Female", "Other"]}
                  />

                  <Input
                    label="Date of Birth"
                    type="date"
                    value={form.date_of_birth}
                    onChange={(value) =>
                      setForm({ ...form, date_of_birth: value })
                    }
                  />

                  <Input
                    label="Address"
                    value={form.address}
                    onChange={(value) =>
                      setForm({ ...form, address: value })
                    }
                  />
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-400">
                  Employment Information
                </h3>

                <div className="grid gap-5 md:grid-cols-2">
                  <Input
                    label="Job Title / Position"
                    value={form.job_title}
                    onChange={(value) =>
                      setForm({ ...form, job_title: value })
                    }
                  />

                  <Input
                    label="Department"
                    value={form.department}
                    onChange={(value) =>
                      setForm({ ...form, department: value })
                    }
                  />

                  <SelectInput
                    label="Employment Type"
                    value={form.employment_type}
                    onChange={(value) =>
                      setForm({ ...form, employment_type: value })
                    }
                    options={[
                      "Full-Time",
                      "Part-Time",
                      "Contract",
                      "Temporary",
                    ]}
                  />

                  <Input
                    label="Date Employed"
                    type="date"
                    value={form.date_employed}
                    onChange={(value) =>
                      setForm({ ...form, date_employed: value })
                    }
                  />

                  <Input
                    label="Qualification"
                    value={form.qualification}
                    onChange={(value) =>
                      setForm({ ...form, qualification: value })
                    }
                  />
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-400">
                  Account Information
                </h3>

                <div className="grid gap-5 md:grid-cols-2">
                  <Input
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(value) =>
                      setForm({ ...form, email: value })
                    }
                  />

                  <Input
                    label="Password"
                    type="password"
                    value={form.password}
                    onChange={(value) =>
                      setForm({ ...form, password: value })
                    }
                  />

                  <Input
                    label="Profile Photo URL"
                    value={form.profile_photo}
                    onChange={(value) =>
                      setForm({ ...form, profile_photo: value })
                    }
                  />
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-400">
                  Emergency Contact
                </h3>

                <div className="grid gap-5 md:grid-cols-2">
                  <Input
                    label="Contact Name"
                    value={form.emergency_contact_name}
                    onChange={(value) =>
                      setForm({
                        ...form,
                        emergency_contact_name: value,
                      })
                    }
                  />

                  <Input
                    label="Relationship"
                    value={form.emergency_contact_relationship}
                    onChange={(value) =>
                      setForm({
                        ...form,
                        emergency_contact_relationship: value,
                      })
                    }
                  />

                  <Input
                    label="Contact Phone"
                    value={form.emergency_contact_phone}
                    onChange={(value) =>
                      setForm({
                        ...form,
                        emergency_contact_phone: value,
                      })
                    }
                  />
                </div>
              </div>

              <TextArea
                label="Notes"
                value={form.notes}
                onChange={(value) =>
                  setForm({ ...form, notes: value })
                }
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => {
                  resetAddForm();
                  setShowAddForm(false);
                }}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-bold text-white hover:bg-rose-600 disabled:opacity-60"
              >
                {saving && (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                )}
                {saving ? "Creating..." : "Create Staff"}
              </button>
            </div>
          </form>
        </section>
      )}

      {editingStaff && (
        <section className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Edit Staff
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Update staff profile and account information.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingStaff(null);
                setFormError("");
              }}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
            >
              <X size={20} />
            </button>
          </div>

          <form
            onSubmit={handleUpdateStaff}
            className="mt-6 space-y-5"
          >
            {formError && (
              <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
                {formError}
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <Input
                label="First Name"
                value={editForm.first_name}
                onChange={(value) =>
                  setEditForm({
                    ...editForm,
                    first_name: value,
                  })
                }
              />

              <Input
                label="Last Name"
                value={editForm.last_name}
                onChange={(value) =>
                  setEditForm({
                    ...editForm,
                    last_name: value,
                  })
                }
              />

              <Input
                label="Employee Number"
                value={editForm.employee_number}
                onChange={(value) =>
                  setEditForm({
                    ...editForm,
                    employee_number: value,
                  })
                }
              />

              <Input
                label="Email"
                type="email"
                value={editForm.email}
                onChange={(value) =>
                  setEditForm({
                    ...editForm,
                    email: value,
                  })
                }
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => {
                  setEditingStaff(null);
                  setFormError("");
                }}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {saving && (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                )}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Staff Directory
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {staff.length} staff member
            {staff.length === 1 ? "" : "s"} found
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-48 items-center justify-center">
            <Loader2
              className="animate-spin text-rose-500"
              size={28}
            />
          </div>
        ) : error ? (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        ) : staff.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
            No staff members have been added to this school yet.
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="px-4 py-3 font-semibold">
                    Staff Member
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    Employee Number
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    Email
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {staff.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedStaff(member)}
                        className="font-semibold text-slate-900 hover:text-rose-500"
                      >
                        {member.first_name} {member.last_name}
                      </button>
                    </td>

                    <td className="px-4 py-4 text-slate-500">
                      {member.employee_number}
                    </td>

                    <td className="px-4 py-4 text-slate-500">
                      {member.email}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                          member.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {member.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedStaff(member)
                          }
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          title="View Profile"
                        >
                          <UserRound size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openEdit(member)
                          }
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          title="Edit Staff"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleStatus(member)
                          }
                          className={`rounded-lg p-2 ${
                            member.is_active
                              ? "text-red-500 hover:bg-red-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={
                            member.is_active
                              ? "Deactivate"
                              : "Activate"
                          }
                        >
                          <Power size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                  <UserRound size={26} />
                </div>

                <h2 className="mt-5 text-2xl font-bold text-slate-900">
                  {selectedStaff.first_name}{" "}
                  {selectedStaff.last_name}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Staff Profile
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStaff(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-7 space-y-4">
              <ProfileRow
                icon={<IdCard size={18} />}
                label="Employee Number"
                value={selectedStaff.employee_number}
              />

              <ProfileRow
                icon={<Mail size={18} />}
                label="Email"
                value={selectedStaff.email}
              />

              <ProfileRow
                icon={<Power size={18} />}
                label="Account Status"
                value={
                  selectedStaff.is_active
                    ? "Active"
                    : "Inactive"
                }
              />
            </div>

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  toggleStatus(selectedStaff)
                }
                className={`rounded-xl px-5 py-3 text-sm font-bold ${
                  selectedStaff.is_active
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                {selectedStaff.is_active
                  ? "Deactivate"
                  : "Activate"}
              </button>

              <button
                type="button"
                onClick={() => deleteStaff(selectedStaff)}
                className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-100"
              >
                <Trash2 size={16} />
                Delete Staff
              </button>

              <button
                type="button"
                onClick={() => openEdit(selectedStaff)}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
              >
                Edit Staff
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
      />
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
      />
    </div>
  );
}

function ProfileRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
      <div className="text-slate-500">
        {icon}
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-400">
          {label}
        </p>

        <p className="mt-1 text-sm font-semibold text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}
