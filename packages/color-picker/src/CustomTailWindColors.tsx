'use client'
import { useState } from 'react'
import { FieldLabel, useField } from '@payloadcms/ui'
import { Button } from './components/button.js'
import { Popover, PopoverContent, PopoverTrigger } from './components/popover.js'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './components/command.js'
import { cn } from './lib/utils.js'
import { Paintbrush } from 'lucide-react'
import TailWindColors from './TailWindColors.js'
import { SelectFieldClientProps } from 'payload'
type Props = {
  isFont?: boolean
  isBackground?: boolean
} & SelectFieldClientProps

const createColorTailwindOption = () => {
  const result: { color: string; value: string; label: string }[] = []
  for (const [category, colorArray] of Object.entries(TailWindColors)) {
    colorArray.forEach((color, index) => {
      const categoryLowe = category.toLowerCase()
      result.push({
        color,
        value:
          index == 0
            ? `${categoryLowe}-50`
            : index == 10
              ? `${categoryLowe}-950`
              : `${categoryLowe}-${index * 100}`,
        label:
          color +
          ' ' +
          (index == 0
            ? `${category}-50`
            : index == 10
              ? `${category}-950`
              : `${category}-${index * 100}`),
      })
    })
  }
  result.push({
    color: '#ffffff',
    value: 'white',
    label: '#ffffff white',
  })
  result.push({
    color: '#000000',
    value: 'black',
    label: '#000000 black',
  })
  return result
}

const colors: { color: string; value: string; label: string }[] = createColorTailwindOption()
export const SelectColor: React.FC<Props> = (props) => {
  const { path } = props
  const { isFont, isBackground, field } = props
  const { value, setValue } = useField<string>({ path })
  const [open, setOpen] = useState(false)
  const [backgroundColor, setBackgroundColor] = useState(
    (isBackground && colors.find((color) => color.value === value)?.color) || '#FFFFFF',
  )
  const [fontColor, setFontColor] = useState(
    (isFont && colors.find((color) => color.value === value)?.color) || '#000000',
  )
  const [selectColor, setSelectColor] = useState(
    colors.find((color) => color.value === value) || null,
  )
  const labelToUse = field.label ? field.label : 'Color'

  const handleSelect = (label: string) => {
    const obj = colors.find((color) => color.label === label) || null
    setSelectColor(obj)
    setValue(obj?.value)
    const color = obj?.color
    isFont && color && setFontColor(color)
    isBackground && color && setBackgroundColor(color)
    setOpen(false)
  }

  return (
    <div className="useTw">
      {
        <FieldLabel
          htmlFor={`bfColourPickerField-${path?.replace(/\./gi, '__')}`}
          label={labelToUse}
        />
      }
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={'outline'}
            className={cn(
              'comp w-[220px] justify-start text-left font-normal',
              !selectColor && 'text-muted-foreground ',
            )}
            style={{ backgroundColor: backgroundColor }}
          >
            <div className="comp w-full flex items-center gap-2">
              {selectColor ? (
                <div
                  className="comp h-4 w-4 rounded !bg-center !bg-cover transition-all"
                  style={{ backgroundColor: selectColor ? selectColor.color : 'transparent' }}
                />
              ) : (
                <Paintbrush className="h-4 w-4" />
              )}
              <div className="comp truncate flex-1" style={{ color: fontColor }}>
                {selectColor ? selectColor.value : 'Pick a color'}
              </div>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="useTw comp mb-[10px] p-0" side="right" align="start">
          <Command>
            <CommandInput className="comp" placeholder="Search color..." autoFocus={false} />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                <div className="comp grid grid-cols-11 gap-2">
                  {colors.map((clr) => (
                    <CommandItem
                      key={clr.color + clr.label}
                      value={clr.label}
                      style={{ background: clr.color }}
                      className="comp rounded-md h-6 w-6 cursor-pointer active:scale-105"
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
export const SelectColorBackground: React.FC<Props> = (props) => {
  return <SelectColor {...props} isBackground={true} />
}
export const SelectColorFont: React.FC<Props> = (props) => {
  return <SelectColor {...props} isFont={true} />
}