import Image from "next/image";
import SignUpForm from "../../../components/SignUpForm";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
      <div className="min-h-screen lg:grid lg:grid-cols-2">
        <section className="hidden lg:flex min-h-screen items-center justify-center px-10 xl:px-20 border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <Image className="w-full max-w-[420px] h-auto object-contain" src="/logo.png" alt="GI Book" width={500} height={500} priority />
        </section>

        <section className="min-h-screen flex items-center justify-center px-3 py-6 sm:px-6 sm:py-10 lg:px-10 xl:px-20">
          <SignUpForm />
        </section>
      </div>
    </main>
  );
}
