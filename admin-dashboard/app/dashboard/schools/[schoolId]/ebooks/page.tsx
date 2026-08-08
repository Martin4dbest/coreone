import { redirect } from "next/navigation";
import { getAbsoluteUploadUrl } from "@/lib/api";

export default async function EbooksPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = await params;

  redirect(
    `/dashboard/schools/${schoolId}/learning/ebooks`
  );
}
