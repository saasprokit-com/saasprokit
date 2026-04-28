"use client";

import { authClient, signIn } from "@repo/auth/client";
import {
  SignInForm,
  type SignInFormValues,
} from "@repo/design-system/components/molecules/auth/sign-in-form";
import type { SocialProvider } from "@repo/design-system/components/molecules/auth/social-providers";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/design-system/components/ui/tabs";
import type { ActionErrorMessages } from "@repo/internationalization";
import { KeyRound, Mail, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PAGE_ROUTES } from "@/lib/routes";

interface SignInClientProps {
  errors: ActionErrorMessages;
}

export function SignInClient({ errors }: SignInClientProps) {
  const router = useRouter();
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(data: SignInFormValues) {
    const normalizedEmail = data.email.toLowerCase().trim();

    const result = await signIn.email({
      email: normalizedEmail,
      password: data.password,
      rememberMe: data.rememberMe,
    });

    if (result.error) {
      throw new Error(result.error.message || errors.signIn);
    }

    router.push(PAGE_ROUTES.ORG);
    router.refresh();
  }

  function handleSocialLogin(provider: SocialProvider) {
    signIn.social({ provider, callbackURL: PAGE_ROUTES.ORG });
  }

  function handleMagicLinkSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const normalizedEmail = magicLinkEmail.toLowerCase().trim();

        const result = await authClient.signIn.magicLink({
          email: normalizedEmail,
          callbackURL: PAGE_ROUTES.ORG,
        });

        if (result.error) {
          throw new Error(result.error.message || errors.sendMagicLink);
        }

        setSuccess("Check your email for the magic link!");
        setMagicLinkEmail("");
      } catch (err) {
        setError(err instanceof Error ? err.message : errors.signIn);
      }
    });
  }

  function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const normalizedEmail = otpEmail.toLowerCase().trim();

        const result = await authClient.emailOtp.sendVerificationOtp({
          email: normalizedEmail,
          type: "sign-in",
        });

        if (result.error) {
          throw new Error(result.error.message || errors.sendOtp);
        }

        setOtpSent(true);
        setSuccess("OTP sent to your email!");
      } catch (err) {
        setError(err instanceof Error ? err.message : errors.signIn);
      }
    });
  }

  function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const normalizedEmail = otpEmail.toLowerCase().trim();

        const result = await authClient.signIn.emailOtp({
          email: normalizedEmail,
          otp: otpCode,
        });

        if (result.error) {
          throw new Error(result.error.message || errors.invalidOtp);
        }

        router.push(PAGE_ROUTES.ORG);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : errors.signIn);
      }
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <Tabs className="w-full" defaultValue="password">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger className="flex items-center gap-2" value="password">
              <KeyRound className="h-4 w-4" />
              <span className="hidden sm:inline">Password</span>
            </TabsTrigger>
            <TabsTrigger className="flex items-center gap-2" value="magic-link">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Magic Link</span>
            </TabsTrigger>
            <TabsTrigger className="flex items-center gap-2" value="otp">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Email OTP</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent className="mt-6" value="password">
            <SignInForm
              onSocialLogin={handleSocialLogin}
              onSubmit={handleSubmit}
              socialProviders={["google", "github"]}
            />
          </TabsContent>

          <TabsContent className="mt-6" value="magic-link">
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="mb-6 text-center">
                <h2 className="font-semibold text-2xl">Magic Link</h2>
                <p className="mt-2 text-muted-foreground text-sm">
                  We&apos;ll send you a link to sign in instantly
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-md bg-destructive/10 p-3 text-destructive text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 rounded-md bg-green-100 p-3 text-green-800 text-sm dark:bg-green-900/30 dark:text-green-400">
                  {success}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleMagicLinkSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="magic-email">Email</Label>
                  <Input
                    disabled={isLoading}
                    id="magic-email"
                    onChange={(e) => setMagicLinkEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    type="email"
                    value={magicLinkEmail}
                  />
                </div>

                <Button className="w-full" disabled={isLoading} type="submit">
                  {isLoading ? "Sending..." : "Send Magic Link"}
                </Button>
              </form>

              <p className="mt-6 text-center text-muted-foreground text-sm">
                Don&apos;t have an account?{" "}
                <Link
                  className="text-primary hover:underline"
                  href={PAGE_ROUTES.SIGN_UP}
                >
                  Sign up
                </Link>
              </p>
            </div>
          </TabsContent>

          <TabsContent className="mt-6" value="otp">
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="mb-6 text-center">
                <h2 className="font-semibold text-2xl">Email OTP</h2>
                <p className="mt-2 text-muted-foreground text-sm">
                  {otpSent
                    ? "Enter the code sent to your email"
                    : "We'll send you a one-time code to sign in"}
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-md bg-destructive/10 p-3 text-destructive text-sm">
                  {error}
                </div>
              )}

              {success && !otpSent && (
                <div className="mb-4 rounded-md bg-green-100 p-3 text-green-800 text-sm dark:bg-green-900/30 dark:text-green-400">
                  {success}
                </div>
              )}

              {otpSent ? (
                <form className="space-y-4" onSubmit={handleVerifyOTP}>
                  <div className="space-y-2">
                    <Label htmlFor="otp-code">Verification Code</Label>
                    <Input
                      autoComplete="one-time-code"
                      className="text-center font-mono text-lg tracking-widest"
                      disabled={isLoading}
                      id="otp-code"
                      maxLength={6}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="000000"
                      required
                      value={otpCode}
                    />
                  </div>

                  <Button className="w-full" disabled={isLoading} type="submit">
                    {isLoading ? "Verifying..." : "Verify & Sign In"}
                  </Button>

                  <Button
                    className="w-full"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode("");
                      setError(null);
                      setSuccess(null);
                    }}
                    type="button"
                    variant="outline"
                  >
                    Use different email
                  </Button>
                </form>
              ) : (
                <form className="space-y-4" onSubmit={handleSendOTP}>
                  <div className="space-y-2">
                    <Label htmlFor="otp-email">Email</Label>
                    <Input
                      disabled={isLoading}
                      id="otp-email"
                      onChange={(e) => setOtpEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      type="email"
                      value={otpEmail}
                    />
                  </div>

                  <Button className="w-full" disabled={isLoading} type="submit">
                    {isLoading ? "Sending..." : "Send Code"}
                  </Button>
                </form>
              )}

              <p className="mt-6 text-center text-muted-foreground text-sm">
                Don&apos;t have an account?{" "}
                <Link
                  className="text-primary hover:underline"
                  href={PAGE_ROUTES.SIGN_UP}
                >
                  Sign up
                </Link>
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
