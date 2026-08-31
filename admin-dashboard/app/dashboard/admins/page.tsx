"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import api from "@/lib/api";
import AddAdminModal from "@/components/add-admin-modal";

type Admin = {
  id: number;
  email: string;
  school_id: number;
  school_name?: string;
  school_code?: string;
  role_id: number;
  is_active: boolean;
  is_verified: boolean;
};

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function loadAdmins() {
    try {
      setLoading(true);

      const response = await api.get("/admins");

      setAdmins(response.data);
    } catch (error) {
      console.error("Failed to load admins:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdmins();
  }, []);

  async function deleteAdmin(admin: Admin) {
    const confirmed = window.confirm(
      `Are you sure you want to delete the administrator "${admin.email}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(admin.id);

      await api.delete(`/admins/${admin.id}`);

      // Remove the deleted administrator immediately from the UI.
      setAdmins((currentAdmins) =>
        currentAdmins.filter(
          (currentAdmin) => currentAdmin.id !== admin.id
        )
      );
    } catch (error) {
      console.error("Failed to delete admin:", error);

      window.alert(
        "Failed to delete the administrator. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Administrators
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage School Admin accounts across CoreOne.
          </p>
        </div>

        <AddAdminModal
          onAdminCreated={loadAdmins}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center p-10">
            <Loader2
              className="animate-spin text-rose-500"
              size={28}
            />
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-sm text-slate-500">
                <th className="p-5">
                  Email
                </th>

                <th className="p-5">
                  School
                </th>

                <th className="p-5">
                  School Code
                </th>

                <th className="p-5">
                  Tenant URL
                </th>

                <th className="p-5">
                  Status
                </th>

                <th className="p-5">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {admins.map((admin) => {
                const tenantPath = admin.school_code
                  ? `/${admin.school_code.toLowerCase()}`
                  : "#";

                const isDeleting =
                  deletingId === admin.id;

                return (
                  <tr
                    key={admin.id}
                    className="border-t"
                  >
                    <td className="p-5 font-medium">
                      {admin.email}
                    </td>

                    <td className="p-5">
                      {admin.school_name ||
                        `School #${admin.school_id}`}
                    </td>

                    <td className="p-5">
                      <span className="font-mono text-sm font-semibold text-slate-600">
                        {admin.school_code || "N/A"}
                      </span>
                    </td>

                    <td className="p-5">
                      {admin.school_code ? (
                        <a
                          href={tenantPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all text-xs text-blue-600 hover:underline"
                        >
                          {`${window.location.origin}${tenantPath}`}
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">
                          N/A
                        </span>
                      )}
                    </td>

                    <td className="p-5">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                        Active
                      </span>
                    </td>

                    <td className="p-5">
                      <button
                        type="button"
                        onClick={() =>
                          deleteAdmin(admin)
                        }
                        disabled={isDeleting}
                        className="
                          rounded-xl
                          border
                          border-red-200
                          px-4
                          py-2
                          text-sm
                          font-semibold
                          text-red-600
                          hover:bg-red-50
                          disabled:cursor-not-allowed
                          disabled:opacity-50
                        "
                      >
                        {isDeleting
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {admins.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-10 text-center text-sm text-slate-500"
                  >
                    No School Administrators found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
