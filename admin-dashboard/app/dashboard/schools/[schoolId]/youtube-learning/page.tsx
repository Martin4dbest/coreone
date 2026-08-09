"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";

type Subject = {
  id: number;
  name: string;
};

type YoutubeVideo = {
  id: number;
  title: string;
  video_url: string;
  description?: string | null;
  subject_id?: number | null;
  subject?: string | null;
  is_active?: boolean;
  published?: boolean;
  created_at?: string;
};

function getYoutubeVideoId(url: string) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "").split("?")[0];
    }

    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v");
      }

      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/embed/")[1]?.split("?")[0];
      }

      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/shorts/")[1]?.split("?")[0];
      }
    }
  } catch {
    return null;
  }

  return null;
}

function getYoutubeThumbnail(url: string) {
  const id = getYoutubeVideoId(url);

  return id
    ? `https://img.youtube.com/vi/${id}/hqdefault.jpg`
    : null;
}

export default function YoutubeLearningPage() {
  const params = useParams();
  const schoolId = String(params.schoolId);

  const [videos, setVideos] = useState<YoutubeVideo[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [published, setPublished] = useState(true);

  const loadVideos = async () => {
    try {
      const response = await api.get("/youtube-learning", {
        params: {
          school_id: schoolId,
        },
      });

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.items || [];

      setVideos(data);
    } catch (error) {
      console.error(
        "Failed to load YouTube learning videos:",
        error
      );
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await api.get("/subjects", {
        params: {
          school_id: schoolId,
        },
      });

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.items || [];

      setSubjects(data);
    } catch (error) {
      console.error("Failed to load subjects:", error);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        await Promise.all([
          loadVideos(),
          loadSubjects(),
        ]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [schoolId]);

  const resetForm = () => {
    setTitle("");
    setVideoUrl("");
    setDescription("");
    setSubjectId("");
    setIsActive(true);
    setPublished(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      alert("Please enter the video title.");
      return;
    }

    if (!videoUrl.trim()) {
      alert("Please enter the YouTube URL.");
      return;
    }

    const videoId = getYoutubeVideoId(videoUrl.trim());

    if (!videoId) {
      alert(
        "Please enter a valid YouTube video URL."
      );
      return;
    }

    setSaving(true);

    try {
      const selectedSubject = subjects.find(
      (item) => item.id === Number(subjectId)
    );

    await api.post("/youtube-learning", {
      title: title.trim(),
      video_url: videoUrl.trim(),
      description: description.trim() || null,
      subject: selectedSubject?.name || null,
      published,
      is_active: isActive,
    });

      alert(
        "YouTube learning video added successfully."
      );

      resetForm();
      await loadVideos();
    } catch (error: any) {
      console.error(
        "Failed to add YouTube learning video:",
        error
      );

      const message =
        error?.response?.data?.detail ||
        "Failed to add the YouTube learning video.";

      alert(
        Array.isArray(message)
          ? message
              .map((item: any) => item.msg)
              .join("\n")
          : message
      );
    } finally {
      setSaving(false);
    }
  };

  const getSubjectName = (video: YoutubeVideo) => {
    if (video.subject) {
      return video.subject;
    }

    if (video.subject_id) {
      const subject = subjects.find(
        (item) => item.id === video.subject_id
      );

      return subject?.name || "Unknown subject";
    }

    return "All subjects";
  };

  const getStatus = (video: YoutubeVideo) => {
    if (video.is_active === false) {
      return "Inactive";
    }

    if (video.published === false) {
      return "Draft";
    }

    return "Published";
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 via-red-500 to-indigo-600 shadow-lg">
          <div className="relative px-6 py-7 sm:px-8 sm:py-9">
            <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10" />
            <div className="absolute -bottom-24 right-32 h-40 w-40 rounded-full bg-white/10" />

            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                {/* YOUTUBE ICON */}
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-xl">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-9 w-9"
                    aria-hidden="true"
                  >
                    <path
                      fill="#FF0000"
                      d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8Z"
                    />
                    <path
                      fill="#fff"
                      d="m9.6 15.8 6.2-3.8-6.2-3.8v7.6Z"
                    />
                  </svg>
                </div>

                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                      Learning
                    </span>

                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90">
                      YouTube
                    </span>
                  </div>

                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    YouTube Learning
                  </h1>

                  <p className="mt-1 max-w-2xl text-sm text-white/85 sm:text-base">
                    Curate approved educational videos for students
                    to watch within the school learning platform.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-white/70">
                  Videos
                </p>
                <p className="mt-1 text-3xl font-bold text-white">
                  {videos.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PLATFORM NOTICE */}
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </div>

          <div>
            <p className="text-sm font-semibold text-indigo-950">
              Controlled student viewing
            </p>
            <p className="mt-1 text-sm leading-6 text-indigo-800">
              Students access these approved videos from the
              school mobile app. The video is presented inside
              the learning experience rather than giving students
              a normal YouTube browsing page.
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
          {/* ADD VIDEO */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6"
                    fill="currentColor"
                  >
                    <path d="M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9Zm4 10h-3v3a1 1 0 0 1-2 0v-3H8a1 1 0 0 1 0-2h3V8a1 1 0 0 1 2 0v3h3a1 1 0 0 1 0 2Z" />
                  </svg>
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Add Learning Video
                  </h2>
                  <p className="text-xs text-slate-500">
                    Add an approved educational resource
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              {/* TITLE */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Video Title
                </label>

                <input
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  placeholder="e.g. Introduction to Digital Literacy"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-50"
                />
              </div>

              {/* URL */}
              <div>
                <label className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span>YouTube URL</span>
                  <span className="text-xs font-normal text-slate-400">
                    Required
                  </span>
                </label>

                <div className="relative">
                  <div className="pointer-events-none absolute left-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg bg-red-600 text-white">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="currentColor"
                    >
                      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8Z" />
                      <path
                        fill="white"
                        d="m9.6 15.8 6.2-3.8-6.2-3.8v7.6Z"
                      />
                    </svg>
                  </div>

                  <input
                    value={videoUrl}
                    onChange={(e) =>
                      setVideoUrl(e.target.value)
                    }
                    placeholder="[https://www.youtube.com/watch?v=](https://www.youtube.com/watch?v=)..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-14 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-50"
                  />
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Paste the normal YouTube video URL. The system
                  will use it as the approved learning source.
                </p>
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  rows={4}
                  placeholder="Briefly describe what students will learn..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                />
              </div>

              {/* SUBJECT */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Subject
                </label>

                <select
                  value={subjectId}
                  onChange={(e) =>
                    setSubjectId(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                >
                  <option value="">
                    All subjects
                  </option>

                  {subjects.map((subject) => (
                    <option
                      key={subject.id}
                      value={subject.id}
                    >
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* STATUS */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Publication settings
                </p>

                <div className="space-y-4">
                  <label className="flex cursor-pointer items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Active
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Keep this learning resource available.
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) =>
                        setIsActive(e.target.checked)
                      }
                      className="h-5 w-5 accent-indigo-600"
                    />
                  </label>

                  <div className="h-px bg-slate-200" />

                  <label className="flex cursor-pointer items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Published
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Published resources can appear to students.
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={published}
                      onChange={(e) =>
                        setPublished(e.target.checked)
                      }
                      className="h-5 w-5 accent-red-600"
                    />
                  </label>
                </div>
              </div>

              {/* SAVE */}
              <button
                type="submit"
                disabled={saving}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-100 transition hover:from-red-700 hover:to-red-600 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <svg
                      className="h-5 w-5 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <path
                        className="opacity-90"
                        d="M21 12a9 9 0 0 0-9-9"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                    </svg>
                    Saving video...
                  </>
                ) : (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </svg>
                    Save YouTube Video
                  </>
                )}
              </button>
            </form>
          </div>

          {/* VIDEO LIBRARY */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Video Library
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Educational videos configured for this school.
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-xs font-semibold text-slate-600">
                    {videos.length} resource
                    {videos.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[360px] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-red-600" />
                  <p className="text-sm font-medium text-slate-500">
                    Loading learning videos...
                  </p>
                </div>
              </div>
            ) : videos.length === 0 ? (
              <div className="flex min-h-[420px] items-center justify-center px-6">
                <div className="max-w-sm text-center">
                  <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-red-50 to-red-100 text-red-600">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-10 w-10"
                      fill="currentColor"
                    >
                      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8Z" />
                      <path
                        fill="white"
                        d="m9.6 15.8 6.2-3.8-6.2-3.8v7.6Z"
                      />
                    </svg>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">
                    No learning videos yet
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Add your first approved educational YouTube
                    video using the form on the left.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {videos.map((video) => {
                  const thumbnail = getYoutubeThumbnail(
                    video.video_url
                  );

                  const status = getStatus(video);

                  return (
                    <div
                      key={video.id}
                      className="group p-5 transition hover:bg-slate-50 sm:p-6"
                    >
                      <div className="flex flex-col gap-5 sm:flex-row">
                        {/* THUMBNAIL */}
                        <div className="relative h-44 w-full shrink-0 overflow-hidden rounded-2xl bg-slate-100 sm:h-28 sm:w-48">
                          {thumbnail ? (
                            <img
                              src={thumbnail}
                              alt=""
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <svg
                                viewBox="0 0 24 24"
                                className="h-10 w-10 text-red-500"
                                fill="currentColor"
                              >
                                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8Z" />
                                <path
                                  fill="white"
                                  d="m9.6 15.8 6.2-3.8-6.2-3.8v7.6Z"
                                />
                              </svg>
                            </div>
                          )}

                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
                            <div className="flex h-10 w-10 scale-90 items-center justify-center rounded-full bg-red-600 text-white opacity-0 shadow-lg transition group-hover:scale-100 group-hover:opacity-100">
                              <svg
                                viewBox="0 0 24 24"
                                className="ml-0.5 h-5 w-5"
                                fill="currentColor"
                              >
                                <path d="m9 6 10 6-10 6V6Z" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* CONTENT */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <h3 className="truncate text-base font-bold text-slate-900">
                                {video.title}
                              </h3>

                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                                  {getSubjectName(video)}
                                </span>

                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    status === "Published"
                                      ? "bg-green-50 text-green-700"
                                      : status === "Inactive"
                                      ? "bg-slate-100 text-slate-600"
                                      : "bg-amber-50 text-amber-700"
                                  }`}
                                >
                                  {status}
                                </span>
                              </div>
                            </div>

                            <span className="shrink-0 text-xs text-slate-400">
                              ID #{video.id}
                            </span>
                          </div>

                          {video.description && (
                            <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                              {video.description}
                            </p>
                          )}

                          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="min-w-0 truncate text-xs text-slate-400">
                              {video.video_url}
                            </p>

                            <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-indigo-600">
                              <svg
                                viewBox="0 0 24 24"
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <rect
                                  x="3"
                                  y="4"
                                  width="18"
                                  height="16"
                                  rx="2"
                                />
                                <path d="m10 9 5 3-5 3V9Z" />
                              </svg>
                              In-app student viewing
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}