"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export interface ClientFormData {
  name: string;
  company: string;
  contactPerson: string;
  middleName: string;
  position: string;
  email: string;
  phone: string;
}

interface ClientFormProps {
  initialData?: Partial<ClientFormData>;
  clientId?: string;
  mode: "create" | "edit";
}

const FIELD_BORDER_COLOR = "var(--field-border)";
const LABEL_COLOR = "#3d3d3a";
const MUTED_COLOR = "#73726c";
const INPUT_CLASSNAME =
  "h-auto w-full rounded-lg border border-[var(--field-border)] bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-[var(--field-placeholder)] transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)]";

export default function ClientForm({ initialData, clientId, mode }: ClientFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ClientFormData>({
    name: initialData?.name ?? "",
    company: initialData?.company ?? "",
    contactPerson: initialData?.contactPerson ?? "",
    middleName: initialData?.middleName ?? "",
    position: initialData?.position ?? "",
    email: initialData?.email ?? "",
    phone: initialData?.phone ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ClientFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ClientFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Имя обязательно";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email обязателен";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Некорректный email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const url = mode === "create" ? "/api/clients" : `/api/clients/${clientId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          company: formData.company || undefined,
          contactPerson: formData.contactPerson || undefined,
          middleName: formData.middleName || undefined,
          position: formData.position || undefined,
          email: formData.email,
          phone: formData.phone || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save client");
      }

      router.push("/clients");
      router.refresh();
    } catch (error) {
      console.error("Failed to save client:", error);
      alert(error instanceof Error ? error.message : "Не удалось сохранить клиента");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof ClientFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Очищаем ошибку при изменении поля
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Card
      className="w-full rounded-[0.75rem] border-0 bg-white px-0 py-0 shadow-none"
      style={{
        boxShadow: "0 1px 1px 0 rgba(0, 0, 0, 0.06), 0 0 1px 0 rgba(0, 0, 0, 0.3)",
      }}
    >
      <CardContent className="space-y-6 px-4 py-6 md:px-6">
        <form id="client-form" onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-medium" style={{ color: LABEL_COLOR }}>
              Основная информация
            </h3>
            <p className="text-xs" style={{ color: MUTED_COLOR }}>
              Заполните данные клиента для быстрого выбора в коммерческих предложениях.
            </p>
          </div>

          {/* Имя клиента */}
          <div>
            <Label htmlFor="name" className="mb-2 block text-sm font-medium" style={{ color: LABEL_COLOR }}>
              Имя клиента *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Иван Иванов или ООО «Компания»"
              disabled={isSubmitting}
              className={INPUT_CLASSNAME}
            />
            {errors.name && <p className="mt-2 text-sm text-rose-600">{errors.name}</p>}
          </div>

          {/* Компания */}
          <div>
            <Label htmlFor="company" className="mb-2 block text-sm font-medium" style={{ color: LABEL_COLOR }}>
              Название компании
            </Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleChange("company", e.target.value)}
              placeholder="ООО «Название»"
              disabled={isSubmitting}
              className={INPUT_CLASSNAME}
            />
          </div>

          {/* Контактное лицо */}
          <div>
            <Label htmlFor="contactPerson" className="mb-2 block text-sm font-medium" style={{ color: LABEL_COLOR }}>
              Контактное лицо
            </Label>
            <Input
              id="contactPerson"
              value={formData.contactPerson}
              onChange={(e) => handleChange("contactPerson", e.target.value)}
              placeholder="Иван"
              disabled={isSubmitting}
              className={INPUT_CLASSNAME}
            />
          </div>

          {/* Отчество */}
          <div>
            <Label htmlFor="middleName" className="mb-2 block text-sm font-medium" style={{ color: LABEL_COLOR }}>
              Отчество
            </Label>
            <Input
              id="middleName"
              value={formData.middleName}
              onChange={(e) => handleChange("middleName", e.target.value)}
              placeholder="Иванович"
              disabled={isSubmitting}
              className={INPUT_CLASSNAME}
            />
          </div>

          {/* Должность */}
          <div>
            <Label htmlFor="position" className="mb-2 block text-sm font-medium" style={{ color: LABEL_COLOR }}>
              Должность
            </Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => handleChange("position", e.target.value)}
              placeholder="Директор"
              disabled={isSubmitting}
              className={INPUT_CLASSNAME}
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email" className="mb-2 block text-sm font-medium" style={{ color: LABEL_COLOR }}>
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="email@example.com"
              disabled={isSubmitting}
              className={INPUT_CLASSNAME}
            />
            {errors.email && <p className="mt-2 text-sm text-rose-600">{errors.email}</p>}
          </div>

          {/* Телефон */}
          <div>
            <Label htmlFor="phone" className="mb-2 block text-sm font-medium" style={{ color: LABEL_COLOR }}>
              Телефон
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="+7 (999) 123-45-67"
              disabled={isSubmitting}
              className={INPUT_CLASSNAME}
            />
            <p className="mt-1.5 text-xs" style={{ color: MUTED_COLOR }}>
              Необязательное поле. Используется для быстрого контакта с клиентом.
            </p>
          </div>
        </form>
      </CardContent>
      <Separator style={{ backgroundColor: FIELD_BORDER_COLOR }} />
      <CardFooter className="flex flex-col gap-3 py-6 md:flex-row md:items-center md:justify-between">
        <p className="text-sm" style={{ color: MUTED_COLOR }}>
          Убедитесь, что все данные актуальны. После сохранения клиент будет доступен в списке.
        </p>
        <div className="flex gap-2">
          <Button
            type="submit"
            form="client-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {mode === "create" ? "Создать" : "Сохранить"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
