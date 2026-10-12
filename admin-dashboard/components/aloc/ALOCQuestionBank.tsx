"use client";

import { useEffect, useState } from "react";
import katex from "katex";
import { jsPDF } from "jspdf";
import "katex/dist/katex.min.css";
import {
  Search,
  BookOpen,
  Loader2,
  AlertCircle,
  ExternalLink,
  LibraryBig,
} from "lucide-react";
import api from "@/lib/api";

type SubjectOption = {
  name: string;
  displayName?: string;
  questionCount?: number;
  examTypes?: string[];
  yearRange?: { min?: number; max?: number };
};

type TopicOption = {
  name: string;
  displayName?: string;
  questionCount?: number;
};

type Question = Record<string, unknown>;

type Props = {
  schoolId?: string;
};

function getQuestions(payload: unknown): Question[] {
  if (Array.isArray(payload)) {
    return payload.filter(
      (item): item is Question =>
        typeof item === "object" && item !== null && !Array.isArray(item)
    );
  }

  if (!payload || typeof payload !== "object") return [];

  const response = payload as Record<string, unknown>;
  const data = response.data;

  if (Array.isArray(data)) {
    return data.filter(
      (item): item is Question =>
        typeof item === "object" && item !== null && !Array.isArray(item)
    );
  }

  if (data && typeof data === "object") {
    const nested = data as Record<string, unknown>;

    for (const key of ["questions", "results", "items"]) {
      if (Array.isArray(nested[key])) {
        return (nested[key] as unknown[]).filter(
          (item): item is Question =>
            typeof item === "object" &&
            item !== null &&
            !Array.isArray(item)
        );
      }
    }
  }

  for (const key of ["questions", "results", "items"]) {
    if (Array.isArray(response[key])) {
      return (response[key] as unknown[]).filter(
        (item): item is Question =>
          typeof item === "object" &&
          item !== null &&
          !Array.isArray(item)
      );
    }
  }

  return [];
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function questionPrompt(question: Question): string {
  const candidates = [
    "question",
    "questionText",
    "question_text",
    "text",
    "content",
    "prompt",
    "body",
  ];

  for (const key of candidates) {
    const value = question[key];
    if (typeof value === "string" && value.trim()) return value;
  }

  return "Question details";
}


function formatExamText(value: string): string {
  const superscripts: Record<string, string> = {
    "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
    "+": "⁺", "-": "⁻",
  };

  const subscripts: Record<string, string> = {
    "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
    "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
  };

  return value
    // Convert explicit degree notation, e.g. 180o -> 180°.
    .replace(/(\d+(?:\.\d+)?)\s*o\b/g, "$1°")
    // Normalize common squared/cubed units.
    .replace(/\b(cm|mm|km|m)\s*3\b/gi, (_, unit: string) => `${unit}³`)
    .replace(/\b(cm|mm|km|m)\s*2\b/gi, (_, unit: string) => `${unit}²`)
    .replace(/\b(cm|mm|km|m)3\b/gi, (_, unit: string) => `${unit}³`)
    .replace(/\b(cm|mm|km|m)2\b/gi, (_, unit: string) => `${unit}²`)
    // Render explicit numeric powers and subscripts.
    .replace(/\^([0-9+-]+)/g, (_, power: string) =>
      [...power].map((char) => superscripts[char] ?? char).join("")
    )
    .replace(/_([0-9]+)/g, (_, subscript: string) =>
      [...subscript].map((char) => subscripts[char] ?? char).join("")
    )
    .replace(/[ \t]+/g, " ")
    .trim();
}


function MathText({ value }: { value: string }) {
  const source = value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<sup\b[^>]*>([\s\S]*?)<\/sup>/gi, "^{$1}")
    .replace(/<sub\b[^>]*>([\s\S]*?)<\/sub>/gi, "_{$1}")
    .replace(/&times;/gi, "×")
    .replace(/&minus;/gi, "−")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/<[^>]*>/g, "")
    .trim();

  const hasMathMarkup =
    /<sup\b|<sub\b|\^\{|_\{|\\\(|\\\[|\$/.test(value) ||
    /\^\s*[+-]?\d/.test(source);

  if (!hasMathMarkup) {
    return <>{formatExamText(source)}</>;
  }

  const instruction =
    /^(.*?\b(?:evaluate|simplify|solve|calculate|find|determine|express)\s+)(.+)$/i
      .exec(source);

  const prefix = instruction?.[1] ?? "";
  let formula = instruction?.[2] ?? source;

  formula = formula
    .replace(/−/g, "-")
    .replace(/×/g, "\\times ")
    .replace(/÷/g, "\\div ")
    .replace(/π/g, "\\pi ")
    .replace(
      /\((\d+)\s*\/\s*(\d+)\)/g,
      "\\left(\\frac{$1}{$2}\\right)"
    )
    .replace(
      /\^\{([+-]?\d+)\s*\/\s*(\d+)\}/g,
      (_, numerator: string, denominator: string) =>
        `^{${numerator.startsWith("-") ? "-" : numerator.startsWith("+") ? "+" : ""}\\frac{${numerator.replace(/^[+-]/, "")}}{${denominator}}}`
    )
    .replace(
      /\^\{([+-]?\d+)\}/g,
      (_, power: string) => `^{${power}}`
    )
    .replace(
      /(?<![A-Za-z\\])(\d+)\s*\/\s*(\d+)/g,
      "\\frac{$1}{$2}"
    );

  const latex =
    (prefix ? `\\text{${prefix.trim().replace(/[{}\\]/g, "")}}\\;` : "") +
    formula;

  try {
    const html = katex.renderToString(latex, {
      throwOnError: false,
      strict: "ignore",
      output: "htmlAndMathml",
    });

    return (
      <span
        className="aloc-math inline-block max-w-full align-middle"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch {
    return <>{formatExamText(source)}</>;
  }
}

function getQuestionImages(question: Question): Array<{
  url: string;
  alt: string;
}> {
  const found = new Map<string, string>();
  const imageKey =
    /image|diagram|figure|illustration|attachment|media|picture|graphic|chart/i;
  const urlKey =
    /^(src|url|href|imageurl|image_url|srcurl|src_url|downloadurl|download_url|imagepath|image_path)$/i;
  const imageExtension =
    /\.(png|jpe?g|gif|webp|svg|bmp|avif)(?:[?#].*)?$/i;

  function walk(
    value: unknown,
    key = "",
    imageContext = false,
    depth = 0
  ): void {
    if (depth > 10 || value == null) return;

    if (typeof value === "string") {
      const candidate = value.trim();
      const isUsableUrl =
        /^(https?:\/\/|data:image\/|blob:|\/)/i.test(candidate);
      const looksLikeImage =
        imageExtension.test(candidate) ||
        (imageContext && urlKey.test(key));

      if (isUsableUrl && (looksLikeImage || imageContext)) {
        found.set(candidate, key || "Question diagram");
      }

      const htmlImage = candidate.match(
        /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i
      );

      if (htmlImage?.[1]) {
        const imageUrl = htmlImage[1].trim();
        if (/^(https?:\/\/|data:image\/|\/)/i.test(imageUrl)) {
          found.set(imageUrl, key || "Question diagram");
        }
      }

      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) =>
        walk(item, key, imageContext || imageKey.test(key), depth + 1)
      );
      return;
    }

    if (typeof value === "object") {
      for (const [childKey, childValue] of Object.entries(
        value as Record<string, unknown>
      )) {
        walk(
          childValue,
          childKey,
          imageContext || imageKey.test(childKey) || urlKey.test(childKey),
          depth + 1
        );
      }
    }
  }

  walk(question);

  return Array.from(found, ([url, label]) => ({
    url,
    alt: label.replace(/[_-]+/g, " "),
  }));
}

async function imageUrlToDataUri(url: string): Promise<string | null> {
  if (url.startsWith("data:image/")) return url;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) return null;

    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    // External servers may block browser access through CORS.
    return null;
  }
}

function QuestionMedia({ question }: { question: Question }) {
  const images = getQuestionImages(question);

  if (!images.length) return null;

  return (
    <div className="my-6 space-y-5">
      {images.map((image, index) => (
        <figure
          key={image.url}
          className="overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-sky-50 shadow-sm"
        >
          <div className="flex items-center gap-2 border-b border-indigo-100 bg-white/80 px-4 py-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <BookOpen size={15} aria-hidden="true" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-800">
              {images.length > 1
                ? `Question diagram ${index + 1}`
                : "Question diagram"}
            </span>
          </div>

          <div className="flex min-h-40 items-center justify-center overflow-x-auto p-3 sm:min-h-52 sm:p-6">
            <img
              src={image.url}
              alt={image.alt || `Diagram for question ${index + 1}`}
              loading="lazy"
              decoding="async"
              className="block h-auto max-h-[620px] w-auto max-w-full rounded-lg object-contain"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          </div>

          {image.alt && !/^(image|diagram|figure|illustration|attachment|media|picture|graphic)$/i.test(image.alt.trim()) && (
            <figcaption className="border-t border-indigo-100 bg-white/70 px-4 py-2 text-center text-xs leading-5 text-slate-600">
              {image.alt}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}

const EXAM_TYPES = [
  { value: "waec", label: "WAEC" },
  { value: "neco", label: "NECO" },
  { value: "jamb", label: "JAMB" },
  { value: "post_utme", label: "Post-UTME" },
  { value: "state", label: "State Examination" },
];

export default function ALOCQuestionBank({ schoolId }: Props) {
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [catalogueError, setCatalogueError] = useState("");

  const [subject, setSubject] = useState("");
  useEffect(() => {
    let active = true;

    async function loadSubjects() {
      setSubjectsLoading(true);
      setCatalogueError("");
      try {
        const response = await api.get("/aloc/subjects", {
          params: schoolId ? { school_id: Number(schoolId) } : {},
        });
        const rows = response.data?.data;
        if (active) {
          setSubjects(Array.isArray(rows) ? rows : []);
          if (!Array.isArray(rows)) {
            setCatalogueError("ALOC returned an unexpected subject catalogue.");
          }
        }
      } catch (err: unknown) {
        const message =
          typeof err === "object" && err !== null && "response" in err
            ? String(
                (err as { response?: { data?: { detail?: unknown } } })
                  .response?.data?.detail || "Could not load ALOC subjects."
              )
            : "Could not load ALOC subjects.";
        if (active) setCatalogueError(message);
      } finally {
        if (active) setSubjectsLoading(false);
      }
    }

    void loadSubjects();
    return () => {
      active = false;
    };
  }, [schoolId]);

  useEffect(() => {
    let active = true;

    async function loadTopics() {
      setTopics([]);
      setTopic("");
      if (!subject) {
        setTopicsLoading(false);
        return;
      }

      setTopicsLoading(true);
      try {
        const response = await api.get(
          `/aloc/subjects/${encodeURIComponent(subject)}/topics`,
          { params: schoolId ? { school_id: Number(schoolId) } : {} }
        );
        const rows = response.data?.data;
        if (active) setTopics(Array.isArray(rows) ? rows : []);
      } catch {
        if (active) setTopics([]);
      } finally {
        if (active) setTopicsLoading(false);
      }
    }

    void loadTopics();
    return () => {
      active = false;
    };
  }, [subject, schoolId]);
  const [examType, setExamType] = useState("");
  const [year, setYear] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [limit, setLimit] = useState("15");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [showSelectedQuestions, setShowSelectedQuestions] = useState(false);

  const toggleQuestionSelection = (question: Question) => {
    const id = question.id ?? question._id ?? question.questionId;
    const key = id != null
      ? String(id)
      : questionPrompt(question) + '-' + displayValue(question.options);

    setSelectedQuestions((current) => {
      const getKey = (item: Question) => {
        const itemId = item.id ?? item._id ?? item.questionId;
        return itemId != null
          ? String(itemId)
          : questionPrompt(item) + '-' + displayValue(item.options);
      };

      const exists = current.some((item) => getKey(item) === key);
      return exists
        ? current.filter((item) => getKey(item) !== key)
        : [...current, question];
    });
  };

  const [pagination, setPagination] = useState<unknown>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const selectedQuestionText = () => selectedQuestions.map((question, index) => {
    const raw = question as Record<string, unknown>;
    const options = Array.isArray(raw.options)
      ? raw.options.map((value, i) => `${String.fromCharCode(65 + i)}. ${displayValue(value)}`)
      : raw.options && typeof raw.options === "object"
        ? Object.entries(raw.options as Record<string, unknown>).map(([key, value]) => `${key}. ${displayValue(value)}`)
        : [];
    const answer = raw.correctAnswer ?? raw.correct_answer ?? raw.answerKey ?? raw.answer_key ?? raw.answer;
    const exam = raw.examType ?? raw.exam_type ?? "ALOC";
    const yearValue = raw.year ? ` (${String(raw.year)})` : "";
    return [
      `${index + 1}. ${questionPrompt(question)}` ,
      `Subject: ${displayValue(raw.subject) || "Not specified"} | Examination: ${String(exam)}${yearValue}`,
      ...options,
      answer !== undefined && answer !== null && String(answer).trim() !== "" ? `Correct answer: ${displayValue(answer)}` : "",
    ].filter(Boolean).join("\n");
  }).join("\n\n");

  const copySelectedQuestions = async () => {
    if (!selectedQuestions.length) return;
    try {
      await navigator.clipboard.writeText(selectedQuestionText());
      window.alert("Your question collection has been copied.");
    } catch {
      setError("Copy failed. Please allow clipboard access in your browser and try again.");
    }
  };

  const exportSelectedQuestionsPdf = async () => {
    if (!selectedQuestions.length) return;

    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const margin = 15;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const maxWidth = pageWidth - margin * 2;
    let y = 18;

    const ensureSpace = (height: number) => {
      if (y + height > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
    };

    const writeText = (value: string, bold = false) => {
      const wrapped = pdf.splitTextToSize(value, maxWidth);
      const lineHeight = 5;
      ensureSpace(wrapped.length * lineHeight + 1);
      pdf.setFont("helvetica", bold ? "bold" : "normal");
      pdf.text(wrapped, margin, y);
      y += wrapped.length * lineHeight + 1;
    };

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("My ALOC Question Collection", margin, y);
    y += 9;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Questions: ${selectedQuestions.length}`, margin, y);
    y += 9;

    for (let index = 0; index < selectedQuestions.length; index++) {
      const question = selectedQuestions[index];
      const raw = question as Record<string, unknown>;
      const options = Array.isArray(raw.options)
        ? raw.options.map((value, i) =>
            `${String.fromCharCode(65 + i)}. ${displayValue(value)}`
          )
        : raw.options && typeof raw.options === "object"
          ? Object.entries(raw.options as Record<string, unknown>).map(
              ([key, value]) => `${key}. ${displayValue(value)}`
            )
          : [];

      const answer =
        raw.correctAnswer ??
        raw.correct_answer ??
        raw.answerKey ??
        raw.answer_key ??
        raw.answer;

      ensureSpace(15);
      if (index > 0) y += 4;
      writeText(`${index + 1}. ${questionPrompt(question)}`, true);
      writeText(
        `Subject: ${displayValue(raw.subject) || "Not specified"} | Exam: ${
          displayValue(raw.examType ?? raw.exam_type) || "ALOC"
        }${raw.year ? ` | Year: ${String(raw.year)}` : ""}`
      );

      const images = getQuestionImages(question);
      for (const image of images) {
        const dataUri = await imageUrlToDataUri(image.url);

        if (dataUri) {
          try {
            const mime = dataUri.slice(5, dataUri.indexOf(";")).toLowerCase();
            const format = mime.includes("jpeg") || mime.includes("jpg")
              ? "JPEG"
              : mime.includes("webp")
                ? "WEBP"
                : mime.includes("svg")
                  ? "SVG"
                  : "PNG";

            const properties = pdf.getImageProperties(dataUri);
            const availableWidth = maxWidth;
            const availableHeight = 65;
            const scale = Math.min(
              availableWidth / properties.width,
              availableHeight / properties.height,
              1
            );
            const imageWidth = properties.width * scale;
            const imageHeight = properties.height * scale;

            ensureSpace(imageHeight + 5);
            pdf.addImage(
              dataUri,
              format,
              margin + (maxWidth - imageWidth) / 2,
              y,
              imageWidth,
              imageHeight
            );
            y += imageHeight + 4;
          } catch {
            writeText(`[Diagram could not be embedded: ${image.url}]`);
          }
        } else {
          writeText(`Diagram link: ${image.url}`);
        }
      }

      options.forEach((option) => writeText(option));
      if (answer !== undefined && answer !== null && String(answer).trim()) {
        writeText(`Correct answer: ${displayValue(answer)}`, true);
      }
      y += 3;
    }

    pdf.save("my-aloc-question-collection.pdf");
  };

  const exportSelectedQuestionsWord = async () => {
    if (!selectedQuestions.length) return;

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const content = await Promise.all(
      selectedQuestions.map(async (question, index) => {
        const raw = question as Record<string, unknown>;
        const options = Array.isArray(raw.options)
          ? raw.options.map((value, i) =>
              `${String.fromCharCode(65 + i)}. ${displayValue(value)}`
            )
          : raw.options && typeof raw.options === "object"
            ? Object.entries(raw.options as Record<string, unknown>).map(
                ([key, value]) => `${key}. ${displayValue(value)}`
              )
            : [];

        const answer =
          raw.correctAnswer ??
          raw.correct_answer ??
          raw.answerKey ??
          raw.answer_key ??
          raw.answer;

        const images = await Promise.all(
          getQuestionImages(question).map(async (image) => {
            const dataUri = await imageUrlToDataUri(image.url);

            if (dataUri) {
              return `<figure style="margin:16px 0;text-align:center">
                <img src="${escapeHtml(dataUri)}"
                  alt="${escapeHtml(image.alt)}"
                  style="max-width:100%;height:auto;max-height:500px"/>
              </figure>`;
            }

            return `<p><b>Question diagram:</b>
              <a href="${escapeHtml(image.url)}">Open diagram</a></p>`;
          })
        );

        return `<section style="page-break-inside:avoid">
          <h3>${index + 1}. ${escapeHtml(questionPrompt(question))}</h3>
          <p><b>Subject:</b> ${escapeHtml(displayValue(raw.subject) || "Not specified")}
          &nbsp; <b>Exam:</b> ${escapeHtml(displayValue(raw.examType ?? raw.exam_type) || "ALOC")}
          &nbsp; <b>Year:</b> ${escapeHtml(displayValue(raw.year) || "Not specified")}</p>
          ${images.join("")}
          ${options.length
            ? `<ol type="A">${options.map((option) =>
                `<li>${escapeHtml(option.replace(/^[A-Z]\.\s*/, ""))}</li>`
              ).join("")}</ol>`
            : ""}
          ${answer !== undefined && answer !== null && String(answer).trim()
            ? `<p><b>Correct answer:</b> ${escapeHtml(displayValue(answer))}</p>`
            : ""}
        </section>`;
      })
    );

    const html = `<html><head><meta charset="utf-8">
      <title>My ALOC Question Collection</title>
      <style>
        body{font-family:Arial,sans-serif;line-height:1.5}
        h1{color:#263780}h3{margin-top:24px}
        li{margin:5px 0}img{object-fit:contain}
      </style></head><body>
      <h1>My ALOC Question Collection</h1>
      <p>Total questions: ${selectedQuestions.length}</p>
      ${content.join("\n")}
      <p><small>Collected from the external ALOC question library.
      This document does not publish questions to CoreOne CBT.</small></p>
      </body></html>`;

    const blob = new Blob(["\ufeff", html], {
      type: "application/msword;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "my-aloc-question-collection.doc";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };


  // Derive available years from ALOC's subject catalogue.
  // ALOC currently exposes a subject year range, not a separate range per exam.
  const availableYears = Array.from(
    new Set(
      subjects
        .filter((item) => {
          if (!examType) return false;
          if (
            subject &&
            item.name.trim().toLowerCase() !== subject.trim().toLowerCase()
          ) {
            return false;
          }
          return (item.examTypes ?? []).some(
            (exam) => exam.toLowerCase() === examType.toLowerCase()
          );
        })
        .flatMap((item) => {
          const min = item.yearRange?.min;
          const max = item.yearRange?.max;
          if (typeof min !== "number" || typeof max !== "number") return [];
          const start = Math.min(min, max);
          const end = Math.max(min, max);
          return Array.from(
            { length: Math.min(end - start + 1, 100) },
            (_, index) => end - index
          );
        })
    )
  ).sort((a, b) => b - a);

  async function searchQuestions(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!subject.trim() && !examType && !year) {
      setError("Enter a subject, choose an examination type, or select a year.");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(false);
    setQuestions([]);
    setPagination(null);

    const params: Record<string, string | number | boolean> = {
      limit: Number(limit),
      random: true,
    };

    if (subject.trim()) params.subject = subject.trim();
    if (examType) params.examType = examType;
    if (year) params.year = Number(year);
    if (topic.trim()) params.topic = topic.trim();
    if (difficulty) params.difficulty = Number(difficulty);

    // Super Admin searches within the selected school workspace.
    if (schoolId) params.school_id = Number(schoolId);

    try {
      const response = await api.get("/aloc/questions", { params });
      const payload = response.data;

      setQuestions(getQuestions(payload));

      if (payload && typeof payload === "object") {
        const root = payload as Record<string, unknown>;
        const data =
          root.data && typeof root.data === "object"
            ? (root.data as Record<string, unknown>)
            : null;

        setPagination(root.pagination ?? data?.pagination ?? null);
      }

      setSearched(true);
    } catch (err: unknown) {
      const responseData =
        typeof err === "object" && err !== null && "response" in err
          ? (
              err as {
                response?: {
                  data?: { detail?: unknown; message?: unknown };
                };
              }
            ).response?.data
          : undefined;

      setError(
        String(
          responseData?.detail ||
            responseData?.message ||
            "Unable to search ALOC. Check the connection and try again."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen space-y-6 bg-slate-50/70 p-4 text-slate-800 sm:p-6 lg:p-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-950 p-6 text-white shadow-lg sm:p-8">
        <div className="relative z-10 flex items-start gap-4">
          <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
            <LibraryBig size={28} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
              External Examination Library
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
              ALOC Question Bank
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Search examination questions by subject, exam type, year and topic.
              This is a separate workspace and does not modify CoreOne CBT.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-700">
            <Search size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Search questions</h2>
            <p className="text-sm text-slate-500">
              Provide at least one of subject, exam type or year.
            </p>
          </div>
        </div>

        <form onSubmit={searchQuestions} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="space-y-1.5 text-sm font-medium">
              <span>Subject</span>
              <select
                value={subject}
                onChange={(event) => {
                  setSubject(event.target.value);
                  setTopic("");
                  setQuestions([]);
                  setSearched(false);
                }}
                disabled={subjectsLoading}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
              >
                <option value="">
                  {subjectsLoading ? "Loading subjects..." : "Select a subject"}
                </option>
                {subjects.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.displayName || item.name}
                    {typeof item.questionCount === "number"
                      ? ` (${item.questionCount.toLocaleString()} questions)`
                      : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-sm font-medium">
              <span>Examination type</span>
              <select
                value={examType}
                onChange={(event) => {
                  setExamType(event.target.value);
                  setYear("");
                  setQuestions([]);
                  setPagination(null);
                  setSearched(false);
                  setError("");
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Any supported exam</option>
                {EXAM_TYPES.map((exam) => (
                  <option key={exam.value} value={exam.value}>
                    {exam.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-sm font-medium">
              <span>Year</span>
              <select
                value={year}
                onChange={(event) => setYear(event.target.value)}
                disabled={!examType || availableYears.length === 0}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
              >
                <option value="">
                  {!examType
                    ? "Select an exam first"
                    : availableYears.length === 0
                      ? "No catalogue years available"
                      : "Any available year"}
                </option>
                {availableYears.map((availableYear) => (
                  <option key={availableYear} value={String(availableYear)}>
                    {availableYear}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-sm font-medium">
              <span>Topic (optional)</span>
              <select
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                disabled={!subject || topicsLoading || topics.length === 0}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
              >
                <option value="">
                  {!subject
                    ? "Select a subject first"
                    : topicsLoading
                      ? "Loading topics..."
                      : topics.length
                        ? "All topics"
                        : "No topic list available"}
                </option>
                {topics.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.displayName || item.name}
                    {typeof item.questionCount === "number"
                      ? ` (${item.questionCount.toLocaleString()} questions)`
                      : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-sm font-medium">
              <span>Difficulty (optional)</span>
              <select
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Any difficulty</option>
                <option value="1">Easy</option>
                <option value="3">Medium</option>
                <option value="5">Hard</option>
              </select>
            </label>

            <label className="space-y-1.5 text-sm font-medium">
              <span>Results per search</span>
              <select
                value={limit}
                onChange={(event) => setLimit(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="5">5 questions</option>
                <option value="10">10 questions</option>
                <option value="15">15 questions</option>
              </select>
            </label>
          </div>

          {catalogueError && (
            <div
              role="status"
              className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
            >
              {catalogueError}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
              <AlertCircle size={19} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Searching ALOC...
              </>
            ) : (
              <>
                <Search size={18} />
                Search question bank
              </>
            )}
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-50 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-900">My Question Collection</h2>
            <p className="mt-1 text-sm text-slate-600">{selectedQuestions.length} question{selectedQuestions.length === 1 ? "" : "s"} selected across your searches</p>
          </div>
          <button type="button" onClick={() => setShowSelectedQuestions((value) => !value)} className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100">
            {showSelectedQuestions ? "Hide preview" : "Preview collection"}
          </button>
        </div>
        {selectedQuestions.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4">
            <button type="button" onClick={copySelectedQuestions} className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700">Copy questions</button>
            <button type="button" onClick={exportSelectedQuestionsPdf} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Export PDF</button>
            <button type="button" onClick={exportSelectedQuestionsWord} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800">Export Word document</button>
            <button type="button" onClick={() => { if (window.confirm("Clear all questions from your collection?")) setSelectedQuestions([]); }} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Clear collection</button>
          </div>
        )}
        {selectedQuestions.length === 0 && <p className="p-5 text-sm text-slate-500">Use “Select question” on any search result. Your collection remains available when you run another search.</p>}
        {showSelectedQuestions && selectedQuestions.length > 0 && (
          <ol className="divide-y divide-slate-100">
            {selectedQuestions.map((question, index) => {
              const raw = question as Record<string, unknown>;
              const options = Array.isArray(raw.options)
                ? raw.options.map((value, i) => `${String.fromCharCode(65 + i)}. ${displayValue(value)}`)
                : raw.options && typeof raw.options === "object"
                  ? Object.entries(raw.options as Record<string, unknown>).map(([key, value]) => `${key}. ${displayValue(value)}`)
                  : [];
              const answer = raw.correctAnswer ?? raw.correct_answer ?? raw.answerKey ?? raw.answer_key ?? raw.answer;
              return (
                <li key={String(raw.id ?? raw._id ?? raw.questionId ?? `${index}-${questionPrompt(question)}`)} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="whitespace-pre-wrap break-words font-semibold text-slate-900">{index + 1}. {questionPrompt(question)}</p>
                      <p className="mt-1 text-xs text-slate-500">{displayValue(raw.subject) || "Subject not specified"} · {displayValue(raw.examType ?? raw.exam_type) || "ALOC"}{raw.year ? ` · ${String(raw.year)}` : ""}</p>
                    </div>
                    <button type="button" onClick={() => toggleQuestionSelection(question)} className="shrink-0 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">Remove</button>
                  </div>
                  <QuestionMedia question={question} />
                  {options.length > 0 && <ul className="mt-3 space-y-1 pl-4 text-sm text-slate-700">{options.map((option, optionIndex) => <li key={`${optionIndex}-${option}`}>{option}</li>)}</ul>}
                  {answer !== undefined && answer !== null && String(answer).trim() !== "" && <p className="mt-3 text-sm font-semibold text-emerald-800">Correct answer: {displayValue(answer)}</p>}
                </li>
              );
            })}
          </ol>
        )}
        <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Exports are generated in your browser. The Word option creates a Word-compatible .doc file, not a .docx file. Nothing is published to CoreOne CBT.</p>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">Search results</h2>
          {searched && (
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
              {questions.length} question{questions.length === 1 ? "" : "s"} returned
            </span>
          )}
        </div>

        {!searched && !loading && !error && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
            <BookOpen className="mx-auto text-slate-400" size={32} />
            <p className="mt-3 font-semibold text-slate-800">
              Your question results will appear here
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Start a search using the filters above.
            </p>
          </div>
        )}

        {searched && questions.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center">
            <p className="font-semibold text-slate-800">No questions found</p>
            <p className="mt-1 text-sm text-slate-500">
              Try another subject, examination type, year or topic.
            </p>
          </div>
        )}

        {questions.map((question, index) => {
          const raw = question as Record<string, unknown>;

          const metadata =
            raw.metadata && typeof raw.metadata === "object"
              ? (raw.metadata as Record<string, unknown>)
              : {};

          const rawOptions = raw.options;
          const optionEntries: Array<[string, unknown]> =
            Array.isArray(rawOptions)
              ? rawOptions.map((value, optionIndex) => [
                  String.fromCharCode(65 + optionIndex),
                  value,
                ])
              : rawOptions && typeof rawOptions === "object"
                ? Object.entries(rawOptions as Record<string, unknown>)
                : [];

          const correctAnswer =
            raw.correctAnswer ??
            raw.correct_answer ??
            raw.answerKey ??
            raw.answer_key;

          const answerLabel =
            correctAnswer === null || correctAnswer === undefined
              ? ""
              : String(correctAnswer);

          const correctOption = optionEntries.find(
            ([key]) => key.toUpperCase() === answerLabel.toUpperCase()
          );

          const score = metadata.difficultyScore;
          const difficultyLabel =
            typeof score === "number"
              ? score <= 2
                ? "Easy"
                : score <= 3
                  ? "Medium"
                  : "Hard"
              : null;

          const details: Array<[string, unknown]> = (
            [
              ["Subject", raw.subject],
              ["Examination", raw.examType ?? raw.exam_type],
              ["Year", raw.year],
              ["Topic", metadata.topic],
              ["Difficulty", difficultyLabel],
            ] as Array<[string, unknown]>
          ).filter(
            ([, value]) =>
              value !== null && value !== undefined && value !== ""
          );

          return (
            <article
              key={String(raw.id ?? raw._id ?? index)}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3 sm:px-6">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                    Question {index + 1}
                  </span>
                  <span className="text-xs text-slate-500">
                    {String(raw.examType ?? raw.exam_type ?? "Examination question")}
                    {raw.year ? ` · ${String(raw.year)}` : ""}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleQuestionSelection(question)}
                  className={`inline-flex shrink-0 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    selectedQuestions.some((item) => {
                      const itemId = item.id ?? item._id ?? item.questionId;
                      const questionId = raw.id ?? raw._id ?? raw.questionId;
                      return itemId != null && questionId != null
                        ? String(itemId) === String(questionId)
                        : questionPrompt(item) === questionPrompt(question);
                    })
                      ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {selectedQuestions.some((item) => {
                    const itemId = item.id ?? item._id ?? item.questionId;
                    const questionId = raw.id ?? raw._id ?? raw.questionId;
                    return itemId != null && questionId != null
                      ? String(itemId) === String(questionId)
                      : questionPrompt(item) === questionPrompt(question);
                  }) ? "Remove selection" : "Select question"}
                </button>
              </div>
              <div className="p-5 sm:p-6">
                <h3 className="whitespace-pre-wrap break-words text-base font-semibold leading-7 text-slate-900 sm:text-lg">
                  <MathText value={questionPrompt(question)} />
                </h3>

                <QuestionMedia question={raw} />

                {optionEntries.length > 0 && (
                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {optionEntries.map(([key, value]) => {
                      const isCorrect =
                        answerLabel !== "" &&
                        key.toUpperCase() === answerLabel.toUpperCase();

                      return (
                        <div
                          key={key}
                          className={`flex min-w-0 items-start gap-3 rounded-xl border p-3 ${
                            isCorrect
                              ? "border-emerald-300 bg-emerald-50"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                              isCorrect
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {key}
                          </span>
                          <div className="min-w-0 flex-1 whitespace-pre-wrap break-words pt-1 text-sm leading-6 text-slate-800">
                            <MathText value={displayValue(value)} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {answerLabel && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">
                      Correct answer
                    </p>
                    <p className="mt-1 text-sm font-semibold text-emerald-900">
                      {answerLabel}
                      {correctOption
                        ? ` — ${String(correctOption[1])}`
                        : ""}
                    </p>
                  </div>
                )}

                {details.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    {details.map(([label, value]) => (
                      <span
                        key={label}
                        className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700"
                      >
                        <span className="font-semibold">{label}:</span>
                        {String(value)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          );
        })}

        {pagination !== null && pagination !== undefined && (
          <p className="text-center text-xs text-slate-500">
            Showing the questions returned for this search.
          </p>
        )}
      </section>

      <p className="text-xs leading-5 text-slate-500">
        Questions are retrieved from the external ALOC API. This interface does
        not create, publish, or alter CoreOne CBT examinations.
      </p>
    </main>
  );
}
