'use client';

import { useState } from 'react';
import { Shield, Sparkles, Plus, X, Check } from 'lucide-react';

interface IdentityStatementProps {
  value: string;
  onChange: (value: string) => void;
  customStatements?: string[];
  onCustomStatementsChange?: (statements: string[]) => void;
}

const defaultStatements = [
  "Ik ben iemand die altijd doorzet",
  "Ik ben een leider die waarde creëert",
  "Ik ben iemand die elke dag groeit",
  "Ik ben gefocust en doelgericht",
  "Ik ben iemand die zijn woord houdt",
  "Ik ben energiek en vol vitaliteit",
  "Ik ben creatief en oplossingsgericht",
  "Ik ben dankbaar en positief"
];

export function IdentityStatement({
  value,
  onChange,
  customStatements = [],
  onCustomStatementsChange
}: IdentityStatementProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [newStatement, setNewStatement] = useState('');

  const allStatements = [...defaultStatements, ...customStatements];

  const addCustomStatement = () => {
    if (newStatement.trim() && onCustomStatementsChange) {
      onCustomStatementsChange([...customStatements, newStatement.trim()]);
      setNewStatement('');
      setShowCustomInput(false);
    }
  };

  return (
    <div className="bg-white  rounded-2xl border border-line  overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-line ">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-surface-inverse to-surface-inverse rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-ink ">Identiteit Affirmatie</h3>
            <p className="text-sm text-ink-soft ">
              Wie ben jij? Kies of schrijf je identity statement
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 bg-surface-card  border-b border-line ">
        <p className="text-sm text-ink-soft ">
          <strong>Tony's principe:</strong> De sterkste kracht in menselijke psychologie is de
          behoefte om consistent te blijven met hoe we onszelf definiëren.
          <em> Raise your standards.</em>
        </p>
      </div>

      {/* Statement Selection */}
      <div className="p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {allStatements.map((statement, index) => {
            const isSelected = value === statement;
            return (
              <button
                key={index}
                onClick={() => onChange(statement)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-surface-inverse  text-white  shadow-lg scale-105'
                    : 'bg-surface-card  text-ink-soft  hover:bg-surface-sunken '
                }`}
              >
                {isSelected && <Check size={14} className="inline mr-1" />}
                {statement}
              </button>
            );
          })}
        </div>

        {/* Custom input */}
        {showCustomInput ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newStatement}
              onChange={(e) => setNewStatement(e.target.value)}
              placeholder="Ik ben..."
              className="flex-1 px-4 py-2 bg-surface-card  rounded-xl border-none text-ink  placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-line "
              onKeyPress={(e) => e.key === 'Enter' && addCustomStatement()}
            />
            <button
              onClick={addCustomStatement}
              className="px-4 py-2 bg-surface-inverse  text-white  rounded-xl font-medium"
            >
              <Check size={18} />
            </button>
            <button
              onClick={() => setShowCustomInput(false)}
              className="px-4 py-2 bg-surface-card  text-ink-soft  rounded-xl"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCustomInput(true)}
            className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink-soft  transition-colors"
          >
            <Plus size={16} />
            Eigen statement toevoegen
          </button>
        )}
      </div>

      {/* Selected Statement Display */}
      {value && (
        <div className="p-6 bg-gradient-to-r from-surface-inverse to-surface-inverse  ">
          <div className="text-center">
            <Sparkles className="w-6 h-6 text-tertiary mx-auto mb-3" />
            <p className="text-xl font-bold text-white">"{value}"</p>
            <p className="text-sm text-ink-soft mt-2">
              Herhaal dit 3x hardop met overtuiging
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
