'use client';

import { useState } from 'react';
import styles from './Pools.module.css';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MatchesList } from '@/components/matches/MatchesList';

import { HistoryList } from '@/components/matches/HistoryList';

interface PoolTabsProps {
  pool: any;
  members: any[];
}

export function PoolTabs({ pool, members }: PoolTabsProps) {
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
        {activeTab === 'ranking' && <RankingTab />}
        {activeTab === 'members' && <MembersTab pool={pool} members={members} />}
      </div>
    </div>
  );
}

// MatchesTab agora é o componente MatchesList importado acima

function RankingTab() {
  return (
    <div className={styles.emptyState}>
      <p>Em breve: Ranking dos membros do bolão.</p>
    </div>
  );
}

function MembersTab({ pool, members }: { pool: any, members: any[] }) {
  const [copied, setCopied] = useState(false);

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
            <li key={member.id} className={styles.poolCard} style={{ flexDirection: 'row', alignItems: 'center', cursor: 'default' }}>
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
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
