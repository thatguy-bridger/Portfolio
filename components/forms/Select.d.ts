export interface SelectOption { label: string; value: string; }
export interface SelectProps {
  label?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
}
export declare function Select(props: SelectProps): JSX.Element;
