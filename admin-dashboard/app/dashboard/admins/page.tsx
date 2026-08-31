"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Trash2, X, AlertTriangle } from "lucide-react";

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

  const [adminToDelete, setAdminToDelete] =
    useState<Admin | null>(null);

  const [deleteConfirmation, setDeleteConfirmation] =
    useState("");

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

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

  function openDeleteModal(admin: Admin) {
    setAdminToDelete(admin);
    setDeleteConfirmation("");
    setErrorMessage("");
  }

  function closeDeleteModal() {
    if (deletingId !== null) {
      return;
    }

    setAdminToDelete(null);
    setDeleteConfirmation("");
    setErrorMessage("");
  }

  async function confirmDelete() {
    if (!adminToDelete) {
      return;
    }

    if (deleteConfirmation.trim() !== "DELETE") {
      return;
    }

    try {
      setDeletingId(adminToDelete.id);
      setErrorMessage("");

      await api.delete(`/admins/${adminToDelete.id}`);

      const deletedEmail = adminToDelete.email;

      // Remove immediately from the visible table.
      setAdmins((currentAdmins) =>
        currentAdmins.filter(
          (currentAdmin) =>
            currentAdmin.id !== adminToDelete.id
        )
      );

      setAdminToDelete(null);
      setDeleteConfirmation("");
      setDeletingId(null);

      setSuccessMessage(
        `${deletedEmail} was deleted successfully.`
      );

      window.setTimeout(() => {
        setSuccessMessage("");
      }, 3500);
    } catch (error) {
      console.error("Failed to delete admin:", error);

      setDeletingId(null);
      setErrorMessage(
        "The administrator could not be deleted. Please try again."
      );
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
                <th className="p-5">Email</th>
                <th className="p-5">School</th>
                <th className="p-5">School Code</th>
                <th className="p-5">Tenant URL</th>
                <th className="p-5">Status</th>
                <th className="p-5">Action</th>
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
                          openDeleteModal(admin)
                        }
                        disabled={isDeleting}
                        className="
                          inline-flex
                          items-center
                          gap-2
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
                        <Trash2 size={16} />
                        Delete
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

      {/* DELETE CONFIRMATION MODAL */}
      {adminToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
                  <AlertTriangle
                    className="text-red-600"
                    size={22}
                  />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Delete Administrator
                  </h2>

                  <p className="text-sm text-slate-500">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deletingId !== null}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="rounded-xl bg-red-50 p-4">
                <p className="text-sm text-red-700">
                  You are about to permanently delete:
                </p>

                <p className="mt-1 font-semibold text-red-800">
                  {adminToDelete.email}
                </p>

                {adminToDelete.school_name && (
                  <p className="mt-1 text-sm text-red-700">
                    {adminToDelete.school_name}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Type <span className="font-mono">DELETE</span>{" "}
                  to confirm
                </label>

                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(event) =>
                    setDeleteConfirmation(
                      event.target.value
                    )
                  }
                  disabled={deletingId !== null}
                  autoFocus
                  placeholder="DELETE"
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    px-4
                    py-3
                    text-sm
                    font-medium
                    uppercase
                    outline-none
                    transition
                    focus:border-red-400
                    focus:ring-2
                    focus:ring-red-100
                    disabled:bg-slate-50
                  "
                />
              </div>

              {errorMessage && (
                <div className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
                  {errorMessage}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={deletingId !== null}
                  className="
                    rounded-xl
                    border
                    border-slate-200
                    px-5
                    py-2.5
                    text-sm
                    font-semibold
                    text-slate-600
                    hover:bg-slate-50
                    disabled:opacity-50
                  "
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={
                    deleteConfirmation.trim() !==
                      "DELETE" ||
                    deletingId !== null
                  }
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-red-600
                    px-5
                    py-2.5
                    text-sm
                    font-semibold
                    text-white
                    hover:bg-red-700
                    disabled:cursor-not-allowed
                    disabled:bg-slate-300
                  "
                >
                  {deletingId === adminToDelete.id ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Delete Administrator
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS POPUP */}
      {successMessage && (
        <div className="fixed right-6 top-6 z-[60] w-full max-w-sm">
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2
                className="text-emerald-600"
                size={22}
              />
            </div>

            <div className="flex-1">
              <p className="font-semibold text-slate-800">
                Administrator Deleted
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {successMessage}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setSuccessMessage("")
              }
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
