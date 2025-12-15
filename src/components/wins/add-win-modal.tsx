import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { CreateWinData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AddWinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateWinData) => Promise<void>;
}

/**
 * Add Win Modal Component
 * Modal voor het toevoegen van nieuwe wins met validatie
 */
export const AddWinModal: React.FC<AddWinModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CreateWinData>({
    title: '',
    description: '',
    category: 'business',
    impactLevel: 3,
    date: new Date().toISOString().split('T')[0],
    tags: [],
  });

  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category configuratie
  const categories = [
    { value: 'business', label: 'Business', icon: '💼' },
    { value: 'personal', label: 'Persoonlijk', icon: '⭐' },
    { value: 'health', label: 'Gezondheid', icon: '❤️' },
    { value: 'learning', label: 'Leren', icon: '📚' },
  ] as const;

  // Validatie
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Titel is verplicht';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Titel moet minimaal 3 karakters zijn';
    }

    if (!formData.category) {
      newErrors.category = 'Selecteer een categorie';
    }

    if (formData.impactLevel < 1 || formData.impactLevel > 5) {
      newErrors.impactLevel = 'Impact moet tussen 1 en 5 zijn';
    }

    if (!formData.date) {
      newErrors.date = 'Datum is verplicht';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      setErrors({ submit: 'Er ging iets mis. Probeer het opnieuw.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close
  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      category: 'business',
      impactLevel: 3,
      date: new Date().toISOString().split('T')[0],
      tags: [],
    });
    setTagInput('');
    setErrors({});
    onClose();
  };

  // Add tag
  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags?.includes(tag)) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tag],
      });
      setTagInput('');
    }
  };

  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((tag) => tag !== tagToRemove),
    });
  };

  // Handle tag input key press
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-bento-lg shadow-soft-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 rounded-t-bento-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              🏆 Nieuwe Win Toevoegen
            </h2>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <Input
            label="Titel *"
            placeholder="Bijv: Eerste klant binnengehaald!"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            error={errors.title}
          />

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Beschrijving
            </label>
            <textarea
              placeholder="Vertel meer over deze win..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className={cn(
                'w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800',
                'border-2 border-transparent',
                'focus:border-indigo-500 focus:outline-none',
                'text-slate-900 dark:text-white',
                'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                'transition-colors resize-none'
              )}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Categorie *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.value })}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all duration-200',
                    'flex items-center gap-3',
                    formData.category === cat.value
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  )}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
            {errors.category && (
              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                {errors.category}
              </p>
            )}
          </div>

          {/* Impact Level */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Impact Niveau * ({formData.impactLevel}/5)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData({ ...formData, impactLevel: level as 1 | 2 | 3 | 4 | 5 })}
                  className={cn(
                    'flex-1 py-3 rounded-xl border-2 transition-all duration-200',
                    'flex flex-col items-center gap-1',
                    formData.impactLevel >= level
                      ? 'border-gold-500 bg-gold-50 dark:bg-gold-950/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  )}
                >
                  <span className="text-2xl">⭐</span>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {level}
                  </span>
                </button>
              ))}
            </div>
            {errors.impactLevel && (
              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                {errors.impactLevel}
              </p>
            )}
          </div>

          {/* Date */}
          <Input
            type="date"
            label="Datum *"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            error={errors.date}
          />

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Voeg een tag toe..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagKeyPress}
                className={cn(
                  'flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800',
                  'border-2 border-transparent',
                  'focus:border-indigo-500 focus:outline-none',
                  'text-slate-900 dark:text-white',
                  'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                  'transition-colors'
                )}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddTag}
                className="px-6"
              >
                Toevoegen
              </Button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 flex items-center gap-2"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-indigo-900 dark:hover:text-indigo-100"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit error */}
          {errors.submit && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Annuleren
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Opslaan...' : '🏆 Win Toevoegen'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
