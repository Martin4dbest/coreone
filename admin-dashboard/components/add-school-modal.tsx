"use client";

import { FormEvent, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";

import api from "@/lib/api";

type Props = {
  onSchoolCreated: () => void;
};

type FormData = {
  name: string;
  school_code: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
};

const initialForm: FormData = {
  name: "",
  school_code: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  country: "Nigeria",
};

export default function AddSchoolModal({
  onSchoolCreated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setSubmitting(true);
    setError("");

    try {
      await api.post("/schools", form);

      setForm(initialForm);
      setOpen(false);
      onSchoolCreated();
    } catch (error: any) {
      const detail = error?.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Unable to create school. Please check the details."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="
        inline-flex
        items-center
        justify-center
        gap-2
        rounded-xl
        bg-rose-500
        px-5
        py-2.5
        text-sm
        font-semibold
        text-white
        shadow-sm
        transition
        hover:bg-rose-600
        "
      >
        <Plus size={18} />
        Add School
      </button>

      {open && (
        <div
          className="
          fixed
          inset-0
          z-50
          flex
          items-center
          justify-center
          bg-slate-950/30
          p-4
          backdrop-blur-sm
          "
        >
          <div
            className="
            max-h-[90vh]
            w-full
            max-w-2xl
            overflow-y-auto
            rounded-[28px]
            border
            border-rose-100
            bg-white
            shadow-2xl
            "
          >
            <div
              className="
              sticky
              top-0
              z-10
              flex
              items-center
              justify-between
              border-b
              border-slate-100
              bg-white
              px-7
              py-5
              "
            >
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Add New School
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Register a new institution on PreSense.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="
                rounded-xl
                p-2
                text-slate-400
                transition
                hover:bg-slate-100
                hover:text-slate-700
                "
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-7"
            >
              {error && (
                <div
                  className="
                  rounded-xl
                  border
                  border-red-100
                  bg-red-50
                  px-4
                  py-3
                  text-sm
                  text-red-600
                  "
                >
                  {error}
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <Input
                  label="School Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Example Academy"
                />

                <Input
                  label="School Code"
                  name="school_code"
                  value={form.school_code}
                  onChange={handleChange}
                  placeholder="EXA001"
                />

                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                />

                <Input
                  label="Phone Number"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+234..."
                />

                <Input
                  label="City"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Lagos"
                />

                <Input
                  label="State"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  placeholder="Lagos"
                />
              </div>

              <Input
                label="Address"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="School address"
              />

              <Input
                label="Country"
                name="country"
                value={form.country}
                onChange={handleChange}
                placeholder="Nigeria"
              />

              <div
                className="
                flex
                justify-end
                gap-3
                border-t
                border-slate-100
                pt-5
                "
              >
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="
                  rounded-xl
                  border
                  border-slate-200
                  px-5
                  py-2.5
                  text-sm
                  font-semibold
                  text-slate-600
                  transition
                  hover:bg-slate-50
                  "
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-rose-500
                  px-5
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-rose-600
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                  "
                >
                  {submitting && (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  {submitting
                    ? "Creating..."
                    : "Create School"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

type InputProps = {
  label: string;
  name: string;
  value: string;
  type?: string;
  placeholder?: string;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
};

function Input({
  label,
  name,
  value,
  type = "text",
  placeholder,
  onChange,
}: InputProps) {
  return (
    <label className="block">
      <span
        className="
        mb-2
        block
        text-sm
        font-semibold
        text-slate-700
        "
      >
        {label}
      </span>

      <input
        required
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="
        w-full
        rounded-xl
        border
        border-slate-200
        bg-white
        px-4
        py-3
        text-sm
        text-slate-900
        outline-none
        transition
        placeholder:text-slate-300
        focus:border-rose-300
        focus:ring-4
        focus:ring-rose-50
        "
      />
    </label>
  );
}
