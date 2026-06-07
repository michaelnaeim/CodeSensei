import NextAuth, { type NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? "placeholder",
      clientSecret: process.env.GITHUB_SECRET ?? "placeholder",
    }),
  ],
  callbacks: {
    async jwt({ token, profile }) {
      if (profile && "login" in profile) {
        token.login = profile.login as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { login?: string }).login = token.login as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
