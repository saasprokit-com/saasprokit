import Link from "next/link";
import { PAGE_ROUTES } from "@/lib/routes";
import { AuthCard } from "../../components/auth-card";

export function ResetPasswordSuccess() {
  return (
    <AuthCard
      description="Your password has been updated"
      footer={
        <Link
          className="text-primary text-sm hover:underline"
          href={PAGE_ROUTES.SIGN_IN}
        >
          Sign in with your new password
        </Link>
      }
      title="Password Reset Successfully"
    >
      <div className="text-center text-muted-foreground text-sm">
        <p>Your password has been successfully reset.</p>
        <p className="mt-2">You can now sign in with your new password.</p>
      </div>
    </AuthCard>
  );
}
