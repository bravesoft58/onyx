"use client";

import * as React from "react";
import InputTypeIn, {
  InputTypeInProps,
} from "@/refresh-components/inputs/InputTypeIn";
import IconButton from "@/refresh-components/buttons/IconButton";
import { noProp } from "@/lib/utils";
import { SvgEye, SvgEyeClosed } from "@opal/icons";

// ASTERISK OPERATOR (U+2217) - better sized than bullet (•) per design guidelines
const MASK_CHARACTER = "∗";

// Backend placeholder pattern - indicates a stored value that can't be revealed
const BACKEND_PLACEHOLDER_PATTERN = /^•+$/; // All bullet characters (U+2022)

/**
 * Check if a value is a backend placeholder (all bullet characters).
 * The backend sends this to indicate a stored secret exists without revealing it.
 */
function isBackendPlaceholder(value: string): boolean {
  return !!value && BACKEND_PLACEHOLDER_PATTERN.test(value);
}

export interface PasswordInputTypeInProps
  extends Omit<InputTypeInProps, "type" | "rightSection" | "leftSearchIcon"> {
  /**
   * When true, the reveal toggle is disabled.
   * Use this when displaying a stored/masked value from the backend
   * that cannot actually be revealed.
   * The input remains editable so users can type a new value.
   */
  isNonRevealable?: boolean;
}

/**
 * PasswordInputTypeIn Component
 *
 * A password input with custom mask character (∗) and reveal/hide toggle.
 * Built on top of InputTypeIn for consistency.
 *
 * Features:
 * - Custom mask character (∗) instead of browser default
 * - Show/hide toggle button
 * - Optional `isNonRevealable` prop to disable reveal (for stored backend values)
 *
 * Per design guidelines:
 * - Show/hide button only shows when input has value OR is focused
 * - When revealed, the toggle icon is more prominent (action style)
 * - When hidden, the toggle icon is muted (internal style)
 */
const PasswordInputTypeIn = React.forwardRef<
  HTMLInputElement,
  PasswordInputTypeInProps
>(function PasswordInputTypeIn(
  {
    isNonRevealable = false,
    value,
    onChange,
    onFocus,
    onBlur,
    disabled,
    showClearButton = false,
    ...props
  },
  ref
) {
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  // Track the actual password value
  const realValue = String(value || "");

  const hasValue = realValue.length > 0;

  // Disable reveal for backend placeholders (all bullet chars) since there's nothing useful to show
  const effectiveNonRevealable =
    isNonRevealable || isBackendPlaceholder(realValue);

  // Determine if we should show the password as masked
  const isHidden = !isPasswordVisible || effectiveNonRevealable;

  // Compute the display value
  const getDisplayValue = (): string => {
    if (isHidden) {
      return MASK_CHARACTER.repeat(realValue.length);
    }
    return realValue;
  };

  const handleFocus = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    },
    [onFocus]
  );

  const handleBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    },
    [onBlur]
  );

  /**
   * Handle input changes when masked.
   * Since we display mask characters, we need to figure out what the user
   * actually typed and update the real value accordingly.
   */
  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isHidden) {
        // When visible, just pass through the change
        onChange?.(e);
        return;
      }

      const newDisplayValue = e.target.value;
      const oldLength = realValue.length;
      const newLength = newDisplayValue.length;

      let newRealValue: string;

      if (newLength === 0) {
        // User cleared everything
        newRealValue = "";
      } else if (newLength > oldLength) {
        // Characters were added - extract non-mask characters
        const addedChars = newDisplayValue
          .split("")
          .filter((char) => char !== MASK_CHARACTER)
          .join("");

        if (addedChars.length > 0) {
          newRealValue = realValue + addedChars;
        } else {
          newRealValue = realValue;
        }
      } else if (newLength < oldLength) {
        // Characters were deleted
        const charsDeleted = oldLength - newLength;
        newRealValue = realValue.slice(0, -charsDeleted);
      } else {
        newRealValue = realValue;
      }

      // Create a minimal synthetic event with just what Formik needs.
      // DOM element properties don't spread properly, so we only include
      // the essential properties: name, value, and type.
      const syntheticEvent = {
        target: {
          name: e.target.name,
          value: newRealValue,
          type: "text",
        },
        currentTarget: {
          name: e.currentTarget.name,
          value: newRealValue,
          type: "text",
        },
        type: "change",
        persist: () => {},
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      onChange?.(syntheticEvent);
    },
    [isHidden, realValue, onChange]
  );

  // Show/hide button: only visible when there's a value OR input is focused
  const showToggleButton = hasValue || isFocused;

  return (
    <InputTypeIn
      ref={ref}
      value={getDisplayValue()}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      disabled={disabled}
      showClearButton={showClearButton}
      autoComplete="off"
      rightSection={
        showToggleButton ? (
          <IconButton
            icon={
              isPasswordVisible && !effectiveNonRevealable
                ? SvgEye
                : SvgEyeClosed
            }
            disabled={disabled || effectiveNonRevealable}
            onClick={noProp(() => setIsPasswordVisible((v) => !v))}
            type="button"
            action={isPasswordVisible && !effectiveNonRevealable}
            internal
            tooltip={
              effectiveNonRevealable
                ? "Value cannot be revealed"
                : isPasswordVisible
                  ? "Hide password"
                  : "Show password"
            }
            aria-label={
              effectiveNonRevealable
                ? "Value cannot be revealed"
                : isPasswordVisible
                  ? "Hide password"
                  : "Show password"
            }
          />
        ) : undefined
      }
      {...props}
    />
  );
});

export default PasswordInputTypeIn;
