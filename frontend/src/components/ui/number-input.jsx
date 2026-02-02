import * as React from "react"
import { Minus, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/**
 * NumberInput component that replaces native number inputs.
 * Hides browser-native spinner arrows and provides custom +/- buttons
 * that match the project design system.
 *
 * @param {number|string} value - Current numeric value
 * @param {function} onChange - Called with the new numeric value
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {number} step - Increment/decrement step size (default: 1)
 * @param {string} id - Optional id for the input element
 * @param {string} placeholder - Placeholder text
 * @param {boolean} disabled - Whether the input is disabled
 * @param {string} className - Additional classes for the wrapper
 */
const NumberInput = React.forwardRef(
  ({ value, onChange, min, max, step = 1, id, placeholder, disabled, className, ...props }, ref) => {
    const numericValue = typeof value === "string" ? parseFloat(value) : value

    const canDecrement = min === undefined || (numericValue || 0) > min
    const canIncrement = max === undefined || (numericValue || 0) < max

    const clamp = (val) => {
      let clamped = val
      if (min !== undefined && clamped < min) clamped = min
      if (max !== undefined && clamped > max) clamped = max
      return clamped
    }

    const handleIncrement = () => {
      if (disabled) return
      const next = clamp((numericValue || 0) + step)
      onChange(next)
    }

    const handleDecrement = () => {
      if (disabled) return
      const next = clamp((numericValue || 0) - step)
      onChange(next)
    }

    const handleInputChange = (e) => {
      const raw = e.target.value
      if (raw === "" || raw === "-") {
        onChange(raw)
        return
      }
      const parsed = parseFloat(raw)
      if (!isNaN(parsed)) {
        onChange(clamp(parsed))
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === "ArrowUp") {
        e.preventDefault()
        handleIncrement()
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        handleDecrement()
      }
    }

    return (
      <div
        className={cn(
          "flex items-center rounded-lg border border-border/50 bg-muted/30 shadow-sm transition-all duration-200",
          "hover:border-primary/30 hover:bg-muted/40",
          "focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-ring/50 focus-within:bg-background",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          tabIndex={-1}
          disabled={disabled || !canDecrement}
          onClick={handleDecrement}
          className="h-9 w-9 shrink-0 rounded-l-md rounded-r-none border-0 text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-30"
          aria-label="Decrease value"
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <input
          ref={ref}
          id={id}
          type="text"
          inputMode="numeric"
          value={value ?? ""}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "h-11 w-full min-w-0 bg-transparent px-2 text-center text-sm outline-none",
            "placeholder:text-muted-foreground/70",
            "disabled:cursor-not-allowed"
          )}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          tabIndex={-1}
          disabled={disabled || !canIncrement}
          onClick={handleIncrement}
          className="h-9 w-9 shrink-0 rounded-r-md rounded-l-none border-0 text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-30"
          aria-label="Increase value"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    )
  }
)
NumberInput.displayName = "NumberInput"

export { NumberInput }
