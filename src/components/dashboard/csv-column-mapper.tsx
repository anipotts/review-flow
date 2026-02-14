"use client";

import { useState } from "react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface CsvColumnMapperProps {
  headers: string[];
  onConfirm: (nameColumn: string, emailColumn: string) => void;
  onCancel: () => void;
}

export function CsvColumnMapper({ headers, onConfirm, onCancel }: CsvColumnMapperProps) {
  const [nameCol, setNameCol] = useState("");
  const [emailCol, setEmailCol] = useState("");

  return (
    <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 space-y-4">
      <div>
        <p className="text-sm font-medium text-amber-500">
          Couldn&apos;t auto-detect columns
        </p>
        <p className="text-xs text-amber-400 mt-0.5">
          Please select which columns contain the name and email.
        </p>
      </div>

      <Select
        id="nameColumn"
        label="Which column is the Name?"
        value={nameCol}
        onChange={(e) => setNameCol(e.target.value)}
      >
        <option value="">Select column...</option>
        {headers.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </Select>

      <Select
        id="emailColumn"
        label="Which column is the Email?"
        value={emailCol}
        onChange={(e) => setEmailCol(e.target.value)}
      >
        <option value="">Select column...</option>
        {headers.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </Select>

      <div className="flex gap-2">
        <Button
          onClick={() => {
            if (nameCol && emailCol) onConfirm(nameCol, emailCol);
          }}
          disabled={!nameCol || !emailCol}
        >
          Confirm
        </Button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-ink-secondary hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
