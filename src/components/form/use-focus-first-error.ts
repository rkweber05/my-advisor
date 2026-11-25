"use client";

import { useEffect, useRef } from "react";

import type { FormState } from "@/lib/forms/form-state";

// Depois de um envio recusado, leva o foco ao primeiro campo com erro.
export function useFocusFirstError(state: FormState) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.fieldErrors) return;
    formRef.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus();
  }, [state]);

  return formRef;
}
