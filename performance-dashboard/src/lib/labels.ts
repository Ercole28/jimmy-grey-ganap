// The source sheet's section headers are long, ALL-CAPS location names meant
// for a spreadsheet, not a report card ("TUKS / TERMINAL KHUSUS / UPP / BUP
// LAIN / PELABUHAN KHUSUS"). The reference reports shorten these to a
// readable form; reusing the raw label everywhere causes cards/tables to
// overflow. This is a manual map (not a generic algorithm) because a good
// short name is a judgment call, not a mechanical transformation.
const SHORT_LOCATION: Record<string, string> = {
  "DERMAGA UMUM": "Dermaga Umum",
  "REDE TRANSPORT / LOADING POINT / DOLPHIN / PINGGIRAN": "Rede Transport",
  "TUKS / TERMINAL KHUSUS / UPP / BUP LAIN / PELABUHAN KHUSUS":
    "Tuks/Terminal Khusus",
  "LOADING POINT (DI LUAR DLKR)": "Loading Point",
};

export function shortLocationLabel(label: string): string {
  return SHORT_LOCATION[label] ?? label;
}
