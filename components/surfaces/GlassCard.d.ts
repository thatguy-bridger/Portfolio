export interface GlassCardProps {
  title?: string;
  subtitle?: string;
  accent?: 'indigo' | 'purple' | 'orange' | 'pink';
  onClick?: () => void;
  children?: React.ReactNode;
}
export declare function GlassCard(props: GlassCardProps): JSX.Element;
