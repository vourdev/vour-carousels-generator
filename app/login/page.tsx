import type { Metadata } from "next";

import Image from "next/image";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ChevronDown, ChevronLeft, Lock, PanelLeft } from "lucide-react";

import { getSession } from "@/lib/session";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage() {
  const [session, requestHeaders] = await Promise.all([getSession(), headers()]);
  if (session) redirect("/");
  // The address bar shows wherever the app is actually served, not a made-up domain.
  const host = requestHeaders.get("host") ?? "vour carousels";

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-sm flex-col gap-10">
          <div className="flex items-center justify-center gap-3">
            <Image src="/vourdev-logo.jpeg" alt="" width={36} height={36} className="size-9 rounded-lg" priority />
            <span className="font-medium text-2xl tracking-tight">Vour Carousels</span>
          </div>

          <div className="flex flex-col gap-6">
            <div className="space-y-1.5">
              <h1 className="font-semibold text-2xl tracking-tight">Masuk</h1>
              <p className="text-muted-foreground text-sm">
                Masukkan email dan password untuk masuk ke dashboard konten @vourdev.
              </p>
            </div>
            <LoginForm />
          </div>

          <p className="text-center text-muted-foreground text-xs">
            Akses terbatas untuk tim @vourdev. Akun dibuat oleh admin.
          </p>
        </div>
      </div>

      {/* The dashboard behind the door, in a browser window that runs off the edge. */}
      <div aria-hidden className="relative hidden overflow-hidden bg-muted lg:block">
        <div className="absolute top-[16%] left-[14%] w-6xl overflow-hidden rounded-tl-xl border-t border-l bg-background shadow-2xl">
          <div className="flex h-11 items-center gap-4 border-b bg-sidebar px-4">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-red-500" />
              <span className="size-3 rounded-full bg-amber-400" />
              <span className="size-3 rounded-full bg-green-500" />
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <PanelLeft className="size-4" />
              <ChevronDown className="size-3" />
            </div>
            <ChevronLeft className="size-4 text-muted-foreground" />
            <div className="ml-24 flex h-7 flex-1 items-center gap-2 rounded-md bg-muted px-3 text-muted-foreground text-xs">
              <Lock className="size-3" />
              {host}
            </div>
          </div>
          <Image
            src="/login/overview-90d-light.png"
            alt=""
            width={2880}
            height={2200}
            sizes="72rem"
            className="block w-full dark:hidden"
          />
          <Image
            src="/login/overview-90d-dark.png"
            alt=""
            width={2880}
            height={2200}
            sizes="72rem"
            className="hidden w-full dark:block"
          />
        </div>
      </div>
    </div>
  );
}
