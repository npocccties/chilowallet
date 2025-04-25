declare module '@fortawesome/react-fontawesome' {
    import { FC } from 'react';
    interface FontAwesomeIconProps {
      icon: any;
      className?: string;
      spin?: boolean;
      style?: CSSProperties;
    }
    const FontAwesomeIcon: FC<FontAwesomeIconProps>;
    export { FontAwesomeIcon };
  }
  
  declare module '@fortawesome/free-solid-svg-icons' {
    export const faCheckCircle: any;
    export const faExclamationTriangle: any;
    export const faPauseCircle: any;
    export const faSpinner: any;
  }
  