import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { Metadata } from 'next';
import Link from 'next/link';
import headerStyles from '@/components/shared/Header.module.css';

export const metadata: Metadata = {
  title: 'Recuperar Senha',
  description: 'Redefina sua senha do BolãoGB',
};

export default function ForgotPasswordPage() {
  return (
    <div className="container" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <Link href="/" className={headerStyles.logo} aria-label="Voltar para a página inicial">
          <div className={headerStyles.logoIconWrapper}>
            <span className={headerStyles.logoIcon} aria-hidden="true">⚽</span>
          </div>
          <span className={headerStyles.logoText}>
            <span className={headerStyles.logoTextTop}>Copa</span>
            <span className={headerStyles.logoTextBottom}>Gentes Boas</span>
          </span>
        </Link>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
