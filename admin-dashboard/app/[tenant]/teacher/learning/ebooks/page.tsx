"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { getAbsoluteUploadUrl } from "@/lib/api";

type Ebook = {
  id: number;
  title: string;
  author?: string | null;
  description?: string | null;
  file_url: string;
  category?: string | null;
  cover_image_url?: string | null;
  file_type?: string | null;
  featured: boolean;
  view_count: number;
  download_count: number;
};

export default function TeacherEbooksPage() {
  const params = useParams();

  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "";

  const fileUrl = (url: string) =>
    url.startsWith("http")
      ? url
      : `${apiBase}${url}`;

  const load = async () => {
    try {
      setLoading(true);

      const response = await api.get("/ebooks", {
        params: {
          search: search || undefined,
        },
      });

      setEbooks(response.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const view = async (id: number) => {
    try {
      await api.post(`/ebooks/${id}/view`);
    } catch {}
  };

  const download = async (book: Ebook) => {
    try {
      await api.post(`/ebooks/${book.id}/download`);
    } catch {}

    window.open(
      fileUrl(book.file_url),
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white md:p-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold text-indigo-400">
          TEACHER LEARNING
        </p>

        <h1 className="mt-1 text-3xl font-bold">
          Teaching Ebooks
        </h1>

        <p className="mt-2 text-slate-400">
          Access digital learning materials available to your school.
        </p>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ebooks..."
          className="mt-7 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 outline-none focus:border-indigo-500"
        />

        {loading ? (
          <div className="mt-8 text-center text-slate-400">
            Loading ebooks...
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ebooks.map((book) => (
              <div
                key={book.id}
                className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
              >
                <div className="flex h-48 items-center justify-center bg-slate-950">
                  {book.cover_image_url ? (
                    <img
                      src={fileUrl(book.cover_image_url)}
                      alt={book.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-6xl">
                      📖
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <h2 className="font-bold">
                    {book.title}
                  </h2>

                  {book.author && (
                    <p className="mt-1 text-sm text-slate-400">
                      {book.author}
                    </p>
                  )}

                  <p className="mt-3 line-clamp-2 text-sm text-slate-500">
                    {book.description ||
                      "Digital learning material"}
                  </p>

                  <div className="mt-4 flex gap-2">
                    <a
                      href={fileUrl(book.file_url)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => view(book.id)}
                      className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-center text-sm font-semibold"
                    >
                      Read
                    </a>

                    <button
                      onClick={() => download(book)}
                      className="rounded-lg bg-slate-800 px-3 py-2"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && ebooks.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-700 p-12 text-center text-slate-400">
            No ebooks available.
          </div>
        )}
      </div>
    </div>
  );
}
