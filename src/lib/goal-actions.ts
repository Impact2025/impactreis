// "Massive Action" uit het RPM-model — nu met voltooiing en een 80/20-hefboommarkering i.p.v.
// een kale string. Geen aparte takentabel: dit leeft binnen de al bestaande `goals.data.nextActions`
// (jsonb), gekoppeld aan het doel/de Rock waar de actie bij hoort.
export interface GoalAction {
  id: string;
  text: string;
  completed: boolean;
  leverage: boolean;
}

/**
 * Normaliseert `nextActions` naar de nieuwe objectvorm, ongeacht of de bron de oude vorm
 * (`string[]`, van vóór deze feature) of de nieuwe vorm bevat. Nooit gooien op onverwachte
 * input — corrupte/ontbrekende items worden overgeslagen in plaats van de hele lijst te breken.
 */
export function normalizeNextActions(raw: unknown): GoalAction[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item): GoalAction | null => {
      if (typeof item === 'string') {
        const text = item.trim();
        if (!text) return null;
        return { id: crypto.randomUUID(), text, completed: false, leverage: false };
      }
      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        const text = typeof obj.text === 'string' ? obj.text.trim() : '';
        if (!text) return null;
        return {
          id: typeof obj.id === 'string' && obj.id ? obj.id : crypto.randomUUID(),
          text,
          completed: obj.completed === true,
          leverage: obj.leverage === true,
        };
      }
      return null;
    })
    .filter((a): a is GoalAction => a !== null);
}
