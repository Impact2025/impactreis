import { describe, it, expect } from 'vitest';
import { normalizeNextActions } from '../goal-actions';

// normalizeNextActions() is de enige plek die oude goals (nextActions als string[], van vóór
// Fase 3) en nieuwe goals (GoalAction[]) verzoent — een regressie hier laat oude doelen crashen
// zodra de gebruiker ze opent, of laat de 80/20-hefboomvlag stil verdwijnen.

describe('normalizeNextActions', () => {
  it('geeft een lege lijst terug voor niet-array input', () => {
    expect(normalizeNextActions(null)).toEqual([]);
    expect(normalizeNextActions(undefined)).toEqual([]);
    expect(normalizeNextActions('niet een array')).toEqual([]);
    expect(normalizeNextActions({})).toEqual([]);
  });

  it('zet de oude string[]-vorm om naar GoalAction met completed/leverage op false', () => {
    const result = normalizeNextActions(['Bel klant X', 'Schrijf voorstel']);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ text: 'Bel klant X', completed: false, leverage: false });
    expect(result[1]).toMatchObject({ text: 'Schrijf voorstel', completed: false, leverage: false });
    expect(result[0].id).toBeTruthy();
    expect(result[0].id).not.toBe(result[1].id);
  });

  it('laat de nieuwe GoalAction-vorm ongewijzigd (inclusief bestaande id/completed/leverage)', () => {
    const input = [{ id: 'abc-123', text: 'Al bestaande actie', completed: true, leverage: true }];
    const result = normalizeNextActions(input);
    expect(result).toEqual([{ id: 'abc-123', text: 'Al bestaande actie', completed: true, leverage: true }]);
  });

  it('slaat lege strings en items zonder tekst over in plaats van te crashen', () => {
    const result = normalizeNextActions(['', '   ', { text: '' }, { text: 'Geldige actie', completed: false, leverage: false }]);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe('Geldige actie');
  });

  it('gaat door bij corrupte items (null, getallen, objecten zonder text) zonder te crashen', () => {
    const result = normalizeNextActions([null, 42, { foo: 'bar' }, 'Toch een geldige actie']);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe('Toch een geldige actie');
  });

  it('behandelt een gemengde array van oude en nieuwe vorm correct', () => {
    const result = normalizeNextActions([
      'Oude actie',
      { id: 'x1', text: 'Nieuwe actie', completed: true, leverage: false },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ text: 'Oude actie', completed: false, leverage: false });
    expect(result[1]).toEqual({ id: 'x1', text: 'Nieuwe actie', completed: true, leverage: false });
  });
});
