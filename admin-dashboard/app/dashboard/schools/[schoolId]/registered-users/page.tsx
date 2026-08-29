"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  ShieldCheck,
  Users,
  UserCog,
  Loader2,
} from "lucide-react";
import api from "@/lib/api";

type Teacher = {
  id: number;
  user_id: number;
  employee_number: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  school_id?: number;
};

type TeacherAssignment = {
  teacher: string;
  email?: string | null;
  class_teacher_of?: string[];
  subjects?: {
    id: number;
    classroom: string;
    subject: string;
  }[];
};

type Admin = {
  id: number;
  user_id?: number;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  name?: string | null;
  is_primary_school_admin?: boolean;
};

export default function RegisteredUsersPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);

  const [schoolName, setSchoolName] = useState("");


  const [teachers, setTeachers] = useState<
    Array<Teacher & { assignment?: TeacherAssignment | null }>
  >([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSchoolName() {
      try {
        const response = await api.get(`/schools/${schoolId}`);
        setSchoolName(response.data?.name || "");
      } catch (error) {
        console.error("Failed to load school name:", error);
        setSchoolName("");
      }
    }

    loadSchoolName();


    async function load() {
      setLoading(true);
      setError("");

      try {
        // Users are the primary source. Roles are only used to help
        // identify users when the role is not already embedded in /users.
        const [usersResult, rolesResult] = await Promise.allSettled([
          api.get("/users"),
          api.get("/roles"),
        ]);

        // /users is required for this page.
        if (usersResult.status === "rejected") {
          throw usersResult.reason;
        }

        const usersData = usersResult.value?.data;

        const allUsers = Array.isArray(usersData)
          ? usersData
          : Array.isArray(usersData?.data)
            ? usersData.data
            : [];

        // /roles must never make the entire Registered Users page fail.
        const rolesData =
          rolesResult.status === "fulfilled"
            ? rolesResult.value?.data
            : [];

        const allRoles = Array.isArray(rolesData)
          ? rolesData
          : Array.isArray(rolesData?.data)
            ? rolesData.data
            : [];

        if (rolesResult.status === "rejected") {
          console.warn(
            "Registered Users: /roles request failed; continuing with /users data.",
            rolesResult.reason
          );
        }

        const teacherRoleIds = new Set(
          allRoles
            .filter(
              (role: { id?: number; name?: string }) =>
                String(role.name || "").toUpperCase() === "TEACHER"
            )
            .map((role: { id?: number }) => Number(role.id))
        );

        const teachers = allUsers
          .filter(
            (user: {
              school_id?: number;
              role_id?: number;
              role?: { id?: number; name?: string } | string;
            }) => {
              if (Number(user.school_id) !== Number(schoolId)) {
                return false;
              }

              const roleId =
                typeof user.role === "object" && user.role
                  ? Number(user.role.id)
                  : Number(user.role_id);

              const roleName =
                typeof user.role === "string"
                  ? user.role.toUpperCase()
                  : String(user.role?.name || "").toUpperCase();

              return (
                teacherRoleIds.has(roleId) ||
                roleName === "TEACHER"
              );
            }
          )
          .map((user: {
            id?: number;
            user_id?: number;
            employee_number?: string;
            first_name?: string;
            last_name?: string;
            email?: string;
            school_id?: number;
          }) => ({
            id: Number(user.id || user.user_id || 0),
            user_id: Number(user.user_id || user.id || 0),
            employee_number: user.employee_number || "",
            first_name: user.first_name || "",
            last_name: user.last_name || "",
            email: user.email || "",
            school_id: Number(user.school_id || schoolId),
          }));

          // ------------------------------------------------------
          // CANONICAL TEACHER RECORDS
          //
          // The /users endpoint returns User IDs. The assignment
          // endpoint requires Teacher profile IDs.
          //
          // Load the actual /teachers records so teacher.id is
          // always Teacher.id, not User.id.
          // ------------------------------------------------------

          const teachersResponse = await api.get(
            "/teachers",
            {
              params: {
                school_id: Number(schoolId),
              },
            }
          );

          const teachersData = teachersResponse?.data;

          const teacherRecords = Array.isArray(teachersData)
            ? teachersData
            : Array.isArray(teachersData?.data)
              ? teachersData.data
              : [];

          const teacherList: Teacher[] = teacherRecords
            .map((teacher: any) => ({
              id: Number(teacher.id || 0),
              user_id: Number(
                teacher.user_id ||
                teacher.user?.id ||
                0
              ),
              employee_number:
                teacher.employee_number || "",
              first_name:
                teacher.first_name || "",
              last_name:
                teacher.last_name || "",
              email:
                teacher.email ||
                teacher.user?.email ||
                "",
              school_id: Number(
                teacher.school_id || schoolId
              ),
            }))
            .filter(
              (teacher: Teacher) =>
                teacher.id > 0
            );

          const teachersWithAssignments = await Promise.all(
            teacherList.map(async (teacher) => {
              try {
                const assignmentResult = await api.get(
                  `/teachers/${teacher.id}/assignments`,
                  {
                    params: {
                      school_id: Number(schoolId),
                    },
                  }
                );

                const assignment = assignmentResult?.data;

                return {
                  ...teacher,
                  assignment: assignment
                    ? {
                        teacher: assignment.teacher,
                        email: assignment.email || teacher.email || null,
                        class_teacher_of: Array.isArray(
                          assignment.class_teacher_of
                        )
                          ? assignment.class_teacher_of
                          : [],
                        subjects: Array.isArray(assignment.subjects)
                          ? assignment.subjects
                          : [],
                      }
                    : null,
                };
              } catch (assignmentError) {
                console.error(
                  `Failed to load assignments for teacher ${teacher.id}:`,
                  assignmentError
                );

                // Do not remove the teacher if one assignment request fails.
                return {
                  ...teacher,
                  assignment: {
                    teacher:
                      `${teacher.first_name} ${teacher.last_name}`.trim(),
                    email: teacher.email || null,
                    class_teacher_of: [],
                    subjects: [],
                  },
                };
              }
            })
          );

          setTeachers(teachersWithAssignments);

          // Build registered admins directly from /users + /roles.
          // This keeps Super Admin working for the selected school
          // without depending on the /admins endpoint.
          const adminRoleIds = new Set(
            allRoles
              .filter((role: { id?: number; name?: string }) => {
                const roleName = String(role.name || "").toUpperCase();
                return (
                  roleName === "SCHOOL_ADMIN" ||
                  roleName === "ADMIN"
                );
              })
              .map((role: { id?: number }) => Number(role.id))
          );

          const registeredAdmins: Admin[] = allUsers
            .filter(
              (user: {
                id?: number;
                user_id?: number;
                school_id?: number;
                role_id?: number;
                role?: {
                  id?: number;
                  name?: string;
                  is_primary_school_admin?: boolean;
                } | string;
                first_name?: string;
                last_name?: string;
                email?: string;
                name?: string;
                is_primary_school_admin?: boolean;
              }) => {
                if (Number(user.school_id) !== Number(schoolId)) {
                  return false;
                }

                const roleId =
                  typeof user.role === "object" && user.role
                    ? Number(user.role.id)
                    : Number(user.role_id);

                const roleName =
                  typeof user.role === "string"
                    ? user.role.toUpperCase()
                    : String(user.role?.name || "").toUpperCase();

                return (
                  adminRoleIds.has(roleId) ||
                  roleName === "SCHOOL_ADMIN" ||
                  roleName === "ADMIN"
                );
              }
            )
            .map(
              (user: {
                id?: number;
                user_id?: number;
                first_name?: string;
                last_name?: string;
                email?: string;
                name?: string;
                is_primary_school_admin?: boolean;
                role?: {
                  is_primary_school_admin?: boolean;
                } | string;
              }) => ({
                id: Number(user.id || user.user_id || 0),
                user_id: Number(user.user_id || user.id || 0),
                first_name: user.first_name || "",
                last_name: user.last_name || "",
                email: user.email || "",
                name:
                  user.name ||
                  [user.first_name, user.last_name]
                    .filter(Boolean)
                    .join(" "),
                is_primary_school_admin:
                  Boolean(user.is_primary_school_admin) ||
                  (typeof user.role === "object" &&
                    Boolean(user.role?.is_primary_school_admin)),
              })
            );

          setAdmins(registeredAdmins);
      } catch (loadError) {
        console.error(
          "Failed to load registered teachers/admins:",
          loadError
        );
        setError("Unable to load registered users for this school.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [schoolId]);

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="text-center">
          <Loader2
            size={32}
            className="mx-auto animate-spin text-rose-600"
          />
          <p className="mt-3 text-sm text-slate-500">
            Loading registered users...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-white p-8 text-center">
        <p className="text-sm text-red-700">{error}</p>
        <Link
          href={`/dashboard/schools/${schoolId}`}
          className="mt-4 inline-flex text-sm font-semibold text-rose-700"
        >
          Back to School
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/schools/${schoolId}`}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Registered Users {/* CoreOne Registered Users */}
          </h1>
          <p className="text-sm text-slate-500">
            Teachers and administrators registered under this school.
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-rose-50/50 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm">
            <Users size={20} />
          </div>

          <div>
            <h2 className="font-bold text-slate-900">Teachers</h2>
            <p className="text-xs text-slate-500">
              Registered teacher login details and assigned subjects
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Teacher</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Subject(s) Assigned</th>
                <th className="px-5 py-3">Default Password</th>
              </tr>
            </thead>

            <tbody>
              {teachers.map((teacher) => {
                const assignment = teacher.assignment;
                const subjects = Array.from(
                  new Set(
                    (assignment?.subjects || [])
                      .map((item) => item.subject)
                      .filter(Boolean)
                  )
                );

                return (
                  <tr
                    key={teacher.id}
                    className="border-b border-slate-50 last:border-b-0"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">
                        {teacher.first_name} {teacher.last_name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {teacher.employee_number}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Mail size={15} className="text-slate-400" />
                        {assignment?.email || "—"}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {subjects.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {subjects.map((subject) => (
                            <span
                              key={subject}
                              className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700"
                            >
                              {subject}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">
                          No subject assigned
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-sm font-semibold text-slate-700">
                        12345AB
                      </span>
                    </td>
                  </tr>
                );
              })}

              {teachers.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-sm text-slate-400"
                  >
                    No registered teachers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-blue-50/50 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
            <UserCog size={20} />
          </div>

          <div>
            <h2 className="font-bold text-slate-900">Admins</h2>
            <p className="text-xs text-slate-500">
              Registered school administrator login details
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px]">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Admin</th>
                <th className="px-5 py-3">Email</th>
              </tr>
            </thead>

            <tbody>
              {admins.map((admin) => {
                const isPrimaryAdmin = Boolean(
                  admin.is_primary_school_admin
                );

                const name = isPrimaryAdmin
                  ? "Super Admin"
                  : "Admin";

                return (
                  <tr
                    key={admin.id}
                    className="border-b border-slate-50 last:border-b-0"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 font-semibold text-slate-900">
                        <ShieldCheck size={16} className="text-blue-600" />
                        {name}
                      </div>

                      <p className="mt-1 text-xs font-medium text-slate-500">
                        {admin.is_primary_school_admin
                          ? `Super Admin for ${schoolName || "this school"}`
                          : `Admin for ${schoolName || "this school"}`}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Mail size={15} className="text-slate-400" />
                        {admin.email || "—"}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {admins.length === 0 && (
                <tr>
                  <td
                    colSpan={2}
                    className="px-5 py-10 text-center text-sm text-slate-400"
                  >
                    No registered admins found for this school.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
