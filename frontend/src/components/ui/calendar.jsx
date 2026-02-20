import * as React from "react"
import { DayPicker } from "react-day-picker"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout="dropdown"
      startMonth={new Date(1900, 0)}
      endMonth={new Date(2100, 11)}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "hidden", // Hide the original label when utilizing dropdowns
        dropdowns: "flex gap-2 w-full justify-center font-medium self-center",
        dropdown_month: "bg-background/80 text-foreground border border-white/10 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring hover:bg-accent cursor-pointer",
        dropdown_year: "bg-background/80 text-foreground border border-white/10 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring hover:bg-accent cursor-pointer",
        dropdown_icon: "hidden", // Hide dropdown icon if desired, or let it show
        nav: "flex items-center gap-1",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "absolute left-1 top-0 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-white/10 hover:bg-accent"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "absolute right-1 top-0 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-white/10 hover:bg-accent"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        day: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          "[&:has([aria-selected])]:bg-primary/15 [&:has([aria-selected])]:rounded-md",
          "[&:has([aria-selected].day-outside)]:bg-primary/10"
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        range_start: "day-range-start rounded-l-md",
        range_end: "day-range-end rounded-r-md",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md shadow-[0_0_10px_-2px] shadow-primary/40",
        today:
          "bg-accent text-accent-foreground font-semibold",
        outside:
          "day-outside text-muted-foreground/40 aria-selected:bg-primary/10 aria-selected:text-muted-foreground",
        disabled: "text-muted-foreground/30",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight
          return <Icon className="h-4 w-4" />
        },
        Dropdown: ({ value, onChange, options, children, ...props }) => {
          const handleChange = (v) => {
            onChange?.({ target: { value: v } })
          }
          let selectOptions = [];
          if (options && options.length > 0) {
            selectOptions = options;
          } else if (children) {
            selectOptions = React.Children.toArray(children).map(child => ({
              value: child.props.value,
              label: child.props.children,
              disabled: child.props.disabled,
            }));
          }
          const selected = selectOptions.find((child) => child.value === value) || selectOptions[0];
          return (
            <Select
              value={value?.toString()}
              onValueChange={(value) => {
                handleChange(value)
              }}
            >
              <SelectTrigger className="flex h-7 w-fit items-center justify-between gap-1 rounded-md border border-input bg-transparent px-2 py-0 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                <SelectValue>{selected?.label}</SelectValue>
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-[200px]">
                {selectOptions.map((option, id) => (
                  <SelectItem key={`${option.value}-${id}`} value={option.value?.toString() ?? ""} disabled={option.disabled}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
