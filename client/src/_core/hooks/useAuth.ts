import { trpc } from "@/lib/trpc";

export function useAuth() {
  const { data: user, isLoading: loading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
  });

  return {
    user: user ?? null,
    loading,
    isAuthenticated: !!user,
    logout: trpc.auth.logout.useMutation({
      onSuccess: () => {
        window.location.href = "/";
      },
    }).mutate,
  };
}
