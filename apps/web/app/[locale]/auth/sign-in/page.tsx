import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/design-system/components/ui/tabs";
import { getDictionary } from "@repo/internationalization";
import { KeyRound, Mail, Sparkles } from "lucide-react";
import { EmailOtpSignIn } from "./components/email-otp-sign-in";
import { MagicLinkSignIn } from "./components/magic-link-sign-in";
import { PasswordSignIn } from "./components/password-sign-in";

interface SignInPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SignInPage({ params }: SignInPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const errors = dict.errors.action;

  return (
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
          <PasswordSignIn errors={errors} />
        </TabsContent>

        <TabsContent className="mt-6" value="magic-link">
          <MagicLinkSignIn errors={errors} />
        </TabsContent>

        <TabsContent className="mt-6" value="otp">
          <EmailOtpSignIn errors={errors} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
