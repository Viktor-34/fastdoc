"use client";

import { useState, useTransition } from "react";
import { Loader2, Save, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

import { updateProfile, updateWorkspace } from "./actions";

interface ProfileFormProps {
  initialName: string;
  email: string;
  workspaceName?: string | null;
  canEditWorkspace: boolean;
}

export function ProfileForm({
  initialName,
  email,
  workspaceName,
  canEditWorkspace,
}: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [workspace, setWorkspace] = useState(workspaceName ?? "");
  const [isPendingProfile, startProfileTransition] = useTransition();
  const [isPendingWorkspace, startWorkspaceTransition] = useTransition();

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Профиль</CardTitle>
          <CardDescription>Имя отображается в боковой панели и в публичных ссылках.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Имя</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ваше имя"
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" value={email} disabled />
          </div>
        </CardContent>
        <CardFooter>
          <form
            className="flex w-full justify-end"
            action={(formData) => {
              startProfileTransition(async () => {
                formData.set("name", name);
                const result = await updateProfile(formData);
                toast[result.ok ? "success" : "error"](result.message);
              });
            }}
          >
            <Button type="submit" disabled={isPendingProfile || name.trim().length === 0}>
              {isPendingProfile ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Сохранить
            </Button>
          </form>
        </CardFooter>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Рабочая область</CardTitle>
          <CardDescription>
            Название видят коллеги и клиенты в приглашениях, публичных ссылках и PDF.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Название рабочей области</Label>
            <Input
              id="workspace-name"
              value={workspace}
              onChange={(event) => setWorkspace(event.target.value)}
              placeholder="Например, «ООО Ромашка»"
              disabled={!canEditWorkspace}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between gap-3 flex-wrap">
          {!canEditWorkspace ? (
            <p className="text-sm text-neutral-500">
              Только владелец или администратор может изменять название рабочей области.
            </p>
          ) : (
            <span className="flex items-center gap-2 text-sm text-neutral-500">
              <Users className="h-4 w-4" />
              Изменение повлияет на всех участников рабочей области.
            </span>
          )}
          <form
            className="flex justify-end"
            action={(formData) => {
              startWorkspaceTransition(async () => {
                formData.set("workspaceName", workspace);
                const result = await updateWorkspace(formData);
                toast[result.ok ? "success" : "error"](result.message);
              });
            }}
          >
            <Button type="submit" disabled={!canEditWorkspace || isPendingWorkspace || workspace.trim().length === 0}>
              {isPendingWorkspace ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Обновить
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
