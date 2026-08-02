from pathlib import Path

p = Path("app/dashboard/schools/[schoolId]/cbt/exams/page.tsx")

text = p.read_text()

text = text.replace(
'''{exam.subjectName || exam.subjectId || "-"}''',
'''{exam.subjectName || exam.subject_name || exam.subjectId || exam.subject_id || "-"}'''
)

text = text.replace(
'''{exam.className || exam.classId || "-"}''',
'''{exam.className || exam.class_name || exam.classId || exam.class_id || "-"}'''
)

text = text.replace(
'''{exam.durationMinutes} mins''',
'''{exam.durationMinutes || exam.duration_minutes || 0} mins'''
)

text = text.replace(
'''{exam.questionsCount ?? 0}''',
'''{exam.questionsCount ?? exam.total_questions ?? 0}'''
)

text = text.replace(
'''{exam.totalMarks}''',
'''{exam.totalMarks ?? exam.total_marks ?? "-"}'''
)

text = text.replace(
'''{new Date(exam.createdAt).toLocaleDateString()}''',
'''{exam.createdAt || exam.created_at
                          ? new Date(exam.createdAt || exam.created_at).toLocaleDateString()
                          : "-"}'''
)

p.write_text(text)

print("CBT table fixed")
