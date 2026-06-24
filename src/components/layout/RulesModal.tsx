'use client';

import { useState, useEffect } from 'react';
import styles from './RulesModal.module.css';

export function RulesModal({ autoOpen = false }: { autoOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (autoOpen) {
      setIsOpen(true);
      fetch('/api/profiles/first-login', { method: 'POST' }).catch(console.error);
    }
  }, [autoOpen]);

  if (!isMounted) return null;

  return (
    <>
      <button 
        className={styles.helpButton} 
        onClick={() => setIsOpen(true)}
        aria-label="Como Funciona"
        title="Como Funciona"
      >
        ?
      </button>

      {isOpen && (
        <div className={styles.overlay} onClick={() => setIsOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.header}>
              <h3>Como Funciona o Bolão</h3>
              <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>&times;</button>
            </div>
            
            <div className={styles.body}>
              <div className={styles.section}>
                <h4 className={styles.sectionTitle}>⚽ Pontuação dos Jogos</h4>
                <div className={styles.ruleBox}>
                  <span className={`${styles.pointValue} ${styles.gold}`}>8 pts</span>
                  <strong>Na Mosca (Placar Exato)</strong>
                  <p style={{ marginTop: 'var(--space-1)', fontSize: 'var(--text-xs)' }}>
                    Acertou o vencedor e a quantidade exata de gols de cada time. (Ex: Palpitou 2x1, Terminou 2x1)
                  </p>
                </div>
                <div className={styles.ruleBox}>
                  <span className={styles.pointValue}>5 pts</span>
                  <strong>Acerto de Resultado</strong>
                  <p style={{ marginTop: 'var(--space-1)', fontSize: 'var(--text-xs)' }}>
                    Acertou quem venceu ou acertou que daria empate, mas errou o placar exato. (Ex: Palpitou 1x0, Terminou 3x1)
                  </p>
                </div>
                <div className={styles.ruleBox}>
                  <span className={styles.pointValue} style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text-secondary)' }}>0 pts</span>
                  <strong>Errou feio</strong>
                  <p style={{ marginTop: 'var(--space-1)', fontSize: 'var(--text-xs)' }}>
                    Errou o vencedor da partida.
                  </p>
                </div>
              </div>

              <div className={styles.section}>
                <h4 className={styles.sectionTitle}>🏆 Critérios de Desempate (Ranking)</h4>
                <ul className={styles.list}>
                  <li>
                    <strong>1º:</strong> Maior número de pontos totais.
                  </li>
                  <li>
                    <strong>2º:</strong> Maior quantidade de placares "Na Mosca" (Exatos).
                  </li>
                  <li>
                    <strong>Empate Absoluto:</strong> Se os jogadores empatarem nos dois critérios acima, eles dividirão a mesma posição de glória no ranking!
                  </li>
                </ul>
              </div>

              <div className={styles.section}>
                <h4 className={styles.sectionTitle}>⏰ Regras de Palpite</h4>
                <ul className={styles.list}>
                  <li>Você pode criar ou alterar seu palpite até <strong>1 minuto antes</strong> do apito inicial.</li>
                  <li>Após a bola rolar, o jogo é bloqueado e o palpite fica travado.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
