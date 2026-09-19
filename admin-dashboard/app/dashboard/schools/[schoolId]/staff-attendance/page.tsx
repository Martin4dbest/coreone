"use client";

import { use, useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Loader2,
  LocateFixed,
  MapPin,
  Save,
  UserRound,
  XCircle,
} from "lucide-react";

import api from "@/lib/api";

type LocationSettings = {
  school_id: number;
  school_name: string;
  latitude: number | null;
  longitude: number | null;
  radius_meters: number;
};

type AttendanceItem = {
  id: number;
  staff_id: number;
  school_id: number;
  staff_name: string;
  employee_number: string;
  attendance_date: string;
  status: string;
  check_in_at: string | null;
  check_in_latitude: number | null;
  check_in_longitude: number | null;
  check_in_accuracy: number | null;
  check_in_distance_meters: number | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatTime(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

function getErrorMessage(error: any) {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    "An unexpected error occurred."
  );
}

export default function StaffAttendancePage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);

  const [location, setLocation] = useState<LocationSettings | null>(null);
  const [records, setRecords] = useState<AttendanceItem[]>([]);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radius, setRadius] = useState("100");
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const [loading, setLoading] = useState(true);
  const [savingLocation, setSavingLocation] = useState(false);
  const [usingLocation, setUsingLocation] = useState(false);
  const [savingMessage, setSavingMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const [locationResponse, reportResponse] = await Promise.all([
        api.get<LocationSettings>(
          `/staff/attendance/location/${schoolId}`,
        ),
        api.get<AttendanceItem[]>(
          `/staff/attendance/report?school_id=${schoolId}&attendance_date=${attendanceDate}`,
        ),
      ]);

      const settings = locationResponse.data;

      setLocation(settings);
      setRecords(reportResponse.data || []);

      setLatitude(
        settings.latitude === null ? "" : String(settings.latitude),
      );
      setLongitude(
        settings.longitude === null ? "" : String(settings.longitude),
      );
      setRadius(String(settings.radius_meters || 100));
    } catch (error: any) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId, attendanceDate]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage("Geolocation is not supported by this browser.");
      return;
    }

    setUsingLocation(true);
    setErrorMessage("");
    setSavingMessage("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(8));
        setLongitude(position.coords.longitude.toFixed(8));
        setUsingLocation(false);
        setSavingMessage(
          "Current browser location loaded. Click Save Location to apply it.",
        );
      },
      (error) => {
        setUsingLocation(false);
        setErrorMessage(
          error.message || "Unable to retrieve the current location.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  const saveLocation = async () => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    const radiusValue = Number(radius);

    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      setErrorMessage("Enter a valid latitude between -90 and 90.");
      return;
    }

    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      setErrorMessage("Enter a valid longitude between -180 and 180.");
      return;
    }

    if (!Number.isFinite(radiusValue) || radiusValue < 20 || radiusValue > 5000) {
      setErrorMessage("Radius must be between 20 and 5000 metres.");
      return;
    }

    try {
      setSavingLocation(true);
      setErrorMessage("");
      setSavingMessage("");

      const response = await api.patch<LocationSettings>(
        `/staff/attendance/location/${schoolId}`,
        {
          latitude: lat,
          longitude: lng,
          radius_meters: radiusValue,
        },
      );

      setLocation(response.data);
      setLatitude(String(response.data.latitude ?? ""));
      setLongitude(String(response.data.longitude ?? ""));
      setRadius(String(response.data.radius_meters));

      setSavingMessage("Staff attendance location saved successfully.");
    } catch (error: any) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSavingLocation(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Staff Attendance
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure the school attendance location and review staff clock-ins.
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <XCircle className="h-5 w-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {savingMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{savingMessage}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Attendance Location
              </h2>
              <p className="text-sm text-slate-500">
                {location?.school_name || `School #${schoolId}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={usingLocation}
            className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {usingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LocateFixed className="h-4 w-4" />
            )}
            {usingLocation
              ? "Getting Current Location..."
              : "Use Current Location"}
          </button>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Latitude
              </label>
              <input
                value={latitude}
                onChange={(event) => setLatitude(event.target.value)}
                placeholder="e.g. 6.524379"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Longitude
              </label>
              <input
                value={longitude}
                onChange={(event) => setLongitude(event.target.value)}
                placeholder="e.g. 3.379206"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Attendance Radius (metres)
              </label>
              <input
                type="number"
                min={20}
                max={5000}
                value={radius}
                onChange={(event) => setRadius(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                Allowed range: 20m to 5000m.
              </p>
            </div>

            <button
              type="button"
              onClick={saveLocation}
              disabled={savingLocation}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {savingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {savingLocation ? "Saving..." : "Save Location"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                Staff Clock-In Records
              </h2>
              <p className="text-sm text-slate-500">
                {records.length} record{records.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={attendanceDate}
                onChange={(event) => setAttendanceDate(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[250px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : records.length === 0 ? (
            <div className="flex min-h-[250px] flex-col items-center justify-center text-center">
              <UserRound className="mb-3 h-10 w-10 text-slate-300" />
              <p className="font-medium text-slate-600">
                No staff clock-ins found
              </p>
              <p className="mt-1 text-sm text-slate-400">
                There are no recorded geofenced clock-ins for {formatDate(attendanceDate)}.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-3">Staff</th>
                    <th className="px-3 py-3">Employee No.</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Check-In</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Distance</th>
                    <th className="px-3 py-3">Accuracy</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                            <UserRound className="h-4 w-4 text-slate-500" />
                          </div>
                          <span className="font-medium text-slate-900">
                            {record.staff_name}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-4 text-slate-600">
                        {record.employee_number}
                      </td>

                      <td className="px-3 py-4 text-slate-600">
                        {formatDate(record.attendance_date)}
                      </td>

                      <td className="px-3 py-4 text-slate-600">
                        {formatTime(record.check_in_at)}
                      </td>

                      <td className="px-3 py-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold capitalize text-green-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {record.status}
                        </span>
                      </td>

                      <td className="px-3 py-4 text-slate-600">
                        {record.check_in_distance_meters == null
                          ? "—"
                          : `${record.check_in_distance_meters.toFixed(1)}m`}
                      </td>

                      <td className="px-3 py-4 text-slate-600">
                        {record.check_in_accuracy == null
                          ? "—"
                          : `±${record.check_in_accuracy.toFixed(1)}m`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
