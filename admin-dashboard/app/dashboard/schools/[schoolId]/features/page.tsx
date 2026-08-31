"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Power,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";

import api from "@/lib/api";

type School = {
  id: number;
  name: string;
  school_code: string;
};

type SchoolFeature = {
  id: number;
  school_id: number;
  feature_key: string;
  enabled: boolean;
};

type FeatureDefinition = {
  key: string;
  name: string;
  description: string;
};

const FEATURES: FeatureDefinition[] = [
  {
    key: "students",
    name: "Students",
    description: "Student enrollment and learner management.",
  },
  {
    key: "teachers",
    name: "Teachers",
    description: "Teacher management and teaching assignments.",
  },
  {
    key: "staff",
    name: "Staff",
    description: "School staff and personnel management.",
  },
  {
    key: "classes",
    name: "Classes",
    description: "Classroom and class management.",
  },
  {
    key: "academics",
    name: "Academics",
    description: "Levels, subjects, classes and academic records.",
  },
  {
    key: "attendance",
    name: "Attendance",
    description: "Student attendance management and monitoring.",
  },
  {
    key: "learning",
    name: "Learning",
    description: "The school's digital learning centre.",
  },
  {
    key: "school_books",
    name: "School Books",
    description: "School book management and physical book resources.",
  },
  {
    key: "school_bus",
    name: "School Bus",
    description: "School transportation and bus management.",
  },
  {
    key: "ebooks",
    name: "Ebooks",
    description: "Digital books and ebook resources.",
  },
  {
    key: "browser",
    name: "Internal Browser",
    description: "Approved educational websites and resources.",
  },
  {
    key: "youtube_learning",
    name: "YouTube Learning",
    description: "Controlled educational video learning.",
  },
  {
    key: "cbt",
    name: "CBT",
    description: "Computer Based Tests and online examinations.",
  },
  {
    key: "results",
    name: "Results",
    description: "Student results and academic reporting.",
  },
  {
    key: "events",
    name: "Events",
    description: "School events and activities.",
  },
  {
    key: "notifications",
    name: "Notifications",
    description: "Manage school-wide and individual student notifications.",
  },
  {
    key: "settings",
    name: "Settings",
    description: "School configuration and settings.",
  },
  {
    key: "partner_schools",
    name: "Partner Schools",
    description: "Manage partner-school relationships and student partner school associations.",
  },
  {
    key: "licensing",
    name: "Licensing",
    description: "View school licensing information and registered-user licensing summary.",
  },
  {
    key: "branding",
    name: "Branding",
    description: "School logo, colours and branding configuration.",
  },
];

