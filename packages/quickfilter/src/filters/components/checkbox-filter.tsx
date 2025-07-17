'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { CheckboxFilterState, Locale } from '../types/filters-type';
import { Label } from '../../ui/label';
import { cn } from '../../lib/utils';
import { Button } from '../../ui/button';

interface CheckboxFilterProps {
  label?: string;
  checkboxLabel: string;
  value?: CheckboxFilterState;
  onChange: (state: CheckboxFilterState) => void;
  locale?: Locale;
  className?: string;
}

export function CheckboxFilter({
  label,
  checkboxLabel,
  value = 'indeterminate',
  onChange,
  locale = { code: 'he', direction: 'rtl' },
  className,
}: CheckboxFilterProps) {
  const [internalState, setInternalState] = useState<CheckboxFilterState>(value);

  const isHebrew = locale.code === 'he';

  // Sync internal state with external value prop
  useEffect(() => {
    setInternalState(value);
  }, [value]);

  const handleToggle = (newState: 'checked' | 'unchecked') => {
    setInternalState(newState);
    onChange(newState);
  };

  const handleClear = () => {
    setInternalState('indeterminate');
    onChange('indeterminate');
  };

  const isActive = internalState === 'checked' || internalState === 'unchecked';

  const labels_toggle = {
    yes: isHebrew ? 'כן' : 'Yes',
    no: isHebrew ? 'לא' : 'No',
  };

  return (
    <div className={cn('space-y-1', className)} dir={locale.direction}>
      {label && (
        <Label className={cn('useTw text-sm font-medium', isHebrew && 'text-right block')}>
          {label}
        </Label>
      )}

      <div
        className={cn(
          'flex items-center gap-3 transition-colors py-px',
          locale.direction === 'rtl' && 'justify-start',
        )}
      >
        <div className={cn('flex items-center', locale.direction === 'rtl' && 'order-first')}>
          {/* Two Button Toggle */}
          <div className='flex rounded-md border overflow-hidden'>
            {/* In RTL, YES comes first, in LTR, NO comes first */}
            <Button
              variant={internalState === 'checked' ? 'default' : 'ghost'}
              size='sm'
              className={cn(
                'useTW px-3 py-1 text-xs rounded-none border-0',
                internalState === 'checked'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-background text-muted-foreground hover:bg-muted',
              )}
              onClick={() => handleToggle('checked')}
            >
              {labels_toggle.yes}
            </Button>
            <Button
              variant={internalState === 'unchecked' ? 'default' : 'ghost'}
              size='sm'
              className={cn(
                'useTw px-3 py-1 text-xs rounded-none border-0 border-l',
                internalState === 'unchecked'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-background text-muted-foreground hover:bg-muted',
              )}
              onClick={() => handleToggle('unchecked')}
            >
              {labels_toggle.no}
            </Button>
          </div>
        </div>

        {checkboxLabel && (
          <Label
            className={cn(
              'useTw cursor-pointer select-none text-sm',
              isHebrew && 'text-right',
              locale.direction === 'rtl' && 'order-2',
            )}
          >
            {checkboxLabel}
          </Label>
        )}

        {(internalState === 'checked' || internalState === 'unchecked') && (
          <Button
            variant='ghost'
            size='sm'
            className={cn(
              'h-5 w-5 p-0 hover:bg-muted rounded-full -mt-1',
              checkboxLabel
                ? locale.direction === 'rtl'
                  ? 'order-last -ml-1'
                  : 'order-last -mr-1'
                : locale.direction === 'rtl'
                  ? 'ml-[80px] order-last'
                  : 'mr-[80px] order-last',
            )}
            onClick={handleClear}
          >
            <X className='h-3 w-3' />
          </Button>
        )}
      </div>
    </div>
  );
}
