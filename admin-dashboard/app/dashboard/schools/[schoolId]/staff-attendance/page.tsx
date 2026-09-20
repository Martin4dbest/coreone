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
  location_name: string | null;
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
  check_in_location_name: string | null;
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
  const [locationName, setLocationName] = useState("");
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
          `/staff/attendance/report?school_id=${schoolId}`,
        ),
      ]);

      const settings = locationResponse.data;

      setLocation(settings);

      const sortedRecords = [...(reportResponse.data || [])].sort(
        (a, b) => {
          const aTime = a.check_in_at
            ? new Date(a.check_in_at).getTime()
            : 0;

          const bTime = b.check_in_at
            ? new Date(b.check_in_at).getTime()
            : 0;

          return bTime - aTime;
        },
      );

      setRecords(sortedRecords);
      setLocationName(settings.location_name || "");

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

  useEffect(() => {
    let active = true;

    const refreshAttendance = async () => {
      if (!active) return;

      try {
        const response = await api.get<AttendanceItem[]>(
          `/staff/attendance/report?school_id=${schoolId}`,
        );

        if (active) {
          const sortedRecords = [...(response.data || [])].sort(
            (a, b) => {
              const aTime = a.check_in_at
                ? new Date(a.check_in_at).getTime()
                : 0;

              const bTime = b.check_in_at
                ? new Date(b.check_in_at).getTime()
                : 0;

              return bTime - aTime;
            },
          );

          setRecords(sortedRecords);
        }
      } catch {
        // Keep the existing records visible if a background refresh fails.
      }
    };

    const interval = setInterval(
      refreshAttendance,
      2000,
    );

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [schoolId, attendanceDate]);

  const reverseGeocode = async (
    latitudeValue: number,
    longitudeValue: number,
  ) => {
    try {
      const response = await api.get(
        "/staff/attendance/reverse-geocode",
        {
          params: {
            latitude: latitudeValue,
            longitude: longitudeValue,
          },
        },
      );

      return response.data?.location_name || "";
    } catch {
      return "";
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage("Geolocation is not supported by this browser.");
      return;
    }

    setUsingLocation(true);
    setErrorMessage("");
    setSavingMessage("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setLatitude(lat.toFixed(8));
        setLongitude(lng.toFixed(8));

        const address = await reverseGeocode(lat, lng);

        if (address) {
          setLocationName(address);
          setSavingMessage(
            "Current location and address detected. Click Save Location to apply it.",
          );
        } else {
          setLocationName("");
          setSavingMessage(
            "Current location loaded. The address could not be resolved automatically. Click Save Location to continue.",
          );
        }

        setUsingLocation(false);
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
      setLocationName(response.data.location_name || "");
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

      {location?.location_name && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Configured Address
              </p>

              <p className="mt-1 text-base font-semibold text-slate-900">
                {location.location_name}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                GPS: {location.latitude}, {location.longitude} · Radius: {location.radius_meters}m
              </p>
            </div>
          </div>
        </div>
      )}

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

      {records.length > 0 && records[0].check_in_at && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                Latest Clock-In
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                {records[0].staff_name}
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                {records[0].employee_number} · {formatDate(records[0].attendance_date)}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-white px-4 py-3">
                <p className="text-xs text-slate-500">Check-In</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {formatTime(records[0].check_in_at)}
                </p>
              </div>

              <div className="rounded-xl bg-white px-4 py-3">
                <p className="text-xs text-slate-500">Location</p>
                <p className="mt-1 max-w-[280px] text-sm font-semibold text-slate-900">
                  {records[0].check_in_location_name || "Address unavailable"}
                </p>
              </div>

              <div className="rounded-xl bg-white px-4 py-3">
                <p className="text-xs text-slate-500">Distance</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {records[0].check_in_distance_meters == null
                    ? "—"
                    : `${records[0].check_in_distance_meters.toFixed(1)}m`}
                </p>
              </div>

              <div className="rounded-xl bg-white px-4 py-3">
                <p className="text-xs text-slate-500">GPS Accuracy</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {records[0].check_in_accuracy == null
                    ? "—"
                    : `±${records[0].check_in_accuracy.toFixed(1)}m`}
                </p>
              </div>
            </div>
          </div>
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
                Location / Address
              </label>
              <input
                value={locationName}
                readOnly
                placeholder="Address will appear after detecting the location"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none"
              />
              <p className="mt-1 text-xs text-slate-500">
                This is the readable address resolved from the selected GPS location.
              </p>
            </div>

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
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <p className="text-sm text-slate-500">
                  Live attendance · {records.length} record{records.length === 1 ? "" : "s"}
                </p>
              </div>
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
                    <th className="px-3 py-3">Location</th>
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

                      <td className="max-w-[280px] px-3 py-4 text-slate-600">
                        {record.check_in_location_name || (
                          <span className="text-slate-400">
                            Address unavailable
                          </span>
                        )}
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
