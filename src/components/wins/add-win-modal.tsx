import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { CreateWinData } from '@/types';
import { X, Plus } from 'lucide-react';

interface AddWinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateWinData) => Promise<void>;
}

const CATEGORIES = [
  { value: 'business',  label: 'Business',    icon: '💼' },
  { value: 'personal',  label: 'Persoonlijk', icon: '⭐' },
  { value: 'health',    label: 'Gezondheid',  icon: '❤️' },
  { value: 'learning',  label: 'Leren',       icon: '📚' },
] as const;

export const AddWinModal: React.FC<AddWinModalProps> = ({ isOpen, onClose, onSubmit }) => {
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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Titel is verplicht';
    else if (formData.title.length < 3) newErrors.title = 'Minimaal 3 tekens';
    if (!formData.category) newErrors.category = 'Selecteer een categorie';
    if (!formData.date) newErrors.date = 'Datum is verplicht';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      handleClose();
    } catch {
      setErrors({ submit: 'Er ging iets mis. Probeer het opnieuw.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ title: '', description: '', category: 'business', impactLevel: 3, date: new Date().toISOString().split('T')[0], tags: [] });
    setTagInput('');
    setErrors({});
    onClose();
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags?.includes(tag)) {
      setFormData({ ...formData, tags: [...(formData.tags || []), tag] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags?.filter((t) => t !== tagToRemove) });
  };

  if (!isOpen) return null;

  const inputBase = 'w-full px-4 py-3.5 rounded-[12px] bg-[#f4f4f7] border border-[#e8e8ec] text-[15px] text-[#0a0a14] placeholder-[#8a8a9a] outline-none focus:border-[#00cc66] transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Sheet */}
      <div className="relative bg-white w-full max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-[24px] sm:rounded-[20px] sm:mx-4">

        {/* Handle (mobile only) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#e8e8ec]" />
        </div>

        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-[#e8e8ec]">
          <h2 className="text-[18px] font-bold text-[#0a0a14]">🏆 Win toevoegen</h2>
          <button
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#f4f4f7] text-[#8a8a9a] hover:text-[#0a0a14] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-5">

          {/* Title */}
          <div>
            <label className="block text-[12px] font-semibold text-[#8a8a9a] uppercase tracking-wider mb-2">
              Titel *
            </label>
            <input
              type="text"
              placeholder="Bijv: Eerste klant binnengehaald!"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={inputBase}
            />
            {errors.title && <p className="mt-1.5 text-[12px] text-red-500">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-[12px] font-semibold text-[#8a8a9a] uppercase tracking-wider mb-2">
              Beschrijving
            </label>
            <textarea
              placeholder="Vertel meer over deze win..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className={cn(inputBase, 'resize-none')}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-[12px] font-semibold text-[#8a8a9a] uppercase tracking-wider mb-3">
              Categorie *
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.value })}
                  className={cn(
                    'p-4 rounded-[14px] border-2 transition-all duration-200 flex items-center gap-3',
                    formData.category === cat.value
                      ? 'border-[#00cc66] bg-[#00cc66]/8'
                      : 'border-[#e8e8ec] bg-[#f4f4f7]'
                  )}
                >
                  <span className="text-[22px]">{cat.icon}</span>
                  <span className={cn('font-semibold text-[14px]', formData.category === cat.value ? 'text-[#0a0a14]' : 'text-[#8a8a9a]')}>
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
            {errors.category && <p className="mt-1.5 text-[12px] text-red-500">{errors.category}</p>}
          </div>

          {/* Impact Level */}
          <div>
            <label className="block text-[12px] font-semibold text-[#8a8a9a] uppercase tracking-wider mb-3">
              Impact niveau * ({formData.impactLevel}/5)
            </label>
            <div className="flex gap-2">
              {([1, 2, 3, 4, 5] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData({ ...formData, impactLevel: level })}
                  className={cn(
                    'flex-1 py-3.5 rounded-[12px] border-2 transition-all duration-200 flex flex-col items-center gap-1',
                    formData.impactLevel >= level
                      ? 'border-[#f59e0b] bg-[#fef3c7]'
                      : 'border-[#e8e8ec] bg-[#f4f4f7]'
                  )}
                >
                  <span className="text-[20px]">⭐</span>
                  <span className="text-[11px] font-semibold text-[#8a8a9a]">{level}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-[12px] font-semibold text-[#8a8a9a] uppercase tracking-wider mb-2">
              Datum *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className={inputBase}
            />
            {errors.date && <p className="mt-1.5 text-[12px] text-red-500">{errors.date}</p>}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[12px] font-semibold text-[#8a8a9a] uppercase tracking-wider mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Voeg tag toe..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                className={cn(inputBase, 'flex-1')}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="w-12 h-[52px] bg-[#f4f4f7] border border-[#e8e8ec] rounded-[12px] flex items-center justify-center text-[#8a8a9a] hover:text-[#0a0a14] hover:border-[#00cc66] transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-full bg-[#00cc66]/10 text-[#0a0a14]">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="text-[#8a8a9a] hover:text-[#0a0a14]">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit error */}
          {errors.submit && (
            <div className="p-4 rounded-[12px] bg-red-50 border border-red-100">
              <p className="text-[13px] text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2 pb-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 py-4 rounded-[14px] border border-[#e8e8ec] text-[15px] font-semibold text-[#8a8a9a] active:scale-[0.98] transition-transform disabled:opacity-40"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-4 rounded-[14px] bg-[#00cc66] text-white text-[15px] font-semibold shadow-[0_4px_16px_rgba(0,204,102,0.35)] active:scale-[0.98] transition-transform disabled:opacity-40"
            >
              {isSubmitting ? 'Opslaan...' : '🏆 Toevoegen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
