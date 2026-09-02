'use client';

import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface PowerQuestionsProps {
  type: 'morning' | 'evening';
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}

const morningQuestions = [
  {
    id: 'grateful',
    question: 'Waar ben ik nu het meest dankbaar voor in mijn leven?',
    hint: 'Denk aan relaties, kansen, gezondheid, groei...',
    pro: 'Dankbaarheid richt je zenuwstelsel op wat er al werkt, in plaats van op wat ontbreekt. Neurologisch kun je niet tegelijk angstig en oprecht dankbaar zijn — daarom opent Tony Robbins zijn "Hour of Power" hiermee: het zet de fysiologische toon voor de rest van je dag.',
    suggestions: [
      'Noem iets kleins van vandaag, niet alleen grote levensdingen',
      'Voel het even vast — niet alleen opschrijven, maar 5 seconden echt ervaren',
      'Varieer: gisteren relaties, vandaag gezondheid, morgen een kans',
    ],
  },
  {
    id: 'excited',
    question: 'Waar ben ik nu het meest enthousiast over?',
    hint: 'Wat geeft je energie als je eraan denkt?',
    pro: 'Enthousiasme is een voorspeller van actie. Wat je hier noteert, is vaak precies waar je vandaag tijd aan zou moeten geven — het is een signaal, geen bijzaak.',
    suggestions: [
      'Mag ook een klein project of gesprek zijn, niet per se een "groot" doel',
      'Check: staat dit al in je agenda vandaag? Zo niet, plan het alsnog in',
      'Merk je niets? Dat is zelf ook data — mogelijk tijd voor een reset',
    ],
  },
  {
    id: 'proud',
    question: 'Waar ben ik nu het meest trots op?',
    hint: 'Welke prestatie, kwaliteit of groei?',
    pro: 'Trots bouwt identiteit: elke keer dat je een prestatie benoemt, versterk je het zelfbeeld "ik ben iemand die dit soort dingen doet." Dat zelfbeeld stuurt je toekomstig gedrag sterker dan wilskracht.',
    suggestions: [
      'Zoek naar vooruitgang, niet perfectie ("beter dan vorige week" telt)',
      'Benoem ook karaktereigenschappen, niet alleen resultaten',
      'Deel het weleens hardop met iemand — dat verankert het extra',
    ],
  },
  {
    id: 'enjoying',
    question: 'Waar geniet ik nu het meest van in mijn leven?',
    hint: 'Welke momenten, activiteiten of relaties?',
    pro: 'Deze vraag voorkomt dat "succesvol" en "leeg" samenvallen. Ondernemers die alleen op prestatie sturen, verliezen vaak het contact met wat ze eigenlijk leuk vinden — dit is je check-in daarop.',
    suggestions: [
      'Denk aan alledaagse dingen: koffie, een wandeling, een gesprek',
      'Als het antwoord elke dag hetzelfde is, is dat prima — herhaling is genieting',
      'Merk je dit steeds leeg blijft? Bespreek het met AIPA in de coach',
    ],
  },
  {
    id: 'committed',
    question: 'Waar ben ik nu het meest aan toegewijd?',
    hint: 'Welke doelen of waarden drijven je?',
    pro: 'Toewijding is de brug tussen dankbaarheid/enthousiasme en actie. Dit antwoord zou moeten resoneren met je 90-dagen hefboomdoel — als dat niet zo is, is dat een signaal dat je focus versnippert.',
    suggestions: [
      'Vergelijk je antwoord met je Golden Egg / Focus van de dag op het dashboard',
      'Mag een waarde zijn ("gezondheid van mijn gezin") of een concreet doel',
      'Eén scherpe toewijding werkt beter dan vijf vage',
    ],
  },
];

