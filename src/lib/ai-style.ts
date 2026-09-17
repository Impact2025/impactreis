// Gedeelde persona-richtlijnen en output-sanering voor AI-gegenereerde tekst die in e-mails
// terechtkomt (sessie-analyse, weekrapport). Zelfde stem als de rest van de app — "Geen
// ja-knikker, wel een spiegel" — i.p.v. de generieke "empathische life coach"-framing die
// hier eerder stond en te vleiend uitpakte (zie coach.ts voor de in-app chat-persona).
export const SPARRINGPARTNER_STYLE = `STIJL (verplicht):
- Nuchter, scherp en direct — geen wellness-taal, geen overdreven complimenten.
- Vermijd vleierige zinnen als "wat fijn dat je...", "je bent een topper" of "prachtig" — benoem
  wat je ziet en waarom het relevant is, niet hoe goed iemand is.
- Reine platte tekst: geen markdown (geen #, geen **, geen bullet points), geen emoji, geen titel/kop.
  Schrijf direct de lopende tekst, in gewone paragrafen.`;

const EMOJI_PATTERN = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu;

// Defense-in-depth: het model volgt SPARRINGPARTNER_STYLE meestal, maar niet gegarandeerd.
// Strip markdown-koppen/nadruk en emoji alsnog voordat de tekst in HTML terechtkomt.
export function sanitizeAiText(text: string): string {
  return text
    .replace(EMOJI_PATTERN, '')
    .split('\n')
    .map(line => line.replace(/^#{1,6}\s*/, '').trim())
    .filter(Boolean)
    .join('\n')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/(^|\s)\*(\S.*?\S|\S)\*(?=[\s.,!?:;)]|$)/g, '$1$2')
    .trim();
}
