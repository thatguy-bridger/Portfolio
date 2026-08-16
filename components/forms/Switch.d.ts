export interface SwitchProps {
  options?: string[];
  value?: string;
  onChange?: (value: string) => void;
}
export declare function Switch(props: SwitchProps): JSX.Element;