const eveningQuestions = [
  {
    id: 'gave',
    question: 'Wat heb ik vandaag GEGEVEN?',
    hint: 'Denk aan waarde, liefde, hulp, inspiratie...',
    pro: "Robbins stelt dat leven = geven. Deze vraag traint je brein om bij te houden hoe je waarde toevoegt aan anderen, wat op termijn voldoening geeft die los staat van resultaten of omzet.",
    suggestions: [
      'Klein telt: een compliment, aandacht, een snel antwoord op een vraag',
      'Zakelijk én persoonlijk mag door elkaar — beide zijn "geven"',
      'Niets gegeven vandaag? Plan morgen bewust één moment van geven in',
    ],
  },
  {
    id: 'learned',
    question: 'Wat heb ik vandaag GELEERD?',
    hint: 'Nieuwe inzichten, vaardigheden, perspectieven...',
    pro: 'Groei zonder reflectie beklijft niet — je brein onthoudt een les pas echt als je die expliciet benoemt. Deze vraag zet ervaring om in leerpunten die je morgen kunt toepassen.',
    suggestions: [
      'Ook fouten of tegenslagen tellen — vaak zelfs de rijkste lessen',
      'Probeer het in één zin te vangen: "Ik leerde dat..."',
      'Zie je een terugkerende les over meerdere dagen? Dat is een patroon om serieus te nemen',
    ],
  },
  {
    id: 'quality',
    question: 'Hoe heeft vandaag bijgedragen aan mijn kwaliteit van leven?',
    hint: 'In welke gebieden ben je gegroeid of vooruitgegaan?',
    pro: 'Deze vraag koppelt je dag terug aan het grotere plaatje — business, gezondheid, relaties — in plaats van alleen aan de losse taken die je hebt afgevinkt.',
    suggestions: [
      'Loop kort je levensgebieden langs: werk, gezondheid, relaties, persoonlijk',
      'Eén concreet voorbeeld werkt beter dan een algemene uitspraak',
      'Vergelijk met gisteren: ging het gebied vooruit, gelijk, of achteruit?',
    ],
  },
  {
    id: 'better',
    question: 'Hoe kan ik morgen nog beter maken?',
    hint: 'Welke kleine aanpassing zou een groot verschil maken?',
    pro: 'Dit is de brug naar morgen: één klein, uitvoerbaar aanpassingspunt voorkomt dat reflectie bij inzicht blijft steken zonder gedragsverandering.',
    suggestions: [
      'Kies één ding, geen lijst — kleine aanpassingen zijn vol te houden',
      'Maak het concreet en tijdgebonden ("15 min eerder starten" i.p.v. "productiever zijn")',
      'Check morgenavond terug of je dit ook echt hebt toegepast',
    ],
  },
];

export function PowerQuestions({ type, values, onChange }: PowerQuestionsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number>(0);
  const questions = type === 'morning' ? morningQuestions : eveningQuestions;

  const updateValue = (id: string, value: string) => {
    onChange({ ...values, [id]: value });
  };

  const answeredCount = questions.filter(q => values[q.id]?.trim().length > 0).length;
  const allAnswered = answeredCount === questions.length;

  return (
    <div className="bg-white  rounded-2xl border border-line  overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-line ">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              type === 'morning'
                ? 'bg-gradient-to-br from-tertiary to-tertiary'
                : 'bg-gradient-to-br from-accent to-accent'
            }`}>
              <HelpCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-ink ">
                {type === 'morning' ? 'Ochtend' : 'Avond'} Power Questions
              </h3>
              <p className="text-sm text-ink-soft ">
                Quality questions create a quality life
              </p>
            </div>
          </div>
          <div className="text-sm text-ink-soft">
            {answeredCount}/{questions.length}
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="divide-y divide-line ">
        {questions.map((q, index) => {
          const isExpanded = expandedIndex === index;
          const hasAnswer = values[q.id]?.trim().length > 0;

          return (
            <div key={q.id} className="transition-colors">
              <div className="w-full p-4 flex items-center justify-between gap-2 hover:bg-surface-card ">
                <button
                  onClick={() => setExpandedIndex(isExpanded ? -1 : index)}
                  className="flex-1 flex items-center gap-3 text-left min-w-0"
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                    hasAnswer
                      ? 'bg-primary text-white'
                      : 'bg-surface-card  text-ink-soft'
                  }`}>
                    {hasAnswer ? '✓' : index + 1}
                  </div>
                  <span className={`font-medium ${
                    hasAnswer
                      ? 'text-ink-soft '
                      : 'text-ink '
                  }`}>
                    {q.question}
                  </span>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <InfoTooltip title={q.question} explanation={q.pro} suggestions={q.suggestions} />
                  <button onClick={() => setExpandedIndex(isExpanded ? -1 : index)} aria-label={isExpanded ? 'Inklappen' : 'Uitklappen'}>
                    {isExpanded ? (
                      <ChevronUp size={18} className="text-ink-soft" />
                    ) : (
                      <ChevronDown size={18} className="text-ink-soft" />
                    )}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-ink-soft  mb-3 pl-9">
                    {q.hint}
                  </p>
                  <textarea
                    value={values[q.id] || ''}
                    onChange={(e) => updateValue(q.id, e.target.value)}
                    placeholder="Jouw antwoord..."
                    rows={3}
                    className="w-full p-3 bg-surface-card  rounded-xl border border-line  text-ink  placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-line  resize-none"
                  />
                  {index < questions.length - 1 && values[q.id]?.trim() && (
                    <button
                      onClick={() => setExpandedIndex(index + 1)}
                      className="mt-2 text-sm text-ink-soft hover:text-ink-soft "
                    >
                      Volgende vraag →
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion */}
      {allAnswered && (
        <div className={`p-4 text-center ${
          type === 'morning'
            ? 'bg-gradient-to-r from-tertiary to-tertiary'
            : 'bg-gradient-to-r from-accent to-accent'
        }`}>
          <div className="flex items-center justify-center gap-2 text-white">
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">Alle power questions beantwoord!</span>
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      )}

      {/* Quote */}
      <div className="p-4 bg-surface-card  border-t border-line ">
        <p className="text-sm text-ink-soft  italic text-center">
          "Quality questions create a quality life. Successful people ask better questions."
          <span className="block text-xs text-ink-soft mt-1">— Tony Robbins</span>
        </p>
      </div>
    </div>
  );
}
