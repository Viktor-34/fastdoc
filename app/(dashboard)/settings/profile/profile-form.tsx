"use client";

import { useState, useTransition } from "react";
import { Users } from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

import { updateProfile, updateWorkspace } from "./actions";

interface ProfileFormProps {
  initialName: string;
  email: string;
  workspaceId: string;
  workspaceData: {
    name: string;
    logoUrl: string | null;
    signatureUrl: string | null;
    stampUrl: string | null;
    companyName: string | null;
    inn: string | null;
    ogrn: string | null;
    legalAddress: string | null;
    bankName: string | null;
    bik: string | null;
    accountNumber: string | null;
    vatDefault: boolean;
    vatRate: number;
  } | null;
  canEditWorkspace: boolean;
}

type CompanyData = {
  logoUrl: string | null;
  signatureUrl: string | null;
  stampUrl: string | null;
  companyName: string;
  inn: string;
  ogrn: string;
  legalAddress: string;
  bankName: string;
  bik: string;
  accountNumber: string;
  vatDefault: boolean;
  vatRate: number;
};

const FIELD_BORDER_COLOR = "hsl(30deg 3.3% 11.8% / 15%)";
const LABEL_COLOR = "#3d3d3a";
const MUTED_COLOR = "#73726c";
const CARD_STYLE = {
  boxShadow: "0 1px 1px 0 rgba(0, 0, 0, 0.06), 0 0 1px 0 rgba(0, 0, 0, 0.3)",
} as const;
const PRIMARY_ACTION_BUTTON_CLASS =
  "h-9 gap-1.5 rounded-xl bg-[#C6613F] px-4 text-sm font-medium text-[#FAFAFA] shadow-[0px_1px_2px_0px_rgba(10,10,10,0.06)] hover:bg-[#A04F33]";

