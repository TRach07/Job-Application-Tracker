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

export default function LoginPage() {
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
          Connectez-vous avec votre compte Google pour scanner vos emails de
          candidature et suivre votre pipeline.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="w-full"
          size="lg"
        >
          <Mail className="mr-2 h-5 w-5" />
          Se connecter avec Google
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-4">
          Nous utilisons l&apos;accès en lecture seule à Gmail pour détecter vos
          candidatures. Vos données restent locales.
        </p>
      </CardContent>
    </Card>
  );
}
