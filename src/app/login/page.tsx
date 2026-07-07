"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Zap } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setMsg(null);
    const supabase = supabaseBrowser();
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { company_name: company } },
        });
        if (error) throw error;
        if (!data.session) {
          setMsg("Check your email to confirm your account, then sign in.");
          return;
        }
        router.push("/onboarding");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(params.get("next") ?? "/dashboard");
      }
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card w-full max-w-md p-7">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft ring-1 ring-accent/40">
          <Zap className="h-4.5 w-4.5 text-accent-bright" />
        </span>
        <span className="text-[15px] font-semibold tracking-tight">
          DealFlow <span className="text-accent-bright">AI</span>
        </span>
      </div>
      <h1 className="mt-5 font-display text-3xl font-medium">
        {mode === "signin" ? "Welcome back" : "Create your broker account"}
      </h1>
      <div className="mt-5 space-y-3">
        {mode === "signup" ? (
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Brokerage / company name"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-[13px] outline-none placeholder:text-ink-faint focus:border-accent/50"
          />
        ) : null}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-[13px] outline-none placeholder:text-ink-faint focus:border-accent/50"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Password"
          type="password"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-[13px] outline-none placeholder:text-ink-faint focus:border-accent/50"
        />
        {msg ? <p className="text-[12px] text-warning">{msg}</p> : null}
        <button
          onClick={submit}
          disabled={busy || !email || !password}
          className="w-full rounded-lg bg-accent py-2.5 text-[14px] font-medium text-white hover:bg-accent-bright disabled:opacity-50"
        >
          {busy ? "Working…" : mode === "signin" ? "Sign in" : "Sign up"}
        </button>
      </div>
      <p className="mt-4 text-center text-[12px] text-ink-faint">
        {mode === "signin" ? (
          <>
            New to DealFlow?{" "}
            <button onClick={() => setMode("signup")} className="text-accent-bright hover:underline">
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button onClick={() => setMode("signin")} className="text-accent-bright hover:underline">
              Sign in
            </button>
          </>
        )}
      </p>
      <p className="mt-3 text-center text-[11px] text-ink-faint">
        <Link href="/" className="hover:text-ink-dim">
          ← back to dealflow.ai
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
