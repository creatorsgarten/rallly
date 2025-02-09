import * as Sentry from "@sentry/nextjs";
import { TRPCError } from "@trpc/server";
import { createNextApiHandler } from "@trpc/server/adapters/next";

import { posthogApiHandler } from "@/app/posthog";
import { getServerSession } from "@/auth";
import type { AppRouter} from "@/trpc/routers";
import { appRouter } from "@/trpc/routers";
import { getEmailClient } from "@/utils/emails";
import { composeApiHandlers } from "@/utils/next";

export const config = {
  api: {
    externalResolver: true,
  },
};

const trpcApiHandler = createNextApiHandler<AppRouter>({
  router: appRouter,
  createContext: async (opts) => {
    const session = await getServerSession(opts.req, opts.res);

    if (!session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      });
    }

    const res = {
      user: {
        id: session.user.id,
        isGuest: session.user.email === null,
        locale: session.user.locale ?? undefined,
        image: session.user.image ?? undefined,
        getEmailClient: () => getEmailClient(session.user.locale ?? undefined),
      },
      req: opts.req,
      res: opts.res,
    };

    return res;
  },
  onError({ error }) {
    if (error.code === "INTERNAL_SERVER_ERROR") {
      Sentry.captureException(error);
    }
  },
});

export default composeApiHandlers(trpcApiHandler, posthogApiHandler);
