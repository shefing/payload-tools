'use client';

import { useEffect, useState } from 'react';
import { CalendarIcon, ChevronDown, X } from 'lucide-react';

import { formatDate, getDateRangeForOption } from '../utils/date-helpers';
import { DateFilterValue, DateRange, Locale } from '../types/filters-type';
import { Button } from '../../ui/button';
import { cn } from '../../lib/utils';
import { Label } from '../../ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Separator } from '../../ui/separator';
import { Calendar } from '../../ui/calendar';
import { getDateFilterOptions } from '../constants/date-filter-options';
import { SupportedLocale, getLabel } from '../../labels';


interface DateFilterProps {
  label?: string;
  value?: DateFilterValue;
  onChange: (value: DateFilterValue) => void;
  locale?: Locale;
  className?: string;
  style?: React.CSSProperties;
}

export function DateFilter({
  label,
  value,
  onChange,
  locale = { code: 'he', direction: 'rtl' },
  className,
  style,
}: DateFilterProps) {
  const [internalValue, setInternalValue] = useState<DateFilterValue | undefined>(value);
  const [customRange, setCustomRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [showCustom, setShowCustom] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [openFromCalendar, setOpenFromCalendar] = useState(false);
  const [openToCalendar, setOpenToCalendar] = useState(false);

  const isRTL = locale.direction === 'rtl';
  const localeCode = locale.code as SupportedLocale;
  const { pastOptions, futureOptions } = getDateFilterOptions(localeCode);

  // Sync internal state with external value prop
  useEffect(() => {
    setInternalValue(value);
    if (value?.type === 'custom' && value.customRange) {
      setCustomRange(value.customRange);
    }
  }, [value]);

  const labels = {
    selectOption: getLabel('selectOption', localeCode),
    from: getLabel('from', localeCode),
    to: getLabel('to', localeCode),
    selectDate: getLabel('selectDate', localeCode),
    past: getLabel('past', localeCode),
    future: getLabel('future', localeCode),
    presentFuture: getLabel('presentFuture', localeCode),
    custom: getLabel('customRange', localeCode),
    apply: getLabel('apply', localeCode),
    cancel: getLabel('cancel', localeCode),
  };

  const handlePredefinedSelect = (optionValue: string) => {
    setShowCustom(false);
    setIsOpen(false);

    const dateRange = getDateRangeForOption(optionValue, locale.code);
    const newValue: DateFilterValue = {
      type: 'predefined',
      predefinedValue: optionValue,
      customRange: { from: dateRange.from, to: dateRange.to },
    };

    setInternalValue(newValue);
    onChange(newValue);
  };

  const handleCustomSelect = () => {
    setShowCustom(true);
  };

  const handleCustomRangeChange = (newRange: DateRange) => {
    setCustomRange(newRange);
  };

  const handleApplyCustomRange = () => {
    const newValue: DateFilterValue = {
      type: 'custom',
      customRange,
    };

    setInternalValue(newValue);
    onChange(newValue);
    setIsOpen(false);
    setShowCustom(false);
  };

  const handleCancelCustomRange = () => {
    setIsOpen(false);
    setShowCustom(false);
    setCustomRange({ from: undefined, to: undefined });
  };

  const handleClearAll = () => {
    setInternalValue(undefined);
    setCustomRange({ from: undefined, to: undefined });
    setShowCustom(false);
    onChange({} as DateFilterValue);
  };

  const hasValue = () => {
    return (
      internalValue && (internalValue.type === 'predefined' || internalValue.type === 'custom')
    );
  };

  const getDisplayValue = () => {
    if (internalValue?.type === 'custom' && internalValue.customRange) {
      const { from, to } = internalValue.customRange;
      if (from && to) {
        return `${formatDate(from, 'dd/MM/yyyy')}-${formatDate(to, 'dd/MM/yyyy')}`;
      } else if (from) {
        return `${labels.from}: ${formatDate(from, 'dd/MM/yyyy')}`;
      } else if (to) {
        return `${labels.to}: ${formatDate(to, 'dd/MM/yyyy')}`;
      }
      return labels.custom;
    }

    if (internalValue?.type === 'predefined' && internalValue.predefinedValue) {
      const allOptions = [...pastOptions, ...futureOptions];
      const option = allOptions.find((opt) => opt.value === internalValue.predefinedValue);
      const dateRange = getDateRangeForOption(internalValue.predefinedValue, locale.code);
      return `${option?.label || internalValue.predefinedValue} ${dateRange.description}`;
    }

    return labels.selectOption;
  };

  const formatDateRange = (description: string) => {
    // Check if description contains a date range (has " - " in it)
    if (description.includes(' - ') && isRTL) {
      // Split by " - " and reverse the order for RTL
      const parts = description.replace(/[()]/g, '').split(' - ');
      if (parts.length === 2) {
        return `(${parts[1]}-${parts[0]})`;
      }
    }
    return description;
  };

  const renderOptionWithDate = (option: { value: string; label: string }) => {
    const dateRange = getDateRangeForOption(option.value, locale.code);
    const formattedDescription = formatDateRange(dateRange.description);

    return (
      <Button
        key={option.value}
        variant='ghost'
        className={cn(
          ' w-full h-auto py-1 px-2 text-xs leading-tight justify-start',
          isRTL ? ' text-right' : ' text-left',
          internalValue?.predefinedValue === option.value && 'bg-accent',
        )}
        onClick={() => handlePredefinedSelect(option.value)}
      >
        <div className={cn('flex flex-col')}>
          <span className='font-medium'>{option.label}</span>
          <span className='text-[10px] text-muted-foreground' dir={locale.direction}>
            {formattedDescription}
          </span>
        </div>
      </Button>
    );
  };

  return (
    <div className={cn('useTw space-y-1', className)} dir={locale.direction} style={style}>
      {label && (
        <Label className={cn('useTw text-sm font-medium', isRTL && 'text-right block')}>
          {label}
        </Label>
      )}

      <div className='relative useTw'>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild className='useTw'>
            <Button
              variant='outline'
              role='combobox'
              aria-expanded={isOpen}
              className='useTw w-full justify-between bg-background relative min-w-70'
            >
              <span className={`useTw truncate ${isRTL && 'text-right'}`}>{getDisplayValue()}</span>
              <ChevronDown className='useTw h-4 w-4 shrink-0 opacity-50' />
            </Button>
          </PopoverTrigger>
          <PopoverContent className='useTw w-80 p-0'>
            <div className='p-4'>
              <div className='grid grid-cols-2 gap-4'>
                {/* Future Options - Left column */}
                <div className='space-y-1'>
                  <div
                    className={cn(
                      'text-sm font-semibold text-muted-foreground mb-2',
                      isRTL && 'text-right',
                    )}
                  >
                    {labels.presentFuture}
                  </div>
                  <div className='space-y-0.5'>
                    {futureOptions.map((option) => (
                      <div key={option.value}>{renderOptionWithDate(option)}</div>
                    ))}
                  </div>
                </div>

                {/* Past Options - Right column */}
                <div className='space-y-1'>
                  <div
                    className={cn(
                      'text-sm font-semibold text-muted-foreground mb-2',
                      isRTL && 'text-right',
                    )}
                  >
                    {labels.past}
                  </div>
                  <div className='space-y-0.5'>
                    {pastOptions.map((option) => (
                      <div key={option.value}>{renderOptionWithDate(option)}</div>
                    ))}
                  </div>
                </div>
              </div>

              <Separator className='my-4' />

              {/* Custom Option */}
              <div className='space-y-3'>
                <Button
                  variant='ghost'
                  className={cn(
                    'useTw w-full justify-start h-auto py-2 px-2',
                    (showCustom || internalValue?.type === 'custom') && 'bg-accent',
                    isRTL && 'justify-start text-right',
                  )}
                  onClick={handleCustomSelect}
                >
                  {labels.custom}
                </Button>

                {/* Custom Date Range - appears next to custom label */}
                {showCustom && (
                  <div className='space-y-3 pl-2'>
                    <div className='grid grid-cols-1 gap-3'>
                      {/* From Date */}
                      <div className={cn('flex items-center gap-2')}>
                        <Label className={cn('useTw text-xs w-[20%]', isRTL && 'text-right')}>
                          {labels.from}
                        </Label>
                        <Popover open={openFromCalendar} onOpenChange={setOpenFromCalendar}>
                          <PopoverTrigger asChild className='useTw'>
                            <Button
                              variant='outline'
                              className={cn(
                                'useTw w-[60%] justify-start text-left font-normal text-xs h-8 bg-background',
                                !customRange.from && 'text-muted-foreground',
                              )}
                            >
                              <CalendarIcon className='useTw mr-1 h-3 w-3' />
                              <span dir={locale.direction}>
                                {customRange.from
                                  ? formatDate(customRange.from, 'dd/MM/yyyy')
                                  : labels.selectDate}
                              </span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className='useTw w-auto p-0' align='start'>
                            <Calendar
                              mode='single'
                              selected={customRange.from}
                              onSelect={(date) => {
                                handleCustomRangeChange({ ...customRange, from: date });
                                setOpenFromCalendar(false);
                              }}
                              initialFocus
                              className='useTw'
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* To Date */}
                      <div className={cn('flex items-center gap-2')}>
                        <Label className={cn('useTw text-xs w-[20%]', isRTL && 'text-right')}>
                          {labels.to}
                        </Label>
                        <Popover open={openToCalendar} onOpenChange={setOpenToCalendar}>
                          <PopoverTrigger asChild className='useTw'>
                            <Button
                              variant='outline'
                              className={cn(
                                'useTw w-[60%] justify-start text-left font-normal text-xs h-8 bg-background',
                                !customRange.to && 'text-muted-foreground',
                              )}
                            >
                              <CalendarIcon className='useTw mr-1 h-3 w-3' />
                              <span dir={locale.direction}>
                                {customRange.to
                                  ? formatDate(customRange.to, 'dd/MM/yyyy')
                                  : labels.selectDate}
                              </span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className='useTw w-auto p-0' align='start'>
                            <Calendar
                              mode='single'
                              selected={customRange.to}
                              onSelect={(date) => {
                                handleCustomRangeChange({ ...customRange, to: date });
                                setOpenToCalendar(false);
                              }}
                              initialFocus
                              className='useTw'
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className='flex gap-2'>
                      <Button
                        onClick={handleApplyCustomRange}
                        className='useTw flex-1 text-xs h-8'
                        disabled={!customRange.from && !customRange.to}
                      >
                        {labels.apply}
                      </Button>
                      <Button
                        onClick={handleCancelCustomRange}
                        variant='outline'
                        className='useTw flex-1 text-xs h-8 bg-transparent'
                      >
                        {labels.cancel}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {hasValue() && (
          <button
            className={`useTw absolute ${isRTL ? 'left-8' : 'right-8'} top-1/2 -translate-y-1/2 h-4 w-4 p-0 hover:bg-muted rounded-sm flex items-center justify-center z-10 `}
            onClick={(e) => {
              e.stopPropagation();
              handleClearAll();
            }}
          >
            <X className='useTw h-3 w-3' />
          </button>
        )}
      </div>
    </div>
  );
}
