import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { Resend } from "resend";
import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { db } from "./db";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    EmailProvider({
      sendVerificationRequest: async ({ identifier: email, url }) => {
        if (process.env.NODE_ENV === "development" && !process.env.RESEND_API_KEY) {
          console.log(`\n🔑 SIGN-IN LINK for ${email}:\n${url}\n`);
          return;
        }
        const { error } = await getResend().emails.send({
          from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
          to: email,
          subject: "Sign in to Dashboard",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="font-size: 24px; margin-bottom: 16px;">Sign in to Dashboard</h1>
              <p style="margin-bottom: 24px;">Click the button below to sign in. This link expires in 24 hours.</p>
              <a href="${url}" style="background: #1a1a1a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
                Sign in
              </a>
              <p style="margin-top: 24px; color: #666; font-size: 14px;">
                Or copy and paste this URL: <br />${url}
              </p>
            </div>
          `,
        });
        if (error) {
          throw new Error(`Resend failed to send sign-in email: ${error.message}`);
        }
      },
    }),
  ],
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify",
  },
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: { ...session.user, id: user.id },
    }),
  },
};
