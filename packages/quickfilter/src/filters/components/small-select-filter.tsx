'use client';

import { useEffect, useState } from 'react';

import { X } from 'lucide-react';
import { Locale, SelectFilterValue } from '../types/filters-type';
import { Label } from '../../ui/label';
import { cn } from '../../lib/utils';
import { Button } from '../../ui/button';
import { SupportedLocale } from '../../labels';

interface SmallSelectOption {
  value: string;
  label: string;
}

interface SmallSelectFilterProps {
  label?: string;
  options: SmallSelectOption[];
  value?: SelectFilterValue;
  onChange: (value: SelectFilterValue) => void;
  locale?: Locale;
  className?: string;
  multiSelect?: boolean;
  maxOptions?: number;
  style?: React.CSSProperties;
}

export function SmallSelectFilter({
  label,
  options,
  value,
  onChange,
  locale = { code: 'he', direction: 'rtl' },
  className,
  multiSelect = true,
  maxOptions = 3,
  style,
}: SmallSelectFilterProps) {
  const [internalValue, setInternalValue] = useState<SelectFilterValue>(
    value || { type: 'none', selectedValues: [] },
  );

  const isRtl = locale?.direction === 'rtl';

  // Limit options to maxOptions
  const limitedOptions = options.slice(0, maxOptions);

  // Sync internal state with external value prop
  useEffect(() => {
    setInternalValue(value || { type: 'none', selectedValues: [] });
  }, [value]);

  const handleOptionToggle = (optionValue: string) => {
    let newSelectedValues: string[];

    if (multiSelect) {
      // Multiple selection mode - allow multiple choices
      if (internalValue.selectedValues.includes(optionValue)) {
        newSelectedValues = internalValue.selectedValues.filter((val) => val !== optionValue);
      } else {
        newSelectedValues = [...internalValue.selectedValues, optionValue];
      }
    } else {
      // Single selection mode
      if (internalValue.selectedValues.includes(optionValue)) {
        newSelectedValues = []; // Deselect if already selected
      } else {
        newSelectedValues = [optionValue]; // Select only this option
      }
    }

    const newValue: SelectFilterValue = {
      type:
        newSelectedValues.length === 0
          ? 'none'
          : newSelectedValues.length === options.length
            ? 'all'
            : 'some',
      selectedValues: newSelectedValues,
    };
    setInternalValue(newValue);
    onChange(newValue);
  };

  const handleClear = () => {
    const newValue: SelectFilterValue = { type: 'none', selectedValues: [] };
    setInternalValue(newValue);
    onChange(newValue);
  };

  const hasSelection = internalValue.selectedValues.length > 0;

  const isOptionSelected = (optionValue: string) => {
    return internalValue.selectedValues.includes(optionValue);
  };

  const getButtonColor = (optionValue: string, index: number) => {
    if (!isOptionSelected(optionValue)) {
      return 'useTw bg-background text-muted-foreground hover:bg-muted';
    }

    // Different colors for different options when selected
    const colors = [
      'bg-blue-600 text-white hover:bg-blue-700', // First option - blue
      'bg-green-600 text-white hover:bg-green-700', // Second option - green
      'bg-purple-600 text-white hover:bg-purple-700', // Third option - purple
    ];
    return colors[index] || 'bg-accent text-accent-foreground hover:bg-accent/80';
  };

  return (
    <div className={cn('space-y-2', className)} dir={locale.direction} style={style}>
      {label && (
        <Label className={cn('useTw text-sm font-medium', isRtl && 'text-right block')}>
          {label}
        </Label>
      )}

      <div
        className={cn(
          'flex items-center gap-3 transition-colors py-0.5',
          locale.direction === 'rtl' && 'justify-start',
        )}
      >
        <div className={cn('flex items-center', locale.direction === 'rtl' && 'order-first')}>
          {/* Toggle Options */}
          <div className='flex rounded-md border overflow-hidden'>
            {limitedOptions.map((option, index) => (
              <Button
                key={option.value}
                variant='ghost'
                size='sm'
                className={cn(
                  'px-3 py-1 text-xs rounded-none border-0',
                  index > 0 && 'border-l',
                  getButtonColor(option.value, index),
                )}
                onClick={() => handleOptionToggle(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {hasSelection && (
          <Button
            variant='ghost'
            size='sm'
            className={cn(
              'h-5 w-5 p-0 hover:bg-muted rounded-full -mt-1 -ml-1',
              locale.direction === 'rtl' ? 'order-last' : 'order-last',
            )}
            onClick={handleClear}
          >
            <X className='useTw h-3 w-3' />
          </Button>
        )}
      </div>
    </div>
  );
}