export default function SchoolFeaturesPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);

  const [school, setSchool] = useState<School | null>(null);
  const [features, setFeatures] = useState<SchoolFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
   * Feature waiting for confirmation.
   *
   * null = no confirmation popup.
   * SchoolFeature = popup is open for that feature.
   */
  const [confirmFeature, setConfirmFeature] =
    useState<SchoolFeature | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [schoolResponse, featureResponse] =
        await Promise.all([
          api.get(`/schools/${schoolId}`),
          api.get(`/school-features/${schoolId}`),
        ]);

      setSchool(schoolResponse.data);
      setFeatures(featureResponse.data || []);
    } catch (requestError) {
      console.error(
        "Failed to load school features:",
        requestError
      );

      setError(
        "Unable to load the school's feature settings."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [schoolId]);

  function isEnabled(featureKey: string) {
    const feature = features.find(
      (item) => item.feature_key === featureKey
    );

    /*
     * Missing records remain ON for safety.
     * A missing database record must never hide
     * an existing working module.
     */
    return feature?.enabled ?? true;
  }

  /*
   * Opens the confirmation popup.
   *
   * IMPORTANT:
   * This does NOT make an API request.
   */
  function requestToggle(featureKey: string) {
    if (actionKey) {
      return;
    }

    const existingFeature = features.find(
      (item) => item.feature_key === featureKey
    );

    /*
     * If the database has no record, we still need
     * a temporary object so the confirmation modal
     * knows which feature is being changed.
     */
    const featureForConfirmation: SchoolFeature =
      existingFeature || {
        id: 0,
        school_id: Number(schoolId),
        feature_key: featureKey,
        enabled: isEnabled(featureKey),
      };

    setConfirmFeature(featureForConfirmation);
  }

  /*
   * Closes the confirmation popup without making
   * any API request.
   */
  function cancelToggle() {
    if (actionKey) {
      return;
    }

    setConfirmFeature(null);
  }

  /*
   * This is the ONLY function that performs the
   * actual feature toggle API request.
   */
  async function toggleFeature(featureKey: string) {
    const currentState = isEnabled(featureKey);

    try {
      setActionKey(featureKey);
      setError("");
      setSuccess("");

      const response =
        await api.patch<SchoolFeature>(
          `/school-features/${schoolId}/${featureKey}`,
          {
            enabled: !currentState,
          }
        );

      setFeatures((current) => {
        const exists = current.some(
          (item) =>
            item.feature_key === featureKey
        );

        if (exists) {
          return current.map((item) =>
            item.feature_key === featureKey
              ? response.data
              : item
          );
        }

        return [...current, response.data];
      });

      const featureName =
        FEATURES.find(
          (item) => item.key === featureKey
        )?.name || featureKey;

      setSuccess(
        `${featureName} ${
          !currentState ? "enabled" : "disabled"
        } for this school.`
      );
    } catch (requestError) {
      console.error(
        "Failed to toggle school feature:",
        requestError
      );

      setError(
        "Unable to change this feature. No existing page was changed."
      );
    } finally {
      setActionKey(null);
      setConfirmFeature(null);
    }
  }

  /*
   * Final confirmation action.
   *
   * The user has explicitly agreed, so now and only
   * now do we call the existing toggle API function.
   */
  function confirmToggle() {
    if (!confirmFeature || actionKey) {
      return;
    }

    void toggleFeature(confirmFeature.feature_key);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2
            size={32}
            className="mx-auto animate-spin text-indigo-500"
          />

          <p className="mt-3 text-sm text-slate-500">
            Loading feature controls...
          </p>
        </div>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700">
        School unavailable.
      </div>
    );
  }

  const enabledCount = FEATURES.filter(
    (feature) => isEnabled(feature.key)
  ).length;

  const disabledCount =
    FEATURES.length - enabledCount;

  const confirmationDefinition =
    confirmFeature
      ? FEATURES.find(
          (feature) =>
            feature.key ===
            confirmFeature.feature_key
        )
      : null;

  const confirmationName =
    confirmationDefinition?.name ||
    confirmFeature?.feature_key ||
    "this feature";

  const confirmationEnabled =
    confirmFeature
      ? isEnabled(confirmFeature.feature_key)
      : false;

  const confirmationBusy =
    confirmFeature !== null &&
    actionKey === confirmFeature.feature_key;

  return (
    <>
      <div className="space-y-6">
        <Link
          href={`/dashboard/schools/${schoolId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-rose-500"
        >
          <ArrowLeft size={17} />
          Back to School Workspace
        </Link>

        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-8 text-white">
            <div className="flex items-start gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                <ShieldCheck size={27} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">
                  Super Admin
                </p>

                <h1 className="mt-2 text-3xl font-bold">
                  Feature Control
                </h1>

                <p className="mt-2 text-sm text-slate-300">
                  {school.name}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  School Code: {school.school_code}
                </p>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
                  Turn school modules on or off without
                  modifying the underlying feature pages.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <div className="flex items-center gap-3">
                <CheckCircle2
                  size={21}
                  className="text-emerald-600"
                />

                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {enabledCount}
                  </p>

                  <p className="text-xs font-medium text-slate-500">
                    Features enabled
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <XCircle
                  size={21}
                  className="text-slate-500"
                />

                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {disabledCount}
                  </p>

                  <p className="text-xs font-medium text-slate-500">
                    Features disabled
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
            {success}
          </div>
        )}

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {FEATURES.map((feature) => {
            const enabled = isEnabled(feature.key);
            const busy = actionKey === feature.key;

            return (
              <div
                key={feature.key}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {feature.name}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {feature.description}
                    </p>
                  </div>

                  <div
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                      enabled
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {enabled ? "ON" : "OFF"}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    requestToggle(feature.key)
                  }
                  disabled={
                    busy || actionKey !== null
                  }
                  className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    enabled
                      ? "border border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
                      : "bg-emerald-500 text-white hover:bg-emerald-600"
                  }`}
                >
                  {busy ? (
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                  ) : (
                    <Power size={18} />
                  )}

                  {busy
                    ? "Updating..."
                    : enabled
                      ? "Turn Off"
                      : "Turn On"}
                </button>
              </div>
            );
          })}
        </section>
      </div>

      {/* =====================================================
          FEATURE CONFIRMATION MODAL
          ===================================================== */}
      {confirmFeature && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="feature-confirmation-title"
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* Modal header */}
            <div
              className={`p-6 ${
                confirmationEnabled
                  ? "bg-red-50"
                  : "bg-emerald-50"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    confirmationEnabled
                      ? "bg-red-100 text-red-600"
                      : "bg-emerald-100 text-emerald-600"
                  }`}
                >
                  {confirmationEnabled ? (
                    <XCircle size={25} />
                  ) : (
                    <CheckCircle2 size={25} />
                  )}
                </div>

                <button
                  type="button"
                  onClick={cancelToggle}
                  disabled={confirmationBusy}
                  aria-label="Close confirmation"
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              <h2
                id="feature-confirmation-title"
                className="mt-5 text-2xl font-bold text-slate-900"
              >
                {confirmationEnabled
                  ? "Disable Feature?"
                  : "Enable Feature?"}
              </h2>

              <p className="mt-2 text-sm font-semibold text-slate-600">
                {confirmationName}
              </p>
            </div>

            {/* Modal body */}
            <div className="p-6">
              <p className="text-sm leading-7 text-slate-600">
                {confirmationEnabled
                  ? `You are about to disable ${confirmationName} for this school. Users will no longer have access to this feature.`
                  : `You are about to enable ${confirmationName} for this school. This feature will become available to the school's users.`}
              </p>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  School
                </p>

                <p className="mt-1 text-sm font-bold text-slate-800">
                  {school.name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {school.school_code}
                </p>
              </div>

              {/* Modal actions */}
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={cancelToggle}
                  disabled={confirmationBusy}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmToggle}
                  disabled={confirmationBusy}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    confirmationEnabled
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {confirmationBusy && (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  {confirmationBusy
                    ? confirmationEnabled
                      ? "Disabling..."
                      : "Enabling..."
                    : confirmationEnabled
                      ? "Agree & Disable"
                      : "Agree & Enable"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
