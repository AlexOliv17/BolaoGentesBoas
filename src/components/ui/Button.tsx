import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  /** Ícone à esquerda do texto */
  leftIcon?: ReactNode;
  children: ReactNode;
}

/**
 * Componente Button primitivo do BolaoGB.
 *
 * @example
 * <Button variant="primary" size="md">Salvar palpite</Button>
 * <Button variant="danger" isLoading>Excluindo...</Button>
 */
export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  leftIcon,
  children,
  className,
  ...props
}: ButtonProps) {
  const classNames = [
    styles.btn,
    styles[variant],
    styles[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      {...props}
      disabled={disabled ?? isLoading}
      className={classNames}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : leftIcon ? (
        <span className={styles.icon} aria-hidden="true">
          {leftIcon}
        </span>
      ) : null}
      <span>{children}</span>
    </button>
  );
}
