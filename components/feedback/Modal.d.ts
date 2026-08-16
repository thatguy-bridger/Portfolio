export interface ModalProps {
  open: boolean;
  title?: string;
  onClose?: () => void;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}
export declare function Modal(props: ModalProps): JSX.Element | null;
