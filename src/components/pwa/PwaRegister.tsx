'use client';

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('SW registrado com sucesso:', registration.scope);
          },
          (err) => {
            console.log('SW falhou ao registrar:', err);
          }
        );
      });
    }
  }, []);

  return null;
}
