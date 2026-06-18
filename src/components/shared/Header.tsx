import Link from 'next/link';
import styles from './Header.module.css';

/**
 * Header global do BolaoGB.
 * Server Component — sem 'use client'.
 * Navegação mínima para o Card 0; Cards posteriores expandem.
 */
export function Header() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        {/* Logo / wordmark */}
        <Link href="/" className={styles.logo} aria-label="Copa dos Gentes Boas — página inicial">
          <div className={styles.logoIconWrapper}>
            <span className={styles.logoIcon} aria-hidden="true">⚽</span>
          </div>
          <span className={styles.logoText}>
            <span className={styles.logoTextTop}>Copa</span>
            <span className={styles.logoTextBottom}>Gentes Boas</span>
          </span>
        </Link>

        {/* Nav — Cards futuros adicionarão itens dinâmicos */}
        <nav aria-label="Navegação principal">
          <ul className={styles.navList}>
            <li>
              <Link href="/login" className={styles.navLink}>
                Entrar
              </Link>
            </li>
            <li>
              <Link href="/signup" className={`${styles.navLink} ${styles.navCta}`}>
                Criar conta
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
