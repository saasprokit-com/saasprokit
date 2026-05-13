import { redirect } from "next/navigation";

interface AccountPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AccountPage({ params }: AccountPageProps) {
  const { locale } = await params;
  redirect(`/${locale}/account/profile`);
}
