"use client";

import { FormEvent, use, useEffect, useState } from "react";
import {
  ImageIcon,
  Loader2,
  Palette,
  Save,
  Smartphone,
} from "lucide-react";

import api from "@/lib/api";

type Branding = {
  id: number;
  school_id: number;
  logo_url: string | null;
  app_icon_url: string | null;
  splash_image_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  motto: string | null;
  login_title: string | null;
  login_message: string | null;
  is_active: boolean;
};

type BrandingForm = {
  logo_url: string;
  app_icon_url: string;
  splash_image_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  motto: string;
  login_title: string;
  login_message: string;
};

const defaultForm: BrandingForm = {
  logo_url: "",
  app_icon_url: "",
  splash_image_url: "",
  primary_color: "#2563EB",
  secondary_color: "#1E293B",
  accent_color: "#F43F5E",
  motto: "",
  login_title: "",
  login_message: "",
};

export default function BrandingPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);

  const [branding, setBranding] = useState<Branding | null>(null);
  const [form, setForm] = useState<BrandingForm>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"login" | "icon" | "splash">("login");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadBranding() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get<Branding>(
          `/branding?school_id=${schoolId}`
        );

        const data = response.data;

        setBranding(data);
        setForm({
          logo_url: data.logo_url ?? "",
          app_icon_url: data.app_icon_url ?? "",
          splash_image_url: data.splash_image_url ?? "",
          primary_color: data.primary_color,
          secondary_color: data.secondary_color,
          accent_color: data.accent_color,
          motto: data.motto ?? "",
          login_title: data.login_title ?? "",
          login_message: data.login_message ?? "",
        });
      } catch (err: any) {
        if (err?.response?.status !== 404) {
          setError(
            err?.response?.data?.detail ||
              "Failed to load school branding."
          );
        }
      } finally {
        setLoading(false);
      }
    }

    loadBranding();
  }, [schoolId]);

  function updateField(
    field: keyof BrandingForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleAssetUpload(
    field: "logo_url" | "app_icon_url" | "splash_image_url",
    file: File
  ) {
    try {
      setUploadingAsset(field);
      setError("");
      setSuccess("");

      const assetTypeMap = {
        logo_url: "logo",
        app_icon_url: "app-icon",
        splash_image_url: "splash",
      } as const;

      const uploadData = new FormData();
      uploadData.append("school_id", schoolId);
      uploadData.append("asset_type", assetTypeMap[field]);
      uploadData.append("file", file);

      const response = await api.post<{ url: string }>(
        "/branding/upload-image",
        uploadData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      updateField(field, response.data.url);
      setSuccess(
        "Image uploaded successfully. Save branding changes to keep it."
      );
    } catch (err: any) {
      const detail = err?.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail.map((item) => item?.msg || "Validation error").join(", ")
            : "Failed to upload branding image."
      );
    } finally {
      setUploadingAsset(null);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        logo_url: form.logo_url || null,
        app_icon_url: form.app_icon_url || null,
        splash_image_url: form.splash_image_url || null,
        primary_color: form.primary_color,
        secondary_color: form.secondary_color,
        accent_color: form.accent_color,
        motto: form.motto || null,
        login_title: form.login_title || null,
        login_message: form.login_message || null,
      };

      let response;

      if (branding) {
        response = await api.put<Branding>(
          `/branding/${branding.id}`,
          payload
        );
      } else {
        response = await api.post<Branding>("/branding", {
          school_id: Number(schoolId),
          ...payload,
        });
      }

      setBranding(response.data);
      setSuccess(
        branding
          ? "School branding updated successfully."
          : "School branding created successfully."
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Failed to save school branding."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 size={22} className="animate-spin" />
          Loading branding...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <Palette size={24} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              School Branding
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Customise this school's visual identity and login experience.
            </p>
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

      <form
        onSubmit={handleSubmit}
        className="grid gap-8 xl:grid-cols-[1fr_360px]"
      >
        <div className="space-y-8">
          <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <ImageIcon size={22} className="text-rose-500" />
              <h2 className="text-lg font-bold text-slate-900">
                Brand Assets
              </h2>
            </div>

            <div className="grid gap-5">
              <AssetUpload
                label="School Logo"
                value={form.logo_url}
                uploading={uploadingAsset === "logo_url"}
                onUpload={(file) =>
                  handleAssetUpload("logo_url", file)
                }
              />

              <AssetUpload
                label="App Icon"
                value={form.app_icon_url}
                uploading={uploadingAsset === "app_icon_url"}
                onUpload={(file) =>
                  handleAssetUpload("app_icon_url", file)
                }
              />

              <AssetUpload
                label="Splash Image"
                value={form.splash_image_url}
                uploading={uploadingAsset === "splash_image_url"}
                onUpload={(file) =>
                  handleAssetUpload("splash_image_url", file)
                }
              />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <Palette size={22} className="text-rose-500" />
              <h2 className="text-lg font-bold text-slate-900">
                Brand Colours
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <ColorInput
                label="Primary Colour"
                value={form.primary_color}
                onChange={(value) =>
                  updateField("primary_color", value)
                }
              />

              <ColorInput
                label="Secondary Colour"
                value={form.secondary_color}
                onChange={(value) =>
                  updateField("secondary_color", value)
                }
              />

              <ColorInput
                label="Accent Colour"
                value={form.accent_color}
                onChange={(value) =>
                  updateField("accent_color", value)
                }
              />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <Smartphone size={22} className="text-rose-500" />
              <h2 className="text-lg font-bold text-slate-900">
                Login Experience
              </h2>
            </div>

            <div className="space-y-5">
              <BrandInput
                label="School Motto"
                value={form.motto}
                onChange={(value) => updateField("motto", value)}
                placeholder="Knowledge, character and excellence"
              />

              <BrandInput
                label="Login Title"
                value={form.login_title}
                onChange={(value) =>
                  updateField("login_title", value)
                }
                placeholder="Welcome to our school"
              />

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Login Message
                </label>

                <textarea
                  rows={4}
                  value={form.login_message}
                  onChange={(event) =>
                    updateField(
                      "login_message",
                      event.target.value
                    )
                  }
                  placeholder="Enter a welcome message for students, parents and staff."
                  className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                />
              </div>
            </div>
          </section>

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 size={19} className="animate-spin" />
                Saving branding...
              </>
            ) : (
              <>
                <Save size={19} />
                {branding
                  ? "Save Branding Changes"
                  : "Create School Branding"}
              </>
            )}
          </button>
        </div>

        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:sticky xl:top-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        Live Preview
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1">
        {(["login", "icon", "splash"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setPreviewMode(mode)}
            className={`rounded-xl px-3 py-2 text-xs font-semibold capitalize transition ${
              previewMode === mode
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {previewMode === "login" && (
        <div
          className="mt-5 overflow-hidden rounded-[28px] border border-slate-200 shadow-lg"
          style={{ backgroundColor: form.primary_color }}
        >
          <div className="flex min-h-[520px] flex-col p-6">
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              {form.logo_url ? (
                <img
                  src={form.logo_url}
                  alt="School logo preview"
                  className="mb-5 h-24 w-24 rounded-2xl bg-white object-contain p-2 shadow-lg"
                />
              ) : (
                <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-2xl bg-white/20 text-white">
                  <ImageIcon size={36} />
                </div>
              )}

              <h3 className="text-2xl font-bold text-white">
                {form.login_title || "Welcome to your school"}
              </h3>

              <p className="mt-3 text-sm leading-6 text-white/80">
                {form.login_message ||
                  "Your school's personalised PreSense experience."}
              </p>

              {form.motto && (
                <p
                  className="mt-5 rounded-full px-4 py-2 text-xs font-semibold text-white"
                  style={{ backgroundColor: form.accent_color }}
                >
                  {form.motto}
                </p>
              )}
            </div>

            <div
              className="rounded-2xl p-4 text-center text-sm font-semibold text-white"
              style={{ backgroundColor: form.secondary_color }}
            >
              Sign in to continue
            </div>
          </div>
        </div>
      )}

      {previewMode === "icon" && (
        <div className="mt-5 flex min-h-[520px] flex-col items-center justify-center rounded-[28px] border border-slate-200 bg-slate-100 p-8 text-center">
          {form.app_icon_url ? (
            <img
              src={form.app_icon_url}
              alt="App icon preview"
              className="h-40 w-40 rounded-[36px] object-cover shadow-2xl"
            />
          ) : (
            <div className="flex h-40 w-40 items-center justify-center rounded-[36px] bg-white shadow-xl">
              <ImageIcon size={48} className="text-slate-300" />
            </div>
          )}

          <h3 className="mt-6 text-lg font-bold text-slate-900">
            School App Icon
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Used for the school's app and branded identity.
          </p>
        </div>
      )}

      {previewMode === "splash" && (
        <div
          className="relative mt-5 min-h-[520px] overflow-hidden rounded-[28px] border border-slate-200 shadow-lg"
          style={{ backgroundColor: form.primary_color }}
        >
          {form.splash_image_url && (
            <img
              src={form.splash_image_url}
              alt="Splash screen preview"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          <div className="absolute inset-0 bg-black/30" />

          <div className="relative flex min-h-[520px] flex-col items-center justify-center p-8 text-center text-white">
            {form.logo_url && (
              <img
                src={form.logo_url}
                alt="School logo"
                className="mb-5 h-24 w-24 rounded-2xl bg-white object-contain p-2 shadow-xl"
              />
            )}

            <h3 className="text-2xl font-bold">
              {form.login_title || "Welcome"}
            </h3>

            {form.motto && (
              <p className="mt-3 text-sm font-medium text-white/90">
                {form.motto}
              </p>
            )}
          </div>
        </div>
      )}
    </aside>
      </form>
    </div>
  );
}

function AssetUpload({
  label,
  value,
  uploading,
  onUpload,
}: {
  label: string;
  value: string;
  uploading: boolean;
  onUpload: (file: File) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
          {value ? (
            <img
              src={value}
              alt={`${label} preview`}
              className="h-full w-full object-contain"
            />
          ) : (
            <ImageIcon size={24} className="text-slate-400" />
          )}
        </div>

        <label className="cursor-pointer rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
          {uploading ? "Uploading..." : "Choose Image"}

          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={uploading}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (file) {
                onUpload(file);
              }

              event.target.value = "";
            }}
          />
        </label>
      </div>
    </div>
  );
}

function BrandInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
      />
    </div>
  );
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-2">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-12 cursor-pointer rounded-lg border-0 bg-transparent"
        />

        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm font-medium uppercase text-slate-700 outline-none"
        />
      </div>
    </div>
  );
}
