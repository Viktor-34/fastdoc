"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Client {
  id: string;
  name: string;
  company: string | null;
  email: string;
}

interface ClientSelectorProps {
  value?: string | null;
  onChange: (clientId: string | null) => void;
  disabled?: boolean;
}

const FIELD_BORDER_COLOR = "var(--field-border)";
const TEXT_PRIMARY = "#3d3d3a";
const TEXT_MUTED = "#73726c";

export default function ClientSelector({ value, onChange, disabled }: ClientSelectorProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch("/api/clients");
        if (!response.ok) {
          throw new Error("Failed to fetch clients");
        }
        const data = await response.json();
        setClients(data);
      } catch (error) {
        console.error("Failed to load clients:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  const handleValueChange = (newValue: string) => {
    if (newValue === "none") {
      onChange(null);
    } else {
      onChange(newValue);
    }
  };

  // Find the selected client to display only their name
  const selectedClient = clients.find((client) => client.id === value);
  const displayValue = selectedClient ? selectedClient.name : undefined;

  return (
    <div className="flex w-full items-center gap-2">
      <Select
        value={value ?? "none"}
        onValueChange={handleValueChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger
          id="client"
          className="!h-[42px] w-full min-w-0 flex-1 rounded-lg border bg-white px-4 py-0 text-sm font-medium text-slate-900 transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)]"
          style={{ borderColor: FIELD_BORDER_COLOR }}
        >
          <SelectValue placeholder={isLoading ? "Загрузка..." : "Без клиента"}>
            {displayValue || (isLoading ? "Загрузка..." : "Без клиента")}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="border-[var(--field-border)] bg-white">
          <SelectItem value="none" className="focus:bg-[#FAEFEB] focus:text-[#3d3d3a]">
            Без клиента
          </SelectItem>
          {clients.map((client) => (
            <SelectItem
              key={client.id}
              value={client.id}
              className="focus:bg-[#FAEFEB] focus:text-[#3d3d3a]"
            >
              <div className="flex flex-col">
                <span className="font-medium">{client.name}</span>
                {client.company && (
                  <span className="text-xs" style={{ color: TEXT_MUTED }}>{client.company}</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant="outline"
        onClick={() => window.open("/clients/new", "_blank")}
        className="!h-[42px] shrink-0 rounded-lg border bg-white px-3 transition-colors hover:bg-[#FAFAF7] focus-visible:border-[var(--field-focus)] focus-visible:ring-[var(--field-ring)]"
        style={{ borderColor: FIELD_BORDER_COLOR, color: TEXT_PRIMARY }}
        title="Создать нового клиента"
        disabled={disabled}
      >
        <Plus className="h-4 w-4" />
        <span className="text-sm font-medium">Создать нового</span>
      </Button>
    </div>
  );
}
