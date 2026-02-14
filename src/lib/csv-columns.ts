export interface ColumnMapping {
  nameColumn: string | null;
  firstNameColumn: string | null;
  lastNameColumn: string | null;
  emailColumn: string | null;
  confidence: "exact" | "fuzzy" | "ambiguous";
}

const NAME_EXACT = ["name", "full name", "patient name", "client name", "customer name"];
const FIRST_NAME_EXACT = ["first name", "firstname", "first", "fname"];
const LAST_NAME_EXACT = ["last name", "lastname", "last", "lname"];
const EMAIL_EXACT = ["email", "email address", "e-mail", "e-mail address", "patient email", "client email"];

function normalize(header: string): string {
  return header.toLowerCase().trim();
}

export function detectColumns(headers: string[]): ColumnMapping {
  const normalized = headers.map(normalize);

  let nameColumn: string | null = null;
  let firstNameColumn: string | null = null;
  let lastNameColumn: string | null = null;
  let emailColumn: string | null = null;
  let confidence: "exact" | "fuzzy" | "ambiguous" = "ambiguous";

  // Exact match pass
  for (let i = 0; i < headers.length; i++) {
    const n = normalized[i];
    if (!nameColumn && NAME_EXACT.includes(n)) nameColumn = headers[i];
    if (!firstNameColumn && FIRST_NAME_EXACT.includes(n)) firstNameColumn = headers[i];
    if (!lastNameColumn && LAST_NAME_EXACT.includes(n)) lastNameColumn = headers[i];
    if (!emailColumn && EMAIL_EXACT.includes(n)) emailColumn = headers[i];
  }

  const hasName = nameColumn || (firstNameColumn && lastNameColumn);
  const hasEmail = emailColumn;

  if (hasName && hasEmail) {
    return { nameColumn, firstNameColumn, lastNameColumn, emailColumn, confidence: "exact" };
  }

  // Fuzzy pass: contains matching
  for (let i = 0; i < headers.length; i++) {
    const n = normalized[i];
    if (!nameColumn && !firstNameColumn && n.includes("name") && !n.includes("first") && !n.includes("last")) {
      nameColumn = headers[i];
    }
    if (!firstNameColumn && n.includes("first") && n.includes("name")) {
      firstNameColumn = headers[i];
    }
    if (!lastNameColumn && n.includes("last") && n.includes("name")) {
      lastNameColumn = headers[i];
    }
    if (!emailColumn && (n.includes("email") || n.includes("e-mail"))) {
      emailColumn = headers[i];
    }
  }

  const hasNameFuzzy = nameColumn || (firstNameColumn && lastNameColumn);
  const hasEmailFuzzy = emailColumn;

  if (hasNameFuzzy && hasEmailFuzzy) {
    return { nameColumn, firstNameColumn, lastNameColumn, emailColumn, confidence: "fuzzy" };
  }

  return { nameColumn, firstNameColumn, lastNameColumn, emailColumn, confidence: "ambiguous" };
}

export function mapRow(
  row: Record<string, string>,
  mapping: ColumnMapping
): { name: string; email: string } | null {
  let name = "";
  let email = "";

  if (mapping.nameColumn && row[mapping.nameColumn]) {
    name = row[mapping.nameColumn].trim();
  } else if (mapping.firstNameColumn || mapping.lastNameColumn) {
    const first = mapping.firstNameColumn ? (row[mapping.firstNameColumn] || "").trim() : "";
    const last = mapping.lastNameColumn ? (row[mapping.lastNameColumn] || "").trim() : "";
    name = `${first} ${last}`.trim();
  }

  if (mapping.emailColumn && row[mapping.emailColumn]) {
    email = row[mapping.emailColumn].trim().toLowerCase();
  }

  if (!name || !email) return null;
  return { name, email };
}
