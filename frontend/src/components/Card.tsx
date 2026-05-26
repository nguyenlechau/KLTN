import { ReactNode, CSSProperties } from 'react';
import './card.css';

interface CardProps {
  children: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Card({ children, title, subtitle, className = '', style }: CardProps) {
  return (
    <div className={`card ${className}`} style={style}>
      {title && <h3 className="card-title">{title}</h3>}
      {subtitle && <p className="card-subtitle">{subtitle}</p>}
      {children}
    </div>
  );
}
