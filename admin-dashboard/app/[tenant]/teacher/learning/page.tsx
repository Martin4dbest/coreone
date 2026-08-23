"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpen,
  MonitorPlay,
  Globe,
  FileQuestion,
} from "lucide-react";
import api from "@/lib/api";

type LearningItem = {
  title: string;
  description: string;
  href: string;
  icon: any;
};

export default function TeacherLearningPage() {
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const response = await api.get(
          "/teachers/me/class-teacher-status"
        );

        if (active) {
          setIsClassTeacher(
            response?.data?.is_class_teacher === true
          );
        }
      } catch (error) {
        console.error(
          "[teacher-learning] Class Teacher check failed:",
          error
        );

        if (active) {
          setIsClassTeacher(false);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const items: LearningItem[] = [
    {
      title: "Ebooks",
      description: "Access digital learning materials",
      href: "learning/ebooks",
      icon: BookOpen,
    },

    ...(isClassTeacher
      ? [
          {
            title: "CBT",
            description:
              "Create and manage computer-based tests",
            href: "learning/cbt",
            icon: FileQuestion,
          },
          {
            title: "YouTube Learning",
            description:
              "Access educational YouTube resources",
            href: "learning/youtube",
            icon: MonitorPlay,
          },
          {
            title: "Browser",
            description:
              "Explore approved learning websites",
            href: "learning/browser",
            icon: Globe,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Teacher Learning
          </h1>

          <p className="mt-2 text-gray-500">
            Access your available teaching and learning
            resources.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">
            Loading learning resources...
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
                    <Icon className="h-6 w-6" />
                  </div>

                  <h2 className="text-xl font-semibold">
                    {item.title}
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    {item.description}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
