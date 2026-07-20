import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/design-system/components/ui/tabs";
import { getDictionary } from "@repo/internationalization";
import { KeyRound, Mail, Sparkles } from "lucide-react";
import { resolveCallbackUrl } from "@/lib/routes";
import { EmailOtpSignIn } from "./components/email-otp-sign-in";
import { MagicLinkSignIn } from "./components/magic-link-sign-in";
import { PasswordSignIn } from "./components/password-sign-in";

type SignInTab = "password" | "magic-link" | "otp";

function resolveTab(tab: string | undefined): SignInTab {
  if (tab === "magic-link" || tab === "otp") {
    return tab;
  }
  return "password";
}

interface SignInPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string; callbackUrl?: string }>;
}

export default async function SignInPage({
  params,
  searchParams,
}: SignInPageProps) {
  const [{ locale }, { tab, callbackUrl: rawCallbackUrl }] = await Promise.all([
    params,
    searchParams,
  ]);
  const dict = await getDictionary(locale);
  const errors = dict.errors.action;
  const callbackUrl = resolveCallbackUrl(rawCallbackUrl);

  return (
    <div className="w-full max-w-md">
      <Tabs className="w-full" defaultValue={resolveTab(tab)}>
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
          <PasswordSignIn callbackUrl={callbackUrl} errors={errors} />
        </TabsContent>

        <TabsContent className="mt-6" value="magic-link">
          <MagicLinkSignIn callbackUrl={callbackUrl} errors={errors} />
        </TabsContent>

        <TabsContent className="mt-6" value="otp">
          <EmailOtpSignIn callbackUrl={callbackUrl} errors={errors} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