export function ProfileForm({
  initialName,
  email,
  workspaceId,
  workspaceData,
  canEditWorkspace,
}: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [workspace, setWorkspace] = useState(workspaceData?.name ?? "");
  const [isPendingProfile, startProfileTransition] = useTransition();
  const [isPendingWorkspace, startWorkspaceTransition] = useTransition();

  const [companyData, setCompanyData] = useState<CompanyData>({
    logoUrl: workspaceData?.logoUrl ?? null,
    signatureUrl: workspaceData?.signatureUrl ?? null,
    stampUrl: workspaceData?.stampUrl ?? null,
    companyName: workspaceData?.companyName ?? "",
    inn: workspaceData?.inn ?? "",
    ogrn: workspaceData?.ogrn ?? "",
    legalAddress: workspaceData?.legalAddress ?? "",
    bankName: workspaceData?.bankName ?? "",
    bik: workspaceData?.bik ?? "",
    accountNumber: workspaceData?.accountNumber ?? "",
    vatDefault: workspaceData?.vatDefault ?? true,
    vatRate: workspaceData?.vatRate ?? 20,
  });

  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [isSavingCompany, setIsSavingCompany] = useState(false);

  const updateCompanyField = <K extends keyof CompanyData>(field: K, value: CompanyData[K]) => {
    setCompanyData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (
    field: "logoUrl" | "signatureUrl" | "stampUrl",
    file: File
  ) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Пожалуйста, загрузите изображение");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Размер файла не должен превышать 5MB");
      return;
    }

    setUploadingField(field);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("field", field);

      const response = await fetch("/api/workspace/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Ошибка загрузки");

      const { url } = await response.json();
      updateCompanyField(field, url);
      toast.success("Файл загружен");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Не удалось загрузить файл");
    } finally {
      setUploadingField(null);
    }
  };

  const handleSaveCompany = async () => {
    setIsSavingCompany(true);

    try {
      const response = await fetch("/api/workspace/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyData),
      });

      if (!response.ok) throw new Error("Ошибка сохранения");

      toast.success("Настройки сохранены");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Не удалось сохранить настройки");
    } finally {
      setIsSavingCompany(false);
    }
  };

  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList
        className="grid h-12 w-full grid-cols-3 rounded-xl border p-1.5"
        style={{ borderColor: FIELD_BORDER_COLOR, backgroundColor: "rgb(243, 242, 240)" }}
      >
        <TabsTrigger value="profile" className="h-9 rounded-lg text-sm font-medium data-[state=active]:bg-white">
          Профиль
        </TabsTrigger>
        <TabsTrigger value="workspace" className="h-9 rounded-lg text-sm font-medium data-[state=active]:bg-white">
          Рабочая область
        </TabsTrigger>
        <TabsTrigger
          value="company"
          disabled={!canEditWorkspace}
          className="h-9 rounded-lg text-sm font-medium data-[state=active]:bg-white"
        >
          Настройки компании
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-8 mt-6">
      <Card className="rounded-[0.75rem] border-0 shadow-none" style={CARD_STYLE}>
        <CardHeader className="border-b pb-4" style={{ borderColor: FIELD_BORDER_COLOR }}>
          <CardTitle style={{ color: LABEL_COLOR }}>Профиль</CardTitle>
          <CardDescription style={{ color: MUTED_COLOR }}>
            Имя отображается в боковой панели и в публичных ссылках.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name" style={{ color: LABEL_COLOR }}>Имя</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ваше имя"
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email" style={{ color: LABEL_COLOR }}>Email</Label>
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
            <Button
              type="submit"
              className={PRIMARY_ACTION_BUTTON_CLASS}
              disabled={isPendingProfile || name.trim().length === 0}
            >
              Сохранить
            </Button>
          </form>
        </CardFooter>
      </Card>
      </TabsContent>

      <TabsContent value="workspace" className="space-y-8 mt-6">
      <Card className="rounded-[0.75rem] border-0 shadow-none" style={CARD_STYLE}>
        <CardHeader className="border-b pb-4" style={{ borderColor: FIELD_BORDER_COLOR }}>
          <CardTitle style={{ color: LABEL_COLOR }}>Рабочая область</CardTitle>
          <CardDescription style={{ color: MUTED_COLOR }}>
            Название видят коллеги и клиенты в приглашениях, публичных ссылках и PDF.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name" style={{ color: LABEL_COLOR }}>
              Название рабочей области
            </Label>
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
            <p className="text-sm" style={{ color: MUTED_COLOR }}>
              Только владелец или администратор может изменять название рабочей области.
            </p>
          ) : (
            <span className="flex items-center gap-2 text-sm" style={{ color: MUTED_COLOR }}>
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
            <Button
              type="submit"
              className={PRIMARY_ACTION_BUTTON_CLASS}
              disabled={!canEditWorkspace || isPendingWorkspace || workspace.trim().length === 0}
            >
              Обновить
            </Button>
          </form>
        </CardFooter>
      </Card>
      </TabsContent>

      <TabsContent value="company" className="space-y-8 mt-6">
        {/* Визуал компании */}
        <Card className="rounded-[0.75rem] border-0 shadow-none" style={CARD_STYLE}>
          <CardHeader className="border-b pb-4" style={{ borderColor: FIELD_BORDER_COLOR }}>
            <CardTitle style={{ color: LABEL_COLOR }}>Визуал компании</CardTitle>
            <CardDescription style={{ color: MUTED_COLOR }}>
              Логотип, подпись и печать для документов
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              {/* Логотип */}
              <div className="space-y-2">
                <Label htmlFor="logo-upload" style={{ color: LABEL_COLOR }}>Логотип</Label>
                {companyData.logoUrl && (
                  <div className="mb-2 flex h-32 items-center justify-center rounded-md border bg-[#FAFAFA]" style={{ borderColor: FIELD_BORDER_COLOR }}>
                    <img
                      src={companyData.logoUrl}
                      alt="Логотип"
                      className="max-h-full max-w-full object-contain p-2"
                    />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="logo-upload"
                    className={`inline-flex h-8 items-center rounded-md px-3 text-sm font-medium transition-colors ${
                      uploadingField === "logoUrl"
                        ? "cursor-not-allowed bg-neutral-200 text-neutral-500"
                        : "cursor-pointer bg-[#F3F2F0] text-[#3d3d3a] hover:bg-[#ebe8e3]"
                    }`}
                  >
                    Выбрать файл
                  </label>
                  <span className="truncate text-[12px]" style={{ color: MUTED_COLOR }}>
                    {uploadingField === "logoUrl" ? "Загрузка..." : "PNG/JPG, до 5MB"}
                  </span>
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    disabled={uploadingField === "logoUrl"}
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload("logoUrl", file);
                    }}
                  />
                </div>
              </div>

              {/* Подпись */}
              <div className="space-y-2">
                <Label htmlFor="signature-upload" style={{ color: LABEL_COLOR }}>Подпись (PNG)</Label>
                {companyData.signatureUrl && (
                  <div className="mb-2 flex h-32 items-center justify-center rounded-md border bg-[#FAFAFA]" style={{ borderColor: FIELD_BORDER_COLOR }}>
                    <img
                      src={companyData.signatureUrl}
                      alt="Подпись"
                      className="max-h-full max-w-full object-contain p-2"
                    />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="signature-upload"
                    className={`inline-flex h-8 items-center rounded-md px-3 text-sm font-medium transition-colors ${
                      uploadingField === "signatureUrl"
                        ? "cursor-not-allowed bg-neutral-200 text-neutral-500"
                        : "cursor-pointer bg-[#F3F2F0] text-[#3d3d3a] hover:bg-[#ebe8e3]"
                    }`}
                  >
                    Выбрать файл
                  </label>
                  <span className="truncate text-[12px]" style={{ color: MUTED_COLOR }}>
                    {uploadingField === "signatureUrl" ? "Загрузка..." : "PNG, до 5MB"}
                  </span>
                  <Input
                    id="signature-upload"
                    type="file"
                    accept="image/png"
                    disabled={uploadingField === "signatureUrl"}
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload("signatureUrl", file);
                    }}
                  />
                </div>
              </div>

              {/* Печать */}
              <div className="space-y-2">
                <Label htmlFor="stamp-upload" style={{ color: LABEL_COLOR }}>Печать (PNG)</Label>
                {companyData.stampUrl && (
                  <div className="mb-2 flex h-32 items-center justify-center rounded-md border bg-[#FAFAFA]" style={{ borderColor: FIELD_BORDER_COLOR }}>
                    <img
                      src={companyData.stampUrl}
                      alt="Печать"
                      className="max-h-full max-w-full object-contain p-2"
                    />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="stamp-upload"
                    className={`inline-flex h-8 items-center rounded-md px-3 text-sm font-medium transition-colors ${
                      uploadingField === "stampUrl"
                        ? "cursor-not-allowed bg-neutral-200 text-neutral-500"
                        : "cursor-pointer bg-[#F3F2F0] text-[#3d3d3a] hover:bg-[#ebe8e3]"
                    }`}
                  >
                    Выбрать файл
                  </label>
                  <span className="truncate text-[12px]" style={{ color: MUTED_COLOR }}>
                    {uploadingField === "stampUrl" ? "Загрузка..." : "PNG, до 5MB"}
                  </span>
                  <Input
                    id="stamp-upload"
                    type="file"
                    accept="image/png"
                    disabled={uploadingField === "stampUrl"}
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload("stampUrl", file);
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Реквизиты */}
        <Card className="rounded-[0.75rem] border-0 shadow-none" style={CARD_STYLE}>
          <CardHeader className="border-b pb-4" style={{ borderColor: FIELD_BORDER_COLOR }}>
            <CardTitle style={{ color: LABEL_COLOR }}>Реквизиты компании</CardTitle>
            <CardDescription style={{ color: MUTED_COLOR }}>
              Информация для отображения в КП и документах
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName" style={{ color: LABEL_COLOR }}>Название компании</Label>
                <Input
                  id="companyName"
                  value={companyData.companyName}
                  onChange={(e) => updateCompanyField("companyName", e.target.value)}
                  placeholder="ООО «Название»"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inn" style={{ color: LABEL_COLOR }}>ИНН</Label>
                <Input
                  id="inn"
                  value={companyData.inn}
                  onChange={(e) => updateCompanyField("inn", e.target.value)}
                  placeholder="1234567890"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ogrn" style={{ color: LABEL_COLOR }}>ОГРН</Label>
                <Input
                  id="ogrn"
                  value={companyData.ogrn}
                  onChange={(e) => updateCompanyField("ogrn", e.target.value)}
                  placeholder="1234567890123"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="legalAddress" style={{ color: LABEL_COLOR }}>Юридический адрес</Label>
                <Input
                  id="legalAddress"
                  value={companyData.legalAddress}
                  onChange={(e) => updateCompanyField("legalAddress", e.target.value)}
                  placeholder="123456, г. Москва, ул. Примерная, д. 1"
                />
              </div>
            </div>

            <Separator style={{ backgroundColor: FIELD_BORDER_COLOR }} />

            <div>
              <h3 className="mb-4 font-medium" style={{ color: LABEL_COLOR }}>Банковские реквизиты</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bankName" style={{ color: LABEL_COLOR }}>Название банка</Label>
                  <Input
                    id="bankName"
                    value={companyData.bankName}
                    onChange={(e) => updateCompanyField("bankName", e.target.value)}
                    placeholder="ПАО «Банк»"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bik" style={{ color: LABEL_COLOR }}>БИК</Label>
                  <Input
                    id="bik"
                    value={companyData.bik}
                    onChange={(e) => updateCompanyField("bik", e.target.value)}
                    placeholder="044525225"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="accountNumber" style={{ color: LABEL_COLOR }}>Расчётный счёт</Label>
                  <Input
                    id="accountNumber"
                    value={companyData.accountNumber}
                    onChange={(e) => updateCompanyField("accountNumber", e.target.value)}
                    placeholder="40702810000000000000"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Настройки НДС */}
        <Card className="rounded-[0.75rem] border-0 shadow-none" style={CARD_STYLE}>
          <CardHeader className="border-b pb-4" style={{ borderColor: FIELD_BORDER_COLOR }}>
            <CardTitle style={{ color: LABEL_COLOR }}>Настройки НДС</CardTitle>
            <CardDescription style={{ color: MUTED_COLOR }}>
              Параметры по умолчанию для новых КП
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center space-x-2 rounded-lg bg-[#FAFAFA] p-3">
                <input
                  type="checkbox"
                  id="vatDefault"
                  checked={companyData.vatDefault}
                  onChange={(e) => updateCompanyField("vatDefault", e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--field-border)] accent-[var(--field-focus)] focus:ring-[3px] focus:ring-[var(--field-ring)]"
                />
                <Label htmlFor="vatDefault" className="cursor-pointer font-normal" style={{ color: LABEL_COLOR }}>
                  Включать НДС по умолчанию
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vatRate" style={{ color: LABEL_COLOR }}>Ставка НДС (%)</Label>
                <Input
                  id="vatRate"
                  type="number"
                  min="0"
                  max="100"
                  value={companyData.vatRate}
                  onChange={(e) =>
                    updateCompanyField("vatRate", parseInt(e.target.value) || 0)
                  }
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button className={PRIMARY_ACTION_BUTTON_CLASS} onClick={handleSaveCompany} disabled={isSavingCompany}>
              Сохранить изменения
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
