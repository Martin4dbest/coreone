"use client";

import { useEffect, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";

import api from "@/lib/api";
import AddAdminModal from "@/components/add-admin-modal";

type Admin = {
  id: number;
  email: string;
  school_id: number;
  school_name?: string;
  school_code?: string; // Added school_code property
  role_id: number;
  is_active: boolean;
  is_verified: boolean;
};

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAdmins() {
    try {
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

  async function toggleStatus(admin: Admin) {
    try {
      await api.patch(
        `/admins/${admin.id}/${
          admin.is_active
            ? "deactivate"
            : "activate"
        }`
      );

      loadAdmins();
    } catch (error) {
      console.error(
        "Failed to update admin:",
        error
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


      <div className="
        overflow-hidden
        rounded-2xl
        border
        border-slate-100
        bg-white
        shadow-sm
      ">

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

                {/* Added School Code Header */}
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

              {admins.map((admin)=>(

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


                  {/* Added School Code Column */}
                  <td className="p-5">
                    <span className="font-mono text-sm font-semibold text-slate-600">
                      {admin.school_code || "N/A"}
                    </span>
                  </td>


                  <td className="p-5">
                    <a
                      href={`/${admin.school_code?.toLowerCase()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-xs break-all"
                    >
                      {`${window.location.origin}/${admin.school_code?.toLowerCase()}`}
                    </a>
                  </td>

                  <td className="p-5">

                    <span
                      className={
                        admin.is_active
                        ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600"
                        : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500"
                      }
                    >
                      {admin.is_active
                        ? "Active"
                        : "Inactive"}
                    </span>

                  </td>


                  <td className="p-5">

                    <button
                      onClick={() =>
                        toggleStatus(admin)
                      }
                      className="
                      rounded-xl
                      border
                      px-4
                      py-2
                      text-sm
                      font-semibold
                      hover:bg-slate-50
                      "
                    >
                      {admin.is_active
                        ? "Deactivate"
                        : "Activate"}
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        )}

      </div>

    </div>
  );
}