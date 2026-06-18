'use client';

import { useEffect, useState, useCallback } from 'react';
import styles from './HowItWorksModal.module.css';

const STORAGE_KEY = 'bolao_seen_howto';

interface HowItWorksModalProps {
  /** Permite controle externo (botão "?") */
  forceOpen?: boolean;
  onClose?: () => void;
}

/**
 * Modal "Como Funciona" do Bolão dos Gentes Boas.
 *
 * - Abre automaticamente na 1ª visita (localStorage).
 * - Pode ser aberto externamente via prop forceOpen (botão "?").
 * - Fecha com ESC, clique no overlay ou botão fechar.
 */
export function HowItWorksModal({ forceOpen, onClose }: HowItWorksModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Abre automaticamente na primeira visita
  useEffect(() => {
    const alreadySeen = localStorage.getItem(STORAGE_KEY);
    if (!alreadySeen) {
      setIsOpen(true);
    }
  }, []);

  // Responde ao controle externo (botão "?")
  useEffect(() => {
    if (forceOpen) setIsOpen(true);
  }, [forceOpen]);

  const handleClose = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  // Fecha com ESC
  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleClose]);

  // Trava o scroll do body enquanto o modal está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="howto-title"
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header do modal */}
        <div className={styles.modalHeader}>
          <h2 id="howto-title" className={styles.modalTitle}>
            Como funciona
          </h2>
          <button
            className={styles.closeBtn}
            onClick={handleClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Conteúdo */}
        <div className={styles.modalBody}>
          <ul className={styles.stepsList} role="list">
            {STEPS.map((step, i) => (
              <li key={step.title} className={styles.step}>
                <div className={styles.stepNumber} aria-hidden="true">
                  {i + 1}
                </div>
                <div className={styles.stepContent}>
                  <strong className={styles.stepTitle}>{step.title}</strong>
                  <p className={styles.stepDesc}>{step.desc}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Pontuação */}
          <div className={styles.scoring}>
            <h3 className={styles.scoringTitle}>Pontuação</h3>
            <ul className={styles.scoringList} role="list">
              <li className={styles.scoringItem}>
                <span className={`${styles.pts} ${styles.exact}`}>8</span>
                <div>
                  <strong>Placar exato</strong>
                  <p>Acertou o placar completo</p>
                </div>
              </li>
              <li className={styles.scoringItem}>
                <span className={`${styles.pts} ${styles.result}`}>5</span>
                <div>
                  <strong>Resultado certo</strong>
                  <p>Acertou vitória, derrota ou empate</p>
                </div>
              </li>
              <li className={styles.scoringItem}>
                <span className={`${styles.pts} ${styles.wrong}`}>0</span>
                <div>
                  <strong>Errou</strong>
                  <p>Resultado diferente do palpite</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button
            id="howto-got-it"
            className={styles.gotItBtn}
            onClick={handleClose}
          >
            Entendi, bora palpitar! 🟠
          </button>
        </div>
      </div>
    </div>
  );
}

const STEPS = [
  {
    title: 'Crie seu bolão',
    desc: 'Crie um grupo privado e convide seus amigos pelo WhatsApp ou link de convite.',
  },
  {
    title: 'Palpite nos jogos',
    desc: 'Dê seu palpite no placar de cada jogo até 1 minuto antes do início.',
  },
  {
    title: 'Acompanhe o ranking',
    desc: 'Após cada jogo os pontos são calculados automaticamente e o ranking é atualizado.',
  },
] as const;
