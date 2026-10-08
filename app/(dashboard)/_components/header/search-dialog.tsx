"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { PlusCircle, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { navLinks } from "@/navigation/sidebar-items";

const ACTIONS = [{ id: "new", label: "Buat carousel baru", url: "/create", icon: PlusCircle }] as const;

/** ⌘J / Ctrl+J: jump to a page or start a carousel from anywhere in the dashboard. */
export function SearchDialog() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const go = (url: string) => {
    setOpen(false);
    router.push(url);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="link"
        className="px-0! font-normal text-muted-foreground hover:no-underline"
      >
        <Search data-icon="inline-start" />
        <span className="hidden sm:inline">Cari</span>
        <Kbd className="hidden sm:inline-flex">⌘J</Kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Cari" description="Pindah halaman atau mulai carousel">
        <Command>
          <CommandInput placeholder="Cari halaman atau aksi…" />
          <CommandList>
            <CommandEmpty>Tidak ada hasil.</CommandEmpty>
            <CommandGroup heading="Aksi">
              {ACTIONS.map((a) => (
                <CommandItem key={a.id} value={a.label} onSelect={() => go(a.url)}>
                  <a.icon />
                  {a.label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Halaman">
              {navLinks.map((item) => (
                <CommandItem key={item.id} value={item.title} onSelect={() => go(item.url)}>
                  {item.icon && <item.icon />}
                  {item.title}
                  {item.shortcut && <CommandShortcut className="uppercase">{item.shortcut}</CommandShortcut>}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
