export function toCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const escape = (val: string | number | boolean | null | undefined) => {
    const s = val === null || val === undefined ? "" : String(val);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  return [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\r\n");
}

export function formatCode(prefix: string, nextNum: number): string {
  return `${prefix}-2026-${String(nextNum).padStart(3, "0")}`;
}
