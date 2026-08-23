import { create } from "zustand";

import api from "@/lib/api";

type CurrentUser = {
  is_primary_school_admin?: boolean;
  id: number;
  email: string;
  school_id: number | null;
  role: {
    name: string;
  };
};

type SchoolData = {
  id: number;
  name: string;
  school_code: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  is_active?: boolean;
};

type WorkspaceStore = {
  currentUser: CurrentUser | null;
  schools: Record<string, SchoolData>;
  userRequest: Promise<CurrentUser> | null;
  schoolRequests: Record<string, Promise<SchoolData>>;

  getCurrentUser: () => Promise<CurrentUser>;
  getSchool: (schoolId: string) => Promise<SchoolData>;
  clearWorkspaceCache: () => void;
};

export const useWorkspaceStore = create<WorkspaceStore>(
  (set, get) => ({
    currentUser: null,
    schools: {},
    userRequest: null,
    schoolRequests: {},

    getCurrentUser: async () => {
      const cachedUser = get().currentUser;

      if (cachedUser) {
        return cachedUser;
      }

      const existingRequest = get().userRequest;

      if (existingRequest) {
        return existingRequest;
      }

      const request = api
        .get<CurrentUser>("/auth/me")
        .then((response) => {
          set({
            currentUser: response.data,
            userRequest: null,
          });

          return response.data;
        })
        .catch((error) => {
          set({ userRequest: null });
          throw error;
        });

      set({ userRequest: request });

      return request;
    },

    getSchool: async (schoolId: string) => {
      const cachedSchool = get().schools[schoolId];

      if (cachedSchool) {
        return cachedSchool;
      }

      const existingRequest =
        get().schoolRequests[schoolId];

      if (existingRequest) {
        return existingRequest;
      }

      const request = api
        .get<SchoolData>(`/schools/${schoolId}`)
        .then((response) => {
          set((state) => {
            const nextRequests = {
              ...state.schoolRequests,
            };

            delete nextRequests[schoolId];

            return {
              schools: {
                ...state.schools,
                [schoolId]: response.data,
              },
              schoolRequests: nextRequests,
            };
          });

          return response.data;
        })
        .catch((error) => {
          set((state) => {
            const nextRequests = {
              ...state.schoolRequests,
            };

            delete nextRequests[schoolId];

            return {
              schoolRequests: nextRequests,
            };
          });

          throw error;
        });

      set((state) => ({
        schoolRequests: {
          ...state.schoolRequests,
          [schoolId]: request,
        },
      }));

      return request;
    },

    clearWorkspaceCache: () => {
      set({
        currentUser: null,
        schools: {},
        userRequest: null,
        schoolRequests: {},
      });
    },
  })
);