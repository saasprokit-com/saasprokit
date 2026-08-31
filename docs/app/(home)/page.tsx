import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col justify-center px-6 text-center">
      <h1 className="mb-4 font-bold text-2xl">SaaSProKit documentation</h1>
      <p className="mx-auto max-w-xl text-fd-muted-foreground">
        Architecture and setup for the boilerplate — auth, billing, email, and
        deployment. This is not your product's docs; those live in{" "}
        <code>apps/docs</code>.
      </p>
      <p className="mt-6">
        <Link className="font-medium underline" href="/docs">
          Open the docs
        </Link>
      </p>
    </div>
  );
}
