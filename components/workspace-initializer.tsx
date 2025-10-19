"use client";

import { useEffect, useRef } from "react";
import { DEFAULT_WORKSPACE_ID } from "@/lib/workspace-constants";
import { getClientWorkspaceId, setClientWorkspaceId } from "@/lib/workspace-client";

/* Пропсы инициализатора рабочей области: можно передать ID. */
interface WorkspaceInitializerProps {
  workspaceId?: string;
}

// Синхронизирует рабочее пространство между сервером и клиентом при загрузке.
export function WorkspaceInitializer({ workspaceId }: WorkspaceInitializerProps) {
  const initialSetRef = useRef(false);

  useEffect(() => {
    // Код выполняем только один раз после монтирования.
    if (initialSetRef.current) return;
    initialSetRef.current = true;
    // Берём сохранённый ID или подставляем дефолтный.
    const current = getClientWorkspaceId();
    const target = workspaceId?.trim() || current || DEFAULT_WORKSPACE_ID;
    if (!current || current !== target) {
      setClientWorkspaceId(target);
    }
  }, [workspaceId]);

  return null;
}
