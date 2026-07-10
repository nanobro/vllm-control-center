import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

export function ChatHistoryPage() {
  const qc = useQueryClient();
  const sessions = useQuery({ queryKey: ['chat-sessions'], queryFn: api.chatSessions });
  const [selected, setSelected] = useState('');
  const messages = useQuery({ queryKey: ['chat-messages', selected], queryFn: () => api.chatMessages(selected), enabled: Boolean(selected) });
  const [title, setTitle] = useState('New vLLM test chat');
  const create = useMutation({ mutationFn: api.createChatSession, onSuccess: (session) => { qc.invalidateQueries({ queryKey: ['chat-sessions'] }); setSelected(session.id); } });

  function submit(e: FormEvent) {
    e.preventDefault();
    create.mutate({ title });
  }

  return (
    <>
      <h2>Chat History</h2>
      <form className="card" onSubmit={submit}>
        <label>Session title<input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <button className="btn">Create session</button>
      </form>
      <div className="grid">
        <div className="card">
          <h3>Sessions</h3>
          {sessions.data?.map((session) => <button className="btn secondary" style={{ display: 'block', marginBottom: 8, width: '100%', textAlign: 'left' }} key={session.id} onClick={() => setSelected(session.id)}>{session.title}</button>)}
        </div>
        <div className="card">
          <h3>Messages</h3>
          {!selected && <p>Select a session.</p>}
          {messages.data?.map((message) => <div key={message.id} style={{ marginBottom: 12 }}><span className="status">{message.role}</span><p>{message.content}</p></div>)}
        </div>
      </div>
    </>
  );
}
