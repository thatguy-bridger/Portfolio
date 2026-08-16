export interface IconButtonProps {
  icon: React.ReactNode;
  tone?: 'default' | 'accent' | 'danger';
  size?: number;
  onClick?: () => void;
  title?: string;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
