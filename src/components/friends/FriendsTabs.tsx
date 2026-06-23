'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './Friends.module.css';
import { useRouter } from 'next/navigation';

type Profile = {
  id: string;
  username: string;
  nickname: string;
  avatar_url: string | null;
};

type Friendship = {
  id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  requester: Profile;
  addressee: Profile;
};

interface FriendsTabsProps {
  currentUserId: string;
  friends: Friendship[];
  pendingReceived: Friendship[];
  pendingSent: Friendship[];
}

export function FriendsTabs({ currentUserId, friends, pendingReceived, pendingSent }: FriendsTabsProps) {
  const [activeTab, setActiveTab] = useState<'friends' | 'add' | 'pending'>('friends');

  return (
    <div className={styles.container}>
      <div className={styles.tabsHeader}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'friends' ? styles.active : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          Meus Amigos ({friends.length})
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'add' ? styles.active : ''}`}
          onClick={() => setActiveTab('add')}
        >
          Adicionar
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'pending' ? styles.active : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pendentes ({pendingReceived.length})
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'friends' && <FriendsList friendships={friends} currentUserId={currentUserId} />}
        {activeTab === 'add' && <AddFriend />}
        {activeTab === 'pending' && <PendingRequests received={pendingReceived} sent={pendingSent} />}
      </div>
    </div>
  );
}

function FriendsList({ friendships, currentUserId }: { friendships: Friendship[], currentUserId: string }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleRemove = async (id: string) => {
    if (!confirm('Tem certeza que deseja desfazer a amizade?')) return;
    
    setLoadingId(id);
    try {
      const res = await fetch(`/api/friends/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
      } else {
        const { error } = await res.json();
        alert(error);
      }
    } finally {
      setLoadingId(null);
    }
  };

  if (friendships.length === 0) {
    return <p className={styles.emptyText}>Você ainda não tem amigos adicionados.</p>;
  }

  return (
    <ul className={styles.list}>
      {friendships.map((f) => {
        const friend = f.requester.id === currentUserId ? f.addressee : f.requester;
        return (
          <li key={f.id} className={styles.listItem}>
            <div className={styles.profileInfo}>
              <div className={styles.avatar}>
                {friend.avatar_url ? <img src={friend.avatar_url} alt="Avatar" /> : friend.nickname.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className={styles.nickname}>{friend.nickname}</p>
                <p className={styles.username}>@{friend.username}</p>
              </div>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => handleRemove(f.id)}
              disabled={loadingId === f.id}
            >
              Remover
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

function AddFriend() {
  const [search, setSearch] = useState('');
  const [code, setCode] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (search.length < 2) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/friends/search?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (res.ok) setResults(data.data);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId?: string, inviteCode?: string) => {
    const body = userId ? { addressee_id: userId } : { code: inviteCode };
    const res = await fetch('/api/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    const data = await res.json();
    if (res.ok) {
      alert('Pedido enviado com sucesso!');
      if (userId) handleSearch(new Event('submit') as any); // recarrega a busca para atualizar status
      if (inviteCode) setCode('');
      router.refresh(); // atualiza as abas de pendentes
    } else {
      alert(data.error);
    }
  };

  const generateMyCode = async () => {
    const res = await fetch('/api/friends/code');
    const data = await res.json();
    if (res.ok) setInviteCode(data.data.code);
  };

  return (
    <div className={styles.addSection}>
      <div className={styles.searchBlock}>
        <h3>Buscar por nome ou @username</h3>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <Input 
            id="search" 
            placeholder="Ex: joao" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            style={{ flex: 1 }}
          />
          <Button type="submit" isLoading={loading}>Buscar</Button>
        </form>

        {results.length > 0 && (
          <ul className={styles.list}>
            {results.map((r) => (
              <li key={r.id} className={styles.listItem}>
                <div className={styles.profileInfo}>
                  <div className={styles.avatar}>
                    {r.avatar_url ? <img src={r.avatar_url} alt="Avatar" /> : r.nickname.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className={styles.nickname}>{r.nickname}</p>
                    <p className={styles.username}>@{r.username}</p>
                  </div>
                </div>
                {r.friendship_status === 'accepted' ? (
                  <span className={styles.statusBadge}>Amigos</span>
                ) : r.friendship_status === 'pending' ? (
                  <span className={styles.statusBadge}>Pendente</span>
                ) : (
                  <Button size="sm" onClick={() => handleSendRequest(r.id, undefined)}>Adicionar</Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <hr className={styles.divider} />

      <div className={styles.codeBlock}>
        <h3>Adicionar via Código</h3>
        <div className={styles.searchForm}>
          <Input 
            id="code" 
            placeholder="Digite o código" 
            value={code} 
            onChange={(e) => setCode(e.target.value)} 
            style={{ flex: 1 }}
          />
          <Button onClick={() => handleSendRequest(undefined, code)}>Adicionar</Button>
        </div>
      </div>

      <hr className={styles.divider} />

      <div className={styles.myCodeBlock}>
        <h3>Seu Código de Convite</h3>
        <p className={styles.helperText}>Compartilhe este código para que outras pessoas te adicionem.</p>
        {inviteCode ? (
          <div className={styles.codeDisplay}>
            <strong>{inviteCode}</strong>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button 
                size="sm" 
                style={copied ? { backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' } : {}}
                onClick={() => {
                  navigator.clipboard.writeText(inviteCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? '✔ Copiado' : 'Copiar'}
              </Button>
              <Button size="sm" variant="secondary" onClick={generateMyCode}>Gerar Novo</Button>
            </div>
          </div>
        ) : (
          <Button onClick={generateMyCode} variant="secondary">Mostrar Meu Código</Button>
        )}
      </div>
    </div>
  );
}

function PendingRequests({ received, sent }: { received: Friendship[], sent: Friendship[] }) {
  const router = useRouter();

  const handleAction = async (id: string, action: 'accept' | 'reject' | 'cancel') => {
    let res;
    if (action === 'accept') {
      res = await fetch(`/api/friends/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' })
      });
    } else {
      res = await fetch(`/api/friends/${id}`, { method: 'DELETE' });
    }

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error);
    }
  };

  return (
    <div className={styles.pendingSection}>
      <h3>Recebidos ({received.length})</h3>
      {received.length === 0 ? (
        <p className={styles.emptyText}>Nenhum pedido recebido.</p>
      ) : (
        <ul className={styles.list}>
          {received.map((f) => (
            <li key={f.id} className={styles.listItem}>
              <div className={styles.profileInfo}>
                <div className={styles.avatar}>
                  {f.requester.avatar_url ? <img src={f.requester.avatar_url} alt="Avatar" /> : f.requester.nickname.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className={styles.nickname}>{f.requester.nickname}</p>
                  <p className={styles.username}>@{f.requester.username}</p>
                </div>
              </div>
              <div className={styles.actionButtons}>
                <Button size="sm" onClick={() => handleAction(f.id, 'accept')}>Aceitar</Button>
                <Button size="sm" variant="secondary" onClick={() => handleAction(f.id, 'reject')}>Recusar</Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <hr className={styles.divider} />

      <h3>Enviados ({sent.length})</h3>
      {sent.length === 0 ? (
        <p className={styles.emptyText}>Nenhum pedido enviado.</p>
      ) : (
        <ul className={styles.list}>
          {sent.map((f) => (
            <li key={f.id} className={styles.listItem}>
              <div className={styles.profileInfo}>
                <div className={styles.avatar}>
                  {f.addressee.avatar_url ? <img src={f.addressee.avatar_url} alt="Avatar" /> : f.addressee.nickname.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className={styles.nickname}>{f.addressee.nickname}</p>
                  <p className={styles.username}>@{f.addressee.username}</p>
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => handleAction(f.id, 'cancel')}>Cancelar</Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
