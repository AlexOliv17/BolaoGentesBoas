'use client';

import { useState } from 'react';
import { HowItWorksModal } from '@/components/ui/HowItWorksModal';
import styles from './HomeClient.module.css';

/**
 * HomeClient — parte interativa da home page.
 *
 * Contém:
 * - Botão flutuante "?" que abre o modal "Como funciona"
 * - O modal em si (que também abre automaticamente na 1ª visita)
 */
export function HomeClient() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      {/* Botão flutuante "?" */}
      <button
        id="how-it-works-btn"
        className={styles.helpBtn}
        onClick={() => setModalOpen(true)}
        aria-label="Como funciona o bolão"
        title="Como funciona?"
      >
        ?
      </button>

      {/* Modal */}
      <HowItWorksModal
        forceOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
