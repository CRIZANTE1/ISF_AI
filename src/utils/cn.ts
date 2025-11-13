/**
 * Utilitário para combinar classes CSS
 * Similar ao cn do shadcn/ui mas sem dependências externas
 */
export function cn(
  ...inputs: (
    | string
    | undefined
    | null
    | false
    | Record<string, boolean>
    | (string | undefined | null | false)[]
  )[]
): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === "string") {
      classes.push(input);
    } else if (Array.isArray(input)) {
      const inner = cn(...input);
      if (inner) classes.push(inner);
    } else if (typeof input === "object") {
      for (const key in input) {
        if (input[key]) {
          classes.push(key);
        }
      }
    }
  }

  return classes
    .join(" ")
    .split(" ")
    .filter((v, i, a) => a.indexOf(v) === i && v)
    .join(" ");
}

