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
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Identiteit Affirmatie</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Wie ben jij? Kies of schrijf je identity statement
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
        <p className="text-sm text-slate-600 dark:text-slate-400">
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
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg scale-105'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
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
              className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border-none text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
              onKeyPress={(e) => e.key === 'Enter' && addCustomStatement()}
            />
            <button
              onClick={addCustomStatement}
              className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium"
            >
              <Check size={18} />
            </button>
            <button
              onClick={() => setShowCustomInput(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCustomInput(true)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <Plus size={16} />
            Eigen statement toevoegen
          </button>
        )}
      </div>

      {/* Selected Statement Display */}
      {value && (
        <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700">
          <div className="text-center">
            <Sparkles className="w-6 h-6 text-amber-400 mx-auto mb-3" />
            <p className="text-xl font-bold text-white">"{value}"</p>
            <p className="text-sm text-slate-400 mt-2">
              Herhaal dit 3x hardop met overtuiging
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
