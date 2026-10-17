import { forwardRef } from "react";
import { inputClass } from "@/components/ui/Field";
import { Kbd } from "@/components/ui/Kbd";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { value, onChange },
  ref,
) {
  return (
    <div className="relative w-full md:w-64">
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-faint"
      >
        <circle cx="6" cy="6" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M9.2 9.2L12.5 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            onChange("");
            event.currentTarget.blur();
          }
        }}
        placeholder="Search by name"
        aria-label="Search leads by name"
        className={`${inputClass} h-8 pr-8 pl-8 text-[13px] [&::-webkit-search-cancel-button]:hidden`}
      />
      {!value && (
        <span className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 text-muted md:block">
          <Kbd>/</Kbd>
        </span>
      )}
    </div>
  );
});
