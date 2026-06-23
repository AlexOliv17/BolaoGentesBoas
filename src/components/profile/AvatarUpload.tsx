'use client';

import { useState, useRef } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import styles from './Profile.module.css';

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string | null;
  nickname: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function AvatarUpload({ userId, currentAvatarUrl, nickname }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyUrls, setHistoryUrls] = useState<string[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Formato inválido. Use JPEG, PNG ou WEBP.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('A imagem deve ter no máximo 5MB.');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      
      // Upload para o Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Salvar URL no profile do usuário
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: publicUrl }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Erro ao atualizar o perfil.');
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Erro inesperado ao fazer upload.');
    } finally {
      setIsUploading(false);
      // Limpa o input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const loadHistory = async () => {
    setShowHistory((prev) => !prev);
    if (showHistory || historyUrls.length > 0) return; // Se for fechar ou já carregou, ignora

    setIsLoadingHistory(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: listError } = await supabase.storage
        .from('avatars')
        .list(userId, {
          limit: 20,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (listError) throw listError;

      // Filtra possíveis diretórios ocultos ou pastas (arquivos geralmente possuem ID)
      const files = data?.filter(file => file.id) || [];
      
      const urls = files.map(file => {
        return supabase.storage.from('avatars').getPublicUrl(`${userId}/${file.name}`).data.publicUrl;
      });

      setHistoryUrls(urls);
    } catch (err: any) {
      console.error('Erro ao carregar histórico', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSelectFromHistory = async (url: string) => {
    setIsUploading(true);
    setError(null);
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: url }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Erro ao atualizar o perfil.');
      }

      router.refresh();
      setShowHistory(false);
    } catch (err: any) {
      setError(err.message || 'Erro inesperado ao selecionar do histórico.');
    } finally {
      setIsUploading(false);
    }
  };

  const initial = nickname.charAt(0).toUpperCase();

  return (
    <div className={styles.avatarSection}>
      <div 
        className={styles.avatarWrapper} 
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        {currentAvatarUrl ? (
          <img 
            src={currentAvatarUrl} 
            alt={`Avatar de ${nickname}`} 
            className={styles.avatarImage} 
          />
        ) : (
          <div className={styles.avatarFallback}>{initial}</div>
        )}
        
        <div className={styles.avatarOverlay}>
          {isUploading ? 'Enviando...' : 'Trocar'}
        </div>
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={ALLOWED_TYPES.join(',')}
        className={styles.avatarInput}
        disabled={isUploading}
      />
      
      <button 
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={styles.uploadButton}
      >
        {isUploading ? 'Processando...' : 'Alterar Foto'}
      </button>

      <button 
        type="button" 
        onClick={loadHistory} 
        className={styles.historyToggleButton}
      >
        {showHistory ? 'Ocultar histórico de fotos' : 'Ver histórico de fotos'}
      </button>

      {showHistory && (
        <div className={styles.historyContainer}>
          {isLoadingHistory ? (
            <p className={styles.historyLoading}>Carregando fotos anteriores...</p>
          ) : historyUrls.length > 0 ? (
            <div className={styles.historyGrid}>
              {historyUrls.map((url, i) => (
                <img 
                  key={i} 
                  src={url} 
                  alt={`Avatar do histórico ${i}`} 
                  className={styles.historyThumbnail}
                  onClick={() => handleSelectFromHistory(url)}
                />
              ))}
            </div>
          ) : (
            <p className={styles.historyLoading}>Nenhuma foto anterior encontrada.</p>
          )}
        </div>
      )}

      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  );
}
