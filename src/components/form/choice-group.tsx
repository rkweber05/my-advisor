"use client";

import { useId } from "react";

export type Choice = { value: string; label: string };

type ChoiceGroupProps = {
  legend: string;
  name: string;
  options: readonly Choice[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

// Opções em botões, escolhidas com um toque. São botões de opção de verdade: funcionam com
// teclado e leitor de tela.
export function ChoiceGroup({
  legend,
  name,
  options,
  value,
  onChange,
  error,
}: ChoiceGroupProps) {
  const errorId = useId();

  return (
    <fieldset
      className="flex flex-col gap-2"
      aria-describedby={error ? errorId : undefined}
    >
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex min-h-11 cursor-pointer items-center rounded-lg border border-input bg-card px-3.5 text-sm font-medium select-none has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
          >
            <input
              type="radio"
              className="sr-only"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} className="text-sm font-medium text-danger-strong">
          {error}
        </p>
      )}
    </fieldset>
  );
}
