import { Search } from "lucide-react";

export function SearchBar({
  value,
  onChange,
  placeholder = "Поиск по статьям...",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="glass relative flex items-center gap-3 rounded-full px-5 py-3">
      <Search className="h-4 w-4 text-slate-600" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 outline-none"
      />
    </div>
  );
}
