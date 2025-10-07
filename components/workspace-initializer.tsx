"use client";

import { useEffect, useRef } from "react";
import { DEFAULT_WORKSPACE_ID } from "@/lib/workspace-constants";
import { getClientWorkspaceId, setClientWorkspaceId } from "@/lib/workspace-client";

interface WorkspaceInitializerProps {
  workspaceId?: string;
}

export function WorkspaceInitializer({ workspaceId }: WorkspaceInitializerProps) {
  const initialSetRef = useRef(false);

  useEffect(() => {
    if (initialSetRef.current) return;
    initialSetRef.current = true;
    const current = getClientWorkspaceId();
    const target = workspaceId?.trim() || current || DEFAULT_WORKSPACE_ID;
    if (!current || current !== target) {
      setClientWorkspaceId(target);
    }
  }, [workspaceId]);

  return null;
}
