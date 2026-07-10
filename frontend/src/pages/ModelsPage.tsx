import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

export function ModelsPage() {
  const qc = useQueryClient();
  const models = useQuery({ queryKey: ['models'], queryFn: api.models });
  const [modelId, setModelId] = useState('Qwen/Qwen3-0.6B');
  const [displayName, setDisplayName] = useState('');
  const [tags, setTags] = useState('starter, coding');
  const create = useMutation({
    mutationFn: api.createModel,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['models'] }),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    create.mutate({ model_id: modelId, display_name: displayName || undefined, tags: tags.split(',').map((x) => x.trim()).filter(Boolean) });
  }

  return (
    <>
      <h2>Model Registry</h2>
      <form className="card" onSubmit={submit}>
        <div className="grid">
          <label>Hugging Face model ID<input className="input" value={modelId} onChange={(e) => setModelId(e.target.value)} /></label>
          <label>Display name<input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="optional" /></label>
          <label>Tags<input className="input" value={tags} onChange={(e) => setTags(e.target.value)} /></label>
        </div>
        <button className="btn">Add model</button>
      </form>
      <div className="grid">
        {models.data?.map((model) => <div className="card" key={model.id}>
          <h3>{model.display_name}</h3>
          <p>{model.model_id}</p>
          <div className="row">{model.tags.map((tag) => <span className="status" key={tag}>{tag}</span>)}</div>
          {model.notes && <p>{model.notes}</p>}
        </div>)}
      </div>
    </>
  );
}
