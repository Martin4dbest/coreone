import { ReactNode } from "react";
import { TenantProvider, Tenant } from "@/context/TenantContext";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{
    tenant: string;
  }>;
}

export default async function TenantLayout({
  children,
  params,
}: LayoutProps) {
  const { tenant } = await params;

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000/api/v1";

  let tenantData: Tenant | null = null;

  try {
    const response = await fetch(
      `${apiUrl}/schools/by-slug/${tenant}`,
      {
        cache: "no-store",
      }
    );

    if (response.ok) {
      const school = await response.json();

      console.log("\n========== TENANT DATA ==========");
      console.log(school);
      console.log("=================================\n");

      tenantData = {
        id: school.id,
        name: school.name,
        code: school.school_code,
        slug: school.slug || school.school_code.toLowerCase(),
        logo_url: school.logo_url || null,
        primary_color: school.primary_color || null,
        secondary_color: school.secondary_color || null,
        login_background_url:
          school.login_background_url || null,
      };
    } else {
      console.error("Tenant not found:", tenant);
    }
  } catch (error) {
    console.error("Tenant resolution failed:", error);
  }

  return (
    <TenantProvider tenant={tenantData}>
      {children}
    </TenantProvider>
  );
}
