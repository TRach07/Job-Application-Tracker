"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">Gérez votre compte et vos préférences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Informations de votre compte Google</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={session?.user?.image || undefined} />
            <AvatarFallback>
              {session?.user?.name?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{session?.user?.name}</p>
            <p className="text-sm text-muted-foreground">
              {session?.user?.email}
            </p>
            <Badge variant="secondary" className="mt-1">
              Gmail connecté
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI locale (Ollama)</CardTitle>
          <CardDescription>
            Configuration du modèle de langage local
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">URL</span>
              <span className="font-mono">
                {process.env.NEXT_PUBLIC_OLLAMA_URL || "http://localhost:11434"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Modèle</span>
              <span className="font-mono">mistral:7b</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
