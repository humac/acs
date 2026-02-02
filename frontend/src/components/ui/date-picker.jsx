import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

/**
 * DatePicker component that replaces native date inputs.
 *
 * @param {string} value - ISO date string (yyyy-MM-dd) or empty string
 * @param {function} onChange - Called with ISO date string or empty string
 * @param {string} placeholder - Placeholder text when no date selected
 * @param {string} id - Optional id for the trigger button
 * @param {boolean} clearable - Whether to show a clear button
 * @param {string} className - Additional classes for the trigger button
 */
function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  id,
  clearable = true,
  className,
  disabled,
  ...props
}) {
  const [open, setOpen] = React.useState(false)

  // Parse ISO string to Date object for the calendar
  const selectedDate = React.useMemo(() => {
    if (!value) return undefined
    const parsed = parse(value, "yyyy-MM-dd", new Date())
    return isValid(parsed) ? parsed : undefined
  }, [value])

  const handleSelect = (date) => {
    if (date) {
      onChange(format(date, "yyyy-MM-dd"))
    } else {
      onChange("")
    }
    setOpen(false)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-11 rounded-lg",
            "border-border/50 bg-muted/30 shadow-sm",
            "hover:border-primary/30 hover:bg-muted/40",
            "focus-visible:border-primary/50 focus-visible:ring-1 focus-visible:ring-ring/50",
            !value && "text-muted-foreground/70",
            className
          )}
          {...props}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate">
            {selectedDate ? format(selectedDate, "yyyy-MM-dd") : placeholder}
          </span>
          {clearable && value && (
            <X
              className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground/70 hover:text-foreground transition-colors"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          defaultMonth={selectedDate}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
DatePicker.displayName = "DatePicker"

export { DatePicker }
