"use client";
import { TooltipProvider } from "@rallly/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCReact } from "@trpc/react-query";
import { domMax, LazyMotion } from "framer-motion";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";

import { UserProvider } from "@/components/user-provider";
import { I18nProvider } from "@/i18n/client";
import { trpcConfig } from "@/trpc/client/config";
import type { AppRouter } from "@/trpc/routers";
import { ConnectedDayjsProvider } from "@/utils/dayjs";

export const trpc = createTRPCReact<AppRouter>({
  unstable_overrides: {
    useMutation: {
      async onSuccess(opts) {
        await opts.originalFn();
        await opts.queryClient.invalidateQueries();
      },
    },
  },
});

export function Providers(props: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => trpc.createClient(trpcConfig));
  return (
    <LazyMotion features={domMax}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <I18nProvider>
            <TooltipProvider>
              <SessionProvider>
                <UserProvider>
                  <ConnectedDayjsProvider>
                    {props.children}
                  </ConnectedDayjsProvider>
                </UserProvider>
              </SessionProvider>
            </TooltipProvider>
          </I18nProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </LazyMotion>
  );
}
