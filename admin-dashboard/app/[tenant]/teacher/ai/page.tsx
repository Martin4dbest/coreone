"use client";

import { useEffect, useState } from "react";
import { AlertCircle, BrainCircuit, KeyRound, Loader2, X } from "lucide-react";
import { useParams } from "next/navigation";

import api from "@/lib/api";
import AICBTGenerator from "@/components/ai-cbt-generator";

type School = {
  id: number;
};

type AccessStatus = {
  allowed: boolean;
  reason: string;
};

export default function TeacherAIPage() {
  const params = useParams();
  const tenant = String(params?.tenant || "");

  const [schoolId, setSchoolId] = useState<number | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [error, setError] = useState("");

  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState("");

  async function checkAccess(resolvedSchoolId: number) {
    const response = await api.get<AccessStatus>(
      `/ai/cbt/access/status/${resolvedSchoolId}`
    );

    return response.data;
  }

  useEffect(() => {
    let mounted = true;

    async function loadAccess() {
      try {
        const schoolResponse = await api.get<School>("/schools/me");
        const resolvedSchoolId = Number(schoolResponse.data.id);

        if (!resolvedSchoolId) {
          throw new Error("Unable to determine your school.");
        }

        const access = await checkAccess(resolvedSchoolId);

        if (!mounted) {
          return;
        }

        setSchoolId(resolvedSchoolId);

        if (!access.allowed && access.reason === "passcode_required") {
          setShowPasscodeModal(true);
        } else if (!access.allowed) {
          setError(
            "AI Studio is currently unavailable for your account."
          );
        }
      } catch (err: unknown) {
        if (!mounted) {
          return;
        }

        const detail =
          (
            err as {
              response?: {
                data?: {
                  detail?: string;
                };
              };
              message?: string;
            }
          )?.response?.data?.detail ||
          (err as { message?: string })?.message ||
          "Unable to check AI Studio access.";

        setError(detail);
      } finally {
        if (mounted) {
          setCheckingAccess(false);
        }
      }
    }

    loadAccess();

    return () => {
      mounted = false;
    };
  }, []);

  async function redeemPasscode() {
    const cleanCode = passcode.trim().toUpperCase();

    if (!cleanCode) {
      setRedeemError("Please enter the class teacher passcode.");
      return;
    }

    setRedeeming(true);
    setRedeemError("");

    try {
      await api.post("/ai/cbt/access/redeem", {
        code: cleanCode,
      });

      setShowPasscodeModal(false);
      setPasscode("");
    } catch (err: unknown) {
      const detail =
        (
          err as {
            response?: {
              data?: {
                detail?: string;
              };
            };
            message?: string;
          }
        )?.response?.data?.detail ||
        (err as { message?: string })?.message ||
        "Unable to redeem the passcode.";

      setRedeemError(detail);
    } finally {
      setRedeeming(false);
    }
  }

  if (checkingAccess) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-600" />
          <p className="mt-3 text-sm font-semibold text-slate-500">
            Checking AI Studio access...
          </p>
        </div>
      </div>
    );
  }

  if (!schoolId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm">
            <AlertCircle className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-2xl font-black text-slate-900">
            AI Studio unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm">
            <AlertCircle className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-2xl font-black text-slate-900">
            AI Studio unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showPasscodeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <BrainCircuit className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    AI CBT Authorization
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Your account is not currently authorized for AI CBT.
                    Enter the passcode issued to you by your Class Teacher.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowPasscodeModal(false);
                  setError(
                    "A Class Teacher passcode is required to access AI CBT."
                  );
                }}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Class Teacher Passcode
              </label>

              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={passcode}
                  onChange={(event) =>
                    setPasscode(event.target.value.toUpperCase())
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      redeemPasscode();
                    }
                  }}
                  placeholder="CT-XXXXX-XXXXX"
                  autoFocus
                  className="w-full rounded-2xl border border-slate-300 bg-white py-3.5 pl-11 pr-4 text-sm font-bold tracking-[0.12em] text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              {redeemError && (
                <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {redeemError}
                </div>
              )}

              <button
                type="button"
                onClick={redeemPasscode}
                disabled={redeeming}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3.5 text-sm font-black text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {redeeming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    Unlock AI CBT
                  </>
                )}
              </button>

              <p className="mt-4 text-center text-xs leading-5 text-slate-400">
                The passcode is assigned specifically to your teacher
                account and cannot be used by another teacher.
              </p>
            </div>
          </div>
        </div>
      )}

      {!showPasscodeModal ? (
        <AICBTGenerator
          schoolId={String(schoolId)}
          teacherOnly
          teacherBase={`/${tenant}/teacher/learning/cbt`}
        />
      ) : (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <div className="max-w-lg rounded-3xl border border-violet-200 bg-violet-50 p-8 text-center">
            <BrainCircuit className="mx-auto h-10 w-10 text-violet-600" />
            <h1 className="mt-4 text-xl font-black text-slate-900">
              AI CBT Authorization Required
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Enter the passcode issued by your Class Teacher to continue.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
