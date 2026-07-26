"use client";

import {
  createContext,
  useContext,
  ReactNode,
} from "react";

export interface Tenant {
  id: number;
  name: string;
  code: string;
  slug: string;
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  login_background_url?: string | null;
}

interface TenantContextType {
  tenant: Tenant | null;
}

const TenantContext =
  createContext<TenantContextType>({
    tenant: null,
  });

export function TenantProvider({
  tenant,
  children,
}: {
  tenant: Tenant | null;
  children: ReactNode;
}) {
  return (
    <TenantContext.Provider value={{ tenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
