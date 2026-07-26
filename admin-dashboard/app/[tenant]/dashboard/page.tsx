import { redirect } from "next/navigation";

interface Props {
  params: Promise<{
    tenant: string;
  }>;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000/api/v1";

export default async function TenantDashboard({
  params,
}: Props) {
  const { tenant } = await params;

  const response = await fetch(
    `${API_URL}/schools/by-slug/${tenant}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    redirect(`/${tenant}/login`);
  }

  const school = await response.json();

  redirect(
    `/dashboard/schools/${school.id}`
  );
}
