'use client';

import { useState, useEffect } from 'react';
import styles from './Pools.module.css';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MatchesList } from '@/components/matches/MatchesList';

import { HistoryList } from '@/components/matches/HistoryList';

interface PoolTabsProps {
  pool: any;
  members: any[];
  currentUserId?: string;
  friendshipStatusMap?: Record<string, string>;
}

export function PoolTabs({ pool, members, currentUserId, friendshipStatusMap }: PoolTabsProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'matches' | 'ranking' | 'members'>('matches');

  return (
    <div style={{ marginTop: 'var(--space-4)' }}>
      {/* Tabs Header */}
      <div className={styles.navBar} style={{ borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--space-4)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <button 
          onClick={() => setActiveTab('history')}
          style={{
            flex: '0 0 auto', padding: 'var(--space-3)', background: 'transparent', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'history' ? '2px solid var(--color-brand-green)' : '2px solid transparent',
            color: activeTab === 'history' ? 'var(--color-brand-green)' : 'var(--color-text-muted)',
            fontWeight: activeTab === 'history' ? 600 : 400
          }}
        >
          Histórico de Palpites
        </button>
        <button 
          onClick={() => setActiveTab('matches')}
          style={{
            flex: '0 0 auto', padding: 'var(--space-3)', background: 'transparent', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'matches' ? '2px solid var(--color-brand-green)' : '2px solid transparent',
            color: activeTab === 'matches' ? 'var(--color-brand-green)' : 'var(--color-text-muted)',
            fontWeight: activeTab === 'matches' ? 600 : 400
          }}
        >
          Jogos do dia
        </button>
        <button 
          onClick={() => setActiveTab('ranking')}
          style={{
            flex: '0 0 auto', padding: 'var(--space-3)', background: 'transparent', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'ranking' ? '2px solid var(--color-brand-green)' : '2px solid transparent',
            color: activeTab === 'ranking' ? 'var(--color-brand-green)' : 'var(--color-text-muted)',
            fontWeight: activeTab === 'ranking' ? 600 : 400
          }}
        >
          Ranking
        </button>
        <button 
          onClick={() => setActiveTab('members')}
          style={{
            flex: '0 0 auto', padding: 'var(--space-3)', background: 'transparent', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'members' ? '2px solid var(--color-brand-green)' : '2px solid transparent',
            color: activeTab === 'members' ? 'var(--color-brand-green)' : 'var(--color-text-muted)',
            fontWeight: activeTab === 'members' ? 600 : 400
          }}
        >
          Membros
        </button>
      </div>

      {/* Tabs Content */}
      <div className={styles.tabContent}>
        {activeTab === 'history' && <HistoryList poolId={pool.id} />}
        {activeTab === 'matches' && <MatchesList poolId={pool.id} />}
        {activeTab === 'ranking' && <RankingTab poolId={pool.id} />}
        {activeTab === 'members' && <MembersTab pool={pool} members={members} currentUserId={currentUserId} friendshipStatusMap={friendshipStatusMap} />}
      </div>
    </div>
  );
}

// MatchesTab agora é o componente MatchesList importado acima

function RankingTab({ poolId }: { poolId: string }) {
  const [ranking, setRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRanking() {
      try {
        const res = await fetch(`/api/pools/${poolId}/ranking`);
        if (!res.ok) throw new Error('Falha ao carregar ranking');
        const data = await res.json();
        setRanking(data.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchRanking();
  }, [poolId]);

  if (loading) return <div className={styles.emptyState}><p>Carregando ranking...</p></div>;
  if (error) return <div className={styles.emptyState}><p style={{ color: 'var(--color-error)' }}>{error}</p></div>;
  if (ranking.length === 0) return <div className={styles.emptyState}><p>Nenhum membro pontuou ainda.</p></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {ranking.map((user, index) => {
        const position = user.position || index + 1;
        const isExpanded = expandedId === user.user_id;

        let borderColor = 'var(--color-border)';
        let background = 'var(--color-surface)';
        let badgeColor = 'var(--color-text-muted)';
        let primaryColor = 'var(--color-text-primary)';
        let avatarBorder = 'none';

        if (position === 1) {
          borderColor = 'var(--color-brand-gold)';
          background = 'linear-gradient(145deg, rgba(255, 215, 0, 0.08) 0%, transparent 100%)';
          badgeColor = 'var(--color-brand-gold)';
          primaryColor = 'var(--color-brand-gold)';
          avatarBorder = '2px solid var(--color-brand-gold)';
        } else if (position === 2) {
          borderColor = '#C0C0C0'; // Prata
          background = 'linear-gradient(145deg, rgba(192, 192, 192, 0.08) 0%, transparent 100%)';
          badgeColor = '#C0C0C0';
          primaryColor = '#C0C0C0';
          avatarBorder = '2px solid #C0C0C0';
        } else if (position === 3) {
          borderColor = '#CD7F32'; // Bronze
          background = 'linear-gradient(145deg, rgba(205, 127, 50, 0.08) 0%, transparent 100%)';
          badgeColor = '#CD7F32';
          primaryColor = '#CD7F32';
          avatarBorder = '2px solid #CD7F32';
        }

        return (
          <div 
            key={user.user_id} 
            className={styles.poolCard}
            style={{ 
              cursor: 'pointer', 
              transition: 'all 0.2s ease',
              border: `1px solid ${borderColor}`,
              background: background,
            }}
            onClick={() => setExpandedId(isExpanded ? null : user.user_id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              {/* Posição */}
              <div style={{ 
                width: 32, 
                fontWeight: 800, 
                fontSize: position <= 3 ? 'var(--text-xl)' : 'var(--text-lg)', 
                color: badgeColor,
                textAlign: 'center'
              }}>
                {position}º
              </div>

              {/* Avatar */}
              <div style={{ 
                width: 48, height: 48, borderRadius: '50%', backgroundColor: 'var(--color-surface-hover)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                border: avatarBorder
              }}>
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontWeight: 'bold' }}>{user.nickname.charAt(0).toUpperCase()}</span>
                )}
              </div>

              {/* Info principal */}
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: 'var(--text-md)', color: primaryColor }}>
                  {user.nickname}
                </p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>@{user.username}</p>
              </div>

              {/* Pontos Totais */}
              <div style={{ textAlign: 'right' }}>
                <span style={{ 
                  fontFamily: 'var(--font-display)', 
                  fontWeight: 800, 
                  fontSize: 'var(--text-xl)', 
                  color: primaryColor 
                }}>
                  {user.totalPoints}
                </span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'block' }}>pts</span>
              </div>
            </div>

            {/* Detalhes Expandidos */}
            {isExpanded && (
              <div style={{ 
                marginTop: 'var(--space-4)', 
                paddingTop: 'var(--space-4)', 
                borderTop: '1px dashed var(--color-border)',
                display: 'flex',
                justifyContent: 'space-around',
                animation: 'slideDown 0.2s ease-out'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-success)' }}>{user.exactScores}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Na Mosca (8 pts)</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-warning)' }}>{user.correctResults}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Acertos (5 pts)</div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MembersTab({ pool, members, currentUserId, friendshipStatusMap = {} }: { pool: any, members: any[], currentUserId?: string, friendshipStatusMap?: Record<string, string> }) {
  const [copied, setCopied] = useState(false);
  const [loadingAdd, setLoadingAdd] = useState<string | null>(null);
  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>({});

  const handleAddFriend = async (targetId: string) => {
    setLoadingAdd(targetId);
    try {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressee_id: targetId })
      });
      
      if (!res.ok) throw new Error('Falha ao adicionar');
      
      setLocalStatuses(prev => ({ ...prev, [targetId]: 'pending' }));
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar solicitação de amizade.');
    } finally {
      setLoadingAdd(null);
    }
  };

  const inviteUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/join/${pool.invite_token}` 
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Fala galera! Criei o bolão "${pool.name}". Entrem aí pelo link para a gente palpitar: ${inviteUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      {pool.my_role === 'admin' && (
        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: `1px solid var(--color-brand-green)` }}>
          <h3 style={{ marginBottom: 'var(--space-2)', color: 'var(--color-brand-green)' }}>Convide a galera!</h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
            Compartilhe o link abaixo para que seus amigos entrem no bolão automaticamente.
          </p>
          
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <Input id="inviteUrl" value={inviteUrl} readOnly style={{ flex: 1, backgroundColor: 'transparent' }} />
            <Button onClick={handleCopy} style={copied ? { backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' } : {}}>
              {copied ? 'Copiado!' : 'Copiar'}
            </Button>
          </div>
          
          <Button onClick={handleWhatsApp} style={{ width: '100%', backgroundColor: '#25D366', borderColor: '#25D366', color: 'white' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            Convidar pelo WhatsApp
          </Button>
        </div>
      )}

      <div>
        <h3 style={{ marginBottom: 'var(--space-3)' }}>Membros ({members.length})</h3>
        <ul className={styles.poolList}>
          {members.map((member) => (
            <li key={member.user_id} className={styles.poolCard} style={{ flexDirection: 'row', alignItems: 'center', cursor: 'default' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {member.profile.avatar_url ? (
                  <img src={member.profile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontWeight: 'bold' }}>{member.profile.nickname.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600 }}>{member.profile.nickname} {member.user_id === pool.owner_id && '👑'}</p>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>@{member.profile.username}</p>
              </div>

              {currentUserId && member.user_id !== currentUserId && (
                <div style={{ marginLeft: 'var(--space-3)' }}>
                  {(localStatuses[member.user_id] || friendshipStatusMap[member.user_id]) === 'accepted' && (
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-brand-green)', fontWeight: 600, padding: '4px 8px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-brand-green)', borderRadius: 'var(--radius-full)' }}>
                      Amigo
                    </span>
                  )}
                  {(localStatuses[member.user_id] || friendshipStatusMap[member.user_id]) === 'pending' && (
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-warning)', fontWeight: 600, padding: '4px 8px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-full)' }}>
                      Pendente
                    </span>
                  )}
                  {!(localStatuses[member.user_id] || friendshipStatusMap[member.user_id]) && (
                    <Button 
                      onClick={() => handleAddFriend(member.user_id)}
                      disabled={loadingAdd === member.user_id}
                      style={{ padding: '6px 12px', fontSize: 'var(--font-size-xs)', minHeight: 'auto' }}
                    >
                      {loadingAdd === member.user_id ? 'Enviando...' : 'Adicionar'}
                    </Button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
