'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Locale, SelectFilterOption, SelectFilterValue } from '../types/filters-type';
import { Label } from '../../ui/label';
import { cn } from '../../lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Button } from '../../ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../../ui/command';
import { Checkbox } from '../../ui/checkbox';
import { Badge } from '../../ui/badge';
import { SupportedLocale, getLabel } from '../../labels';

interface SelectFilterProps {
  label?: string;
  options: SelectFilterOption[];
  value?: SelectFilterValue;
  onChange: (value: SelectFilterValue) => void;
  placeholder?: string;
  locale?: Locale;
  className?: string;
  multiSelect?: boolean;
  style?: React.CSSProperties;
}

export function SelectFilter({
  label,
  options,
  value,
  onChange,
  placeholder,
  locale = { code: 'he', direction: 'rtl' },
  className,
  multiSelect = true,
  style,
}: SelectFilterProps) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<SelectFilterValue | undefined>(value);

  const isRtl = locale?.direction === 'rtl';
  const showSearch = options.length > 10;
  const showSelectAll = multiSelect && options.length > 3;

  // Sync internal state with external value prop
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const selectedValues = internalValue?.selectedValues || [];
  const allSelected = selectedValues.length === options.length;

  const labels = {
    selectAll: getLabel('all', locale.code),
    deselectAll: getLabel('all', locale.code),
    search: getLabel('selectOption', locale.code),
    noResults: getLabel('custom', locale.code),
    selected: getLabel('selectOption', locale.code),
    selectedOne: getLabel('selectOption', locale.code),
  };

  const getFilterValue = (values: string[]): SelectFilterValue => {
    if (values.length === 0) {
      return { type: 'none', selectedValues: [] };
    } else if (values.length === options.length) {
      return { type: 'all', selectedValues: values };
    } else {
      return { type: 'some', selectedValues: values };
    }
  };

  const handleSelectAll = () => {
    const allValues = options.map((option) => option.value);
    const newValue = getFilterValue(allValues);
    setInternalValue(newValue);
    onChange(newValue);
  };

  const handleClearAll = () => {
    const newValue = getFilterValue([]);
    setInternalValue(newValue);
    onChange(newValue);
  };

  const handleToggleSelectAll = () => {
    if (allSelected) {
      handleClearAll();
    } else {
      handleSelectAll();
    }
  };

  const handleToggleOption = (optionValue: string) => {
    let newValues: string[];

    if (multiSelect) {
      newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((val) => val !== optionValue)
        : [...selectedValues, optionValue];
    } else {
      newValues = [optionValue];
      setOpen(false);
    }

    const newValue = getFilterValue(newValues);
    setInternalValue(newValue);
    onChange(newValue);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return placeholder || getLabel('selectOption', locale.code);
    } else if (selectedValues.length === options.length) {
      return labels.selectAll;
    } else {
      return `${selectedValues.length} ${selectedValues.length > 1 ? labels.selected : labels.selectedOne} `;
    }
  };

  return (
    <div className={cn('space-y-1', className)} dir={locale.direction} style={style}>
      {label && (
        <Label className={cn('useTw text-sm font-medium', isRtl && 'text-right block')}>
          {label}
        </Label>
      )}

      <div className='relative'>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              role='combobox'
              aria-expanded={open}
              className='w-full justify-between bg-background relative'
            >
              <span className='truncate'>{getDisplayText()}</span>
              <ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
            </Button>
          </PopoverTrigger>
          <PopoverContent className='useTw w-80 p-0' align='start'>
            <Command>
              {showSearch && <CommandInput placeholder={labels.search} />}
              <CommandList>
                <CommandEmpty>{labels.noResults}</CommandEmpty>
                <CommandGroup>
                  {showSelectAll && (
                    <CommandItem onSelect={handleToggleSelectAll}>
                      <div
                        className={cn(
                          'useTw flex items-center w-full justify-between',
                          isRtl && 'flex-row-reverse',
                        )}
                      >
                        <Checkbox
                          checked={allSelected}
                          className={cn(isRtl ? 'useTw ml-2' : 'useTw mr-2')}
                        />
                        <span className={cn(isRtl && 'useTw text-right flex-1 mr-2')}>
                          {allSelected ? labels.deselectAll : labels.selectAll}
                        </span>
                      </div>
                    </CommandItem>
                  )}
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      onSelect={() => handleToggleOption(option.value)}
                    >
                      <div
                        className={cn(
                          'flex items-center w-full justify-between',
                          isRtl && 'flex-row-reverse',
                        )}
                      >
                        {multiSelect ? (
                          <Checkbox
                            checked={selectedValues.includes(option.value)}
                            className={cn(isRtl ? 'useTw ml-2' : 'useTw mx-2')}
                          />
                        ) : (
                          <Check
                            className={cn(
                              'useTw h-4 w-4',
                              isRtl ? 'ml-2' : 'mr-2',
                              selectedValues.includes(option.value) ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                        )}
                        <span className={cn(isRtl && 'text-right flex-1')}>{option.label}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {selectedValues.length > 0 && (
          <button
            className={`useTw absolute ${isRtl ? 'left-8' : 'right-8'} top-1/2 -translate-y-1/2 h-4 w-4 p-0 hover:bg-muted rounded-sm flex items-center justify-center z-10 `}
            onClick={(e) => {
              e.stopPropagation();
              handleClearAll();
            }}
          >
            <X className='h-3 w-3' />
          </button>
        )}
      </div>

      {multiSelect && selectedValues.length > 0 && selectedValues.length < options.length && (
        <div className='flex flex-wrap gap-1 mt-2'>
          {selectedValues.map((value) => {
            const option = options.find((opt) => opt.value === value);
            return (
              <Badge key={value} variant='secondary' className='text-xs bg-background border'>
                {option?.label || value}
                <button
                  className='ml-1 hover:bg-muted rounded-full'
                  onClick={() => handleToggleOption(value)}
                >
                  ×
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
