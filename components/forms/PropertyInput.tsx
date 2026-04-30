import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PropertyInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  unit?: string;
  step?: string;
  placeholder?: string;
}

export default function PropertyInput({
  label,
  value,
  onChange,
  unit,
  step = 'any',
  placeholder,
}: PropertyInputProps) {
  return (
    <div className="flex flex-col space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground flex justify-between">
        <span>{label}</span>
        {unit && <span className="text-muted-foreground/60">[{unit}]</span>}
      </Label>
      <Input
        type="number"
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="h-8 text-sm font-mono"
      />
    </div>
  );
}
