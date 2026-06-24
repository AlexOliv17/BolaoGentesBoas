'use client';

import { useState, useEffect } from 'react';
import styles from './InviteFriendsModal.module.css';

interface InvitableFriend {
  id: string;
  username: string;
  nickname: string;
  avatar_url: string | null;
  is_member: boolean;
  is_invited: boolean;
}

interface InviteFriendsModalProps {
  poolId: string;
  onClose: () => void;
}

export function InviteFriendsModal({ poolId, onClose }: InviteFriendsModalProps) {
  const [friends, setFriends] = useState<InvitableFriend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFriends() {
      try {
        const res = await fetch(`/api/pools/${poolId}/invitations`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Falha ao carregar amigos');
        }
        const data = await res.json();
        setFriends(data.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadFriends();
  }, [poolId]);

  const handleInvite = async (friendId: string) => {
    // Optimistic UI update
    setFriends(prev => prev.map(f => f.id === friendId ? { ...f, is_invited: true } : f));

    try {
      const res = await fetch(`/api/pools/${poolId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteeId: friendId }),
      });

      if (!res.ok) {
        // Revert se falhar
        setFriends(prev => prev.map(f => f.id === friendId ? { ...f, is_invited: false } : f));
      }
    } catch {
      // Revert se falhar
      setFriends(prev => prev.map(f => f.id === friendId ? { ...f, is_invited: false } : f));
    }
  };

  const filteredFriends = friends.filter(friend => 
    friend.nickname.toLowerCase().includes(searchQuery.toLowerCase()) || 
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Convidar Amigos</h3>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.searchContainer}>
          <input 
            type="text" 
            placeholder="Q Pesquisar" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.body}>
          {loading ? (
            <p className={styles.message}>Carregando...</p>
          ) : error ? (
            <p className={styles.error}>{error}</p>
          ) : friends.length === 0 ? (
            <p className={styles.message}>Você ainda não possui amigos na plataforma ou todos já estão no bolão.</p>
          ) : (
            <ul className={styles.friendList}>
              {filteredFriends.map((friend) => {
                const disabled = friend.is_member || friend.is_invited;
                return (
                  <li key={friend.id} className={styles.friendItem}>
                    <div className={styles.friendInfo}>
                      {friend.avatar_url ? (
                        <img src={friend.avatar_url} alt={friend.nickname} className={styles.avatar} />
                      ) : (
                        <div className={styles.avatarFallback}>{friend.nickname.charAt(0).toUpperCase()}</div>
                      )}
                      <div className={styles.friendNameBlock}>
                        <span className={styles.nickname}>{friend.nickname}</span>
                        <span className={styles.username}>@{friend.username}</span>
                      </div>
                    </div>

                    <button
                      className={styles.inviteBtn}
                      disabled={disabled}
                      onClick={() => handleInvite(friend.id)}
                      title={friend.is_member ? 'Já é membro' : friend.is_invited ? 'Convite já enviado' : 'Convidar'}
                    >
                      {friend.is_member ? 'Adicionado' : friend.is_invited ? 'Enviado' : 'Adicionar'}
                    </button>
                  </li>
                );
              })}
              {filteredFriends.length === 0 && friends.length > 0 && (
                <p className={styles.message}>Nenhum amigo encontrado.</p>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
