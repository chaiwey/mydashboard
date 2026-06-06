import "server-only";
import { createCallerFactory } from "@/server/api/trpc";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { headers } from "next/headers";

const createCaller = createCallerFactory(appRouter);

export const api = createCaller(async () =>
  createTRPCContext({ headers: await headers() })
);
