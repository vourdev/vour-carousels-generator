import { requireSession } from "@/lib/session";
import { LogoutButton } from "./logout-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import Link from "next/link";

export default async function Home() {
  const session = await requireSession();
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <Card className="w-full max-w-[720px]">
        <CardHeader>
          <CardTitle className="text-[40px] tracking-tight font-semibold">
            <span className="gradient-text">Vour</span> Carousels
          </CardTitle>
          <CardAction>
            <LogoutButton />
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Signed in as{" "}
            <span className="font-medium text-foreground">
              {session.user.email}
            </span>
          </p>
          <div className="mt-4">
            <Button nativeButton={false} render={<Link href="/preview" />}>
              Open Preview
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
