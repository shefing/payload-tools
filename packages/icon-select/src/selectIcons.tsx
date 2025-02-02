'use client';
import React, { useState } from 'react';
import { useField } from '@payloadcms/ui';
import { FieldLabel as Label } from '@payloadcms/ui';
import { cn } from './lib/utils';
import { Button } from './components/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './components/command';
import { Popover, PopoverContent, PopoverTrigger } from './components/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/tooltip';
import * as Icons from 'flowbite-react-icons/outline';
import { TextFieldClientProps } from 'payload';

type Props = TextFieldClientProps;
const createIconOptions = () => {
  const iconNames = Object.keys(Icons) as Array<keyof typeof Icons>;
  const icons = iconNames.map((iconName) => {
    const IconComponent = Icons[iconName];
    return {
      buttonLabel: (
        <span className='flex items-center text-[13px]'>
          <IconComponent className='mr-2' />
          {iconName.replace(/([A-Z])/g, ' $1').trim()}
        </span>
      ),
      label: (
        <div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <IconComponent className='text-xl' />
              </TooltipTrigger>
              <TooltipContent>{iconName.replace(/([A-Z])/g, ' $1').trim()}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ),
      value: iconName,
    };
  });
  return icons;
};
const icons = createIconOptions();
const SelectIcons: React.FC<Props> = (props) => {
  const { field, path } = props;
  const label = field.label;
  const { value, setValue } = useField<string>({ path: path });
  const [open, setOpen] = useState(false);
  const [selectIcon, setSelectIcon] = useState(icons.find((icon) => icon.value === value) || null);
  const handleSelect = (value: string) => {
    const icon = icons.find((icon) => icon.value === value) || null;
    setSelectIcon(icon);
    setValue(value);
    setOpen(false);
  };
  const labelToUse = label ? label : 'Icon';
  return (
    <div className='comp'>
      <Label
        htmlFor={`comp bfColourPickerField-${path?.replace(/\./gi, '__')}`}
        label={labelToUse}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className='comp mb-[10px]' asChild>
          <Button
            variant='outline'
            className={cn(
              'comp w-[220px] justify-start text-left font-normal',
              !selectIcon && 'text-muted-foreground',
            )}
          >
            {selectIcon ? (
              <span className='comp 2xl'>{selectIcon.buttonLabel}</span>
            ) : (
              <span className='comp 2xl'>+ add Icon</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='comp mb-[10px] p-0' side='right' align='start'>
          <Command>
            <CommandInput placeholder='Search icon...' />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                <div className='grid grid-cols-10'>
                  {icons.map((icon) => (
                    <CommandItem key={icon.value} value={icon.value} onSelect={handleSelect}>
                      {icon.label}
                    </CommandItem>
                  ))}
                </div>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
export default SelectIcons;
