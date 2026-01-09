"use client";

import * as React from "react";
import { useState, useRef, useCallback } from "react";
import IconButton from "@/refresh-components/buttons/IconButton";
import { noProp, cn } from "@/lib/utils";
import { SvgEye, SvgEyeClosed, SvgX } from "@opal/icons";
import {
  innerClasses,
  wrapperClasses,
} from "@/refresh-components/inputs/styles";

// ASTERISK OPERATOR (U+2217) - better sized than bullet (•) per design guidelines
const MASK_CHARACTER = "∗";

export interface PasswordInputTypeInProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "children"
  > {
  internal?: boolean;
  error?: boolean;
  disabled?: boolean;
  // When true, the actual value cannot be retrieved (e.g., after submission)
  // Shows fixed-length mask and disables reveal functionality
  isNonRevealable?: boolean;
  // Number of mask characters to show in non-revealable mode (default: 8)
  nonRevealableMaskLength?: number;
  // Show a clear button when there's a value
  showClearButton?: boolean;
  // Custom clear handler
  onClear?: () => void;
}

const PasswordInputTypeIn = React.forwardRef<
  HTMLInputElement,
  PasswordInputTypeInProps
>(
  (
    {
      internal,
      error,
      disabled,
      isNonRevealable = false,
      nonRevealableMaskLength = 8,
      showClearButton = false,
      onClear,
      value,
      className,
      onChange,
      ...props
    },
    ref
  ) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const localInputRef = useRef<HTMLInputElement | null>(null);

    // Combine forwarded ref with local ref
    const setInputRef = useCallback(
      (node: HTMLInputElement | null) => {
        localInputRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLInputElement | null>).current =
            node;
        }
      },
      [ref]
    );

    const variant = internal
      ? "internal"
      : error
        ? "error"
        : disabled
          ? "disabled"
          : "main";

    const handleClear = useCallback(() => {
      if (onClear) {
        onClear();
        return;
      }

      onChange?.({
        target: { value: "" },
        currentTarget: { value: "" },
        type: "change",
        bubbles: true,
        cancelable: true,
      } as React.ChangeEvent<HTMLInputElement>);
    }, [onClear, onChange]);

    // Generate mask string matching value length or fixed length for non-revealable
    const getMaskedDisplay = () => {
      if (isNonRevealable) {
        return MASK_CHARACTER.repeat(nonRevealableMaskLength);
      }
      const strValue = String(value || "");
      return MASK_CHARACTER.repeat(strValue.length);
    };

    // Determine if we should show the masked overlay
    const shouldShowMask = !isPasswordVisible || isNonRevealable;

    // Get the value to display in the input
    // In non-revealable mode, we don't have the actual value to show
    const displayValue = isNonRevealable
      ? getMaskedDisplay()
      : shouldShowMask
        ? value
        : value;

    return (
      <div
        className={cn(
          "flex flex-row items-center justify-between w-full h-fit p-1.5 rounded-08 relative",
          wrapperClasses[variant],
          className
        )}
        onClick={() => {
          if (!isNonRevealable) {
            localInputRef.current?.focus();
          }
        }}
      >
        {/* Mask overlay - shows custom "∗" characters when password is hidden */}
        {shouldShowMask && (value || isNonRevealable) && (
          <div
            className={cn(
              "absolute left-0 top-0 bottom-0 flex items-center px-2 pointer-events-none select-none tracking-[0.1em]",
              innerClasses[variant]
            )}
            aria-hidden="true"
          >
            {getMaskedDisplay()}
          </div>
        )}

        <input
          ref={setInputRef}
          type={shouldShowMask ? "password" : "text"}
          disabled={disabled || isNonRevealable}
          value={displayValue}
          onChange={onChange}
          className={cn(
            "w-full h-[1.5rem] bg-transparent p-0.5 focus:outline-none",
            innerClasses[variant],
            // Make the native password bullets invisible when showing our custom mask
            shouldShowMask && (value || isNonRevealable) && "text-transparent"
          )}
          autoComplete="off"
          {...props}
        />

        {showClearButton && value && !isNonRevealable && (
          <IconButton
            icon={SvgX}
            disabled={disabled}
            onClick={noProp(handleClear)}
            type="button"
            internal
            aria-label="Clear password"
          />
        )}

        <IconButton
          icon={isPasswordVisible && !isNonRevealable ? SvgEye : SvgEyeClosed}
          disabled={disabled || isNonRevealable}
          onClick={noProp(() => setIsPasswordVisible((v) => !v))}
          type="button"
          internal
          aria-label={isPasswordVisible ? "Hide password" : "Show password"}
        />
      </div>
    );
  }
);

PasswordInputTypeIn.displayName = "PasswordInputTypeIn";

export default PasswordInputTypeIn;
