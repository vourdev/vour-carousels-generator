import type { Metadata } from "next";

import Image from "next/image";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/");

  return (
    <div className="flex h-dvh">
      <div className="hidden bg-primary lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <Image src="/vourdev-logo.jpeg" alt="" width={48} height={48} className="mx-auto size-12 rounded-xl" priority />
            <div className="space-y-2">
              <h1 className="font-light text-5xl text-primary-foreground">vourdev</h1>
              <p className="text-primary-foreground/80 text-xl">Carousel studio</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-10 py-24 lg:py-32">
          <div className="space-y-4 text-center">
            <Image src="/vourdev-logo.jpeg" alt="" width={40} height={40} className="mx-auto size-10 rounded-lg lg:hidden" />
            <div className="font-medium tracking-tight">Masuk ke Vour Carousels</div>
            <div className="mx-auto max-w-xl text-muted-foreground">
              Ide → brief → slide → ekspor → jadwal Buffer, untuk @vourdev.
            </div>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
