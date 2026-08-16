export interface TabsProps {
  tabs: string[];
  value?: string;
  onChange?: (tab: string) => void;
}
export declare function Tabs(props: TabsProps): JSX.Element;
