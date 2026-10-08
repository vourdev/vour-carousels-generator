"use client";

import { useState } from "react";

import { Loader2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { TopicCategory } from "@/lib/topics/bank";

import type { Product } from "../actions";
import { CATEGORIES } from "./categories";

/** Destructive confirmation. Stays open while the action runs, so a slow delete is visible. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  pending: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            {pending ? <Loader2 className="animate-spin" /> : null}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export interface NewTopic {
  title: string;
  category: TopicCategory;
  description?: string;
  keywords: string[];
  angle?: string;
  relatedProductId?: string;
}

export function AddTopicDialog({
  open,
  onOpenChange,
  products,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  pending: boolean;
  onSubmit: (topic: NewTopic) => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TopicCategory>("tutorial");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [angle, setAngle] = useState("");
  const [product, setProduct] = useState("none");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            onSubmit({
              title: title.trim(),
              category,
              description: description.trim() || undefined,
              keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
              angle: angle.trim() || undefined,
              relatedProductId: product === "none" ? undefined : product,
            });
          }}
          className="flex flex-col gap-6"
        >
          <DialogHeader>
            <DialogTitle>Tambah topik</DialogTitle>
            <DialogDescription>Masuk ke bank sebagai ide dengan prioritas 5.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="topic-title">Judul</FieldLabel>
              <Input id="topic-title" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="topic-category">Kategori</FieldLabel>
                <Select value={category} onValueChange={(v) => setCategory(v as TopicCategory)}>
                  <SelectTrigger id="topic-category" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="topic-product">Produk terkait</FieldLabel>
                <Select value={product} onValueChange={setProduct}>
                  <SelectTrigger id="topic-product" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="none">Tidak ada</SelectItem>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="topic-description">Deskripsi</FieldLabel>
              <Textarea
                id="topic-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="topic-keywords">Keywords</FieldLabel>
                <Input id="topic-keywords" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
                <FieldDescription>Pisahkan dengan koma.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="topic-angle">Angle</FieldLabel>
                <Input
                  id="topic-angle"
                  value={angle}
                  onChange={(e) => setAngle(e.target.value)}
                  placeholder="fokus: Panduan Praktis"
                />
              </Field>
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={pending || !title.trim()}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              Simpan topik
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NotesDialog({
  open,
  onOpenChange,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  onSubmit: (notes: string) => void;
}) {
  const [notes, setNotes] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate dari catatan</DialogTitle>
          <DialogDescription>
            Tempel catatan mentah atau outline. AI mengekstrak poin penting jadi kartu topik, menentukan kategori,
            keyword dan angle, lalu menautkan produk bila relevan.
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="topic-notes">Catatan</FieldLabel>
          <Textarea
            id="topic-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={12}
            className="max-h-[50vh] font-mono text-xs"
            placeholder={"- Kenapa index tidak selalu bikin query cepat\n- Pengalaman migrasi ke Bun…"}
          />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button disabled={pending || !notes.trim()} onClick={() => onSubmit(notes.trim())}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            Generate topik
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
