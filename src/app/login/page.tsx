import { LoginForm } from "./form";

export default async function LoginPage(props: PageProps<"/login">) {
  const { next } = await props.searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-lg border border-line bg-panel p-6">
        <p className="text-lg font-bold tracking-[0.3em]">STRYN</p>
        <p className="mb-6 text-[11px] uppercase tracking-[0.2em] text-muted">Operator Console</p>
        <LoginForm next={typeof next === "string" ? next : "/"} />
      </div>
    </div>
  );
}
