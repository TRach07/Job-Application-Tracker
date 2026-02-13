"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Briefcase, Mail } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

export default function LoginPage() {
  const { t } = useTranslation();

  return (
    <Card className="w-full max-w-md mx-4">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-primary/10 p-4">
            <Briefcase className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl">JobTracker</CardTitle>
        <CardDescription>
          {t.login.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="w-full"
          size="lg"
        >
          <Mail className="mr-2 h-5 w-5" />
          {t.login.button}
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-4">
          {t.login.privacy}
        </p>
      </CardContent>
    </Card>
  );
}
