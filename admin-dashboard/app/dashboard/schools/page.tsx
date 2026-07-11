"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Mail,
  Phone,
  Loader2,
} from "lucide-react";

import api from "@/lib/api";
import AddSchoolModal from "@/components/add-school-modal";

type School = {
  id: number;
  name: string;
  school_code: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  is_active: boolean;
};

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadSchools() {
  try {
    const response = await api.get("/schools");
    setSchools(response.data);
  } catch (error) {
    console.error("Failed to load schools:", error);
  } finally {
    setLoading(false);
  }
}

useEffect(() => {
  loadSchools();
}, []);

  const filteredSchools = schools.filter((school) => {
    const query = search.toLowerCase();

    return (
      school.name.toLowerCase().includes(query) ||
      school.school_code.toLowerCase().includes(query) ||
      school.city.toLowerCase().includes(query) ||
      school.state.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-rose-500">
            Institution Management
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Schools
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage every institution registered on PreSense.
          </p>
        </div>

        <AddSchoolModal onSchoolCreated={loadSchools} />
      </section>

      <section
        className="
        rounded-2xl
        border
        border-slate-100
        bg-white
        p-5
        shadow-sm
        "
      >
        <div className="relative max-w-md">
          <Search
            size={18}
            className="
            absolute
            left-4
            top-1/2
            -translate-y-1/2
            text-slate-400
            "
          />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search schools..."
            className="
            w-full
            rounded-xl
            border
            border-slate-200
            bg-slate-50/50
            py-3
            pl-11
            pr-4
            text-sm
            outline-none
            transition
            focus:border-rose-300
            focus:ring-4
            focus:ring-rose-50
            "
          />
        </div>
      </section>

      {loading ? (
        <div
          className="
          flex
          min-h-[300px]
          items-center
          justify-center
          rounded-2xl
          border
          border-slate-100
          bg-white
          "
        >
          <div className="text-center">
            <Loader2
              size={28}
              className="mx-auto animate-spin text-rose-500"
            />

            <p className="mt-3 text-sm text-slate-500">
              Loading schools...
            </p>
          </div>
        </div>
      ) : filteredSchools.length === 0 ? (
        <div
          className="
          flex
          min-h-[300px]
          flex-col
          items-center
          justify-center
          rounded-2xl
          border
          border-dashed
          border-rose-200
          bg-rose-50/30
          text-center
          "
        >
          <div
            className="
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-2xl
            bg-white
            text-rose-500
            shadow-sm
            "
          >
            <Building2 size={25} />
          </div>

          <h2 className="mt-4 font-bold text-slate-900">
            No schools found
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Add a school to begin managing institutions.
          </p>
        </div>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredSchools.map((school) => (
            <div
              key={school.id}
              className="
              rounded-2xl
              border
              border-slate-100
              bg-white
              p-6
              shadow-sm
              transition
              duration-300
              hover:-translate-y-1
              hover:border-rose-100
              hover:shadow-lg
              "
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-xl
                  bg-rose-50
                  text-rose-500
                  "
                >
                  <Building2 size={23} />
                </div>

                <span
                  className={`
                  rounded-full
                  px-3
                  py-1
                  text-xs
                  font-semibold
                  ${
                    school.is_active
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-slate-100 text-slate-500"
                  }
                  `}
                >
                  {school.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <h2 className="mt-5 text-lg font-bold text-slate-900">
                {school.name}
              </h2>

              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-rose-500">
                {school.school_code}
              </p>

              <div className="mt-5 space-y-3 text-sm text-slate-500">
                <div className="flex items-center gap-3">
                  <Mail size={16} />
                  <span className="truncate">{school.email}</span>
                </div>

                <div className="flex items-center gap-3">
                  <Phone size={16} />
                  <span>{school.phone}</span>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin size={16} />
                  <span>
                    {school.city}, {school.state}
                  </span>
                </div>
              </div>

              <Link
            href={`/dashboard/schools/${school.id}`}
            className="
              mt-6
              flex
              w-full
              items-center
              justify-center
              rounded-xl
              border
              border-rose-100
              bg-rose-50/50
              py-2.5
              text-sm
              font-semibold
              text-rose-600
              transition
              hover:bg-rose-100
            "
          >
            View School
          </Link>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
