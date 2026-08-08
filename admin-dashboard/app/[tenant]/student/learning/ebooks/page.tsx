"use client";

import { useEffect, useMemo, useState } from "react";
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
  file_size?: number | null;
  featured: boolean;
  download_count: number;
  view_count: number;
};

export default function StudentEbooksPage() {
  const params = useParams();
  const tenant = String(params.tenant);

  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [recent, setRecent] = useState<Ebook[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
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

      const [books, latest, cats] = await Promise.all([
        api.get("/ebooks", {
          params: {
            search: search || undefined,
            category: category || undefined,
          },
        }),
        api.get("/ebooks/recent", {
          params: { limit: 6 },
        }),
        api.get("/ebooks/categories"),
      ]);

      setEbooks(books.data || []);
      setRecent(latest.data || []);
      setCategories(cats.data || []);
    } catch (error) {
      console.error("Failed loading ebooks", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [search, category]);

  const featured = useMemo(
    () => ebooks.filter((book) => book.featured),
    [ebooks]
  );

  const trackView = async (id: number) => {
    try {
      await api.post(`/ebooks/${id}/view`);
    } catch (error) {
      console.error(error);
    }
  };

  const download = async (book: Ebook) => {
    try {
      await api.post(`/ebooks/${book.id}/download`);
    } catch (error) {
      console.error(error);
    }

    window.open(
      fileUrl(book.file_url),
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 px-5 py-8 text-white md:px-8">
      <div className="mx-auto max-w-7xl">
        <div>
          <p className="text-sm font-semibold text-indigo-400">
            MY LEARNING
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            Ebook Library
          </h1>

          <p className="mt-2 text-slate-400">
            Read and download learning materials provided by your school.
          </p>
        </div>

        <div className="mt-7 flex flex-col gap-3 md:flex-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ebooks..."
            className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 outline-none focus:border-indigo-500"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"
          >
            <option value="">All categories</option>

            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {featured.length > 0 && !search && !category && (
          <section className="mt-10">
            <div className="mb-4">
              <h2 className="text-xl font-bold">
                Featured
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {featured.slice(0, 3).map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  fileUrl={fileUrl}
                  onView={trackView}
                  onDownload={download}
                  featured
                />
              ))}
            </div>
          </section>
        )}

        {!search && !category && recent.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-xl font-bold">
              Recently Added
            </h2>

            <div className="grid gap-5 md:grid-cols-3 xl:grid-cols-4">
              {recent.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  fileUrl={fileUrl}
                  onView={trackView}
                  onDownload={download}
                />
              ))}
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="mb-4 text-xl font-bold">
            All Ebooks
          </h2>

          {loading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center text-slate-400">
              Loading library...
            </div>
          ) : ebooks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 p-12 text-center text-slate-400">
              No ebooks available.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {ebooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  fileUrl={fileUrl}
                  onView={trackView}
                  onDownload={download}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function BookCard({
  book,
  fileUrl,
  onView,
  onDownload,
  featured = false,
}: {
  book: Ebook;
  fileUrl: (url: string) => string;
  onView: (id: number) => void;
  onDownload: (book: Ebook) => void;
  featured?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      <div className="relative flex h-52 items-center justify-center bg-slate-950">
        {book.cover_image_url ? (
          <img
            src={fileUrl(book.cover_image_url)}
            alt={book.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-6xl">📖</span>
        )}

        {(featured || book.featured) && (
          <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-2 py-1 text-xs font-bold text-black">
            ★ Featured
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold">
          {book.title}
        </h3>

        {book.author && (
          <p className="mt-1 text-sm text-slate-400">
            {book.author}
          </p>
        )}

        {book.category && (
          <span className="mt-3 inline-block rounded-full bg-indigo-500/10 px-2 py-1 text-xs text-indigo-300">
            {book.category}
          </span>
        )}

        {book.description && (
          <p className="mt-3 line-clamp-2 text-sm text-slate-400">
            {book.description}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <a
            href={fileUrl(book.file_url)}
            target="_blank"
            rel="noreferrer"
            onClick={() => onView(book.id)}
            className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-center text-sm font-semibold hover:bg-indigo-500"
          >
            Read
          </a>

          <button
            onClick={() => onDownload(book)}
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold hover:bg-slate-700"
          >
            ↓
          </button>
        </div>

        <div className="mt-3 text-xs text-slate-600">
          {book.view_count || 0} views ·{" "}
          {book.download_count || 0} downloads
        </div>
      </div>
    </div>
  );
}
