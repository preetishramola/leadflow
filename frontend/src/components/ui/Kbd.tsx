export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-sm border border-current/25 px-1 font-mono text-[10px] leading-4 opacity-70">
      {children}
    </kbd>
  );
}
