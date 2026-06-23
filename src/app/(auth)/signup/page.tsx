import { SignUpForm } from '@/components/auth/SignUpForm';
import { Metadata } from 'next';
import Link from 'next/link';
import headerStyles from '@/components/shared/Header.module.css';
import authStyles from '@/components/auth/Auth.module.css';

export const metadata: Metadata = {
  title: 'Cadastro',
  description: 'Crie sua conta no BolãoGB',
};

export default function SignUpPage() {
  return (
    <div className="container" style={{ paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-12)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <nav className={authStyles.navBar}>
          <Link href="/" className={authStyles.backButton}>
            <span aria-hidden="true">←</span> Voltar
          </Link>
        </nav>
      </div>

      <div style={{ marginBottom: 'var(--space-8)', marginTop: 'var(--space-4)' }}>
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
      <SignUpForm />
    </div>
  );
}
