import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

export function RecipesPage() {
  const qc = useQueryClient();
  const recipes = useQuery({ queryKey: ['recipes'], queryFn: api.recipes });
  const [name, setName] = useState('Qwen Local Dev');
  const [model, setModel] = useState('Qwen/Qwen3-0.6B');
  const [port, setPort] = useState(8000);
  const [presetType, setPresetType] = useState('local_dev');
  const create = useMutation({ mutationFn: api.createRecipe, onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }) });
  const createInstance = useMutation({ mutationFn: api.createInstanceFromRecipe, onSuccess: () => qc.invalidateQueries({ queryKey: ['instances'] }) });

  function submit(e: FormEvent) {
    e.preventDefault();
    create.mutate({
      name,
      preset_type: presetType,
      config: { model, host: '127.0.0.1', port, dtype: 'auto', gpu_memory_utilization: 0.92 },
    });
  }

  return (
    <>
      <h2>Recipes</h2>
      <form className="card" onSubmit={submit}>
        <div className="grid">
          <label>Name<input className="input" value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label>Model<input className="input" value={model} onChange={(e) => setModel(e.target.value)} /></label>
          <label>Port<input className="input" type="number" value={port} onChange={(e) => setPort(Number(e.target.value))} /></label>
          <label>Preset type<input className="input" value={presetType} onChange={(e) => setPresetType(e.target.value)} /></label>
        </div>
        <button className="btn">Save recipe</button>
      </form>
      {recipes.data?.map((recipe) => <div className="card" key={recipe.id}>
        <div className="row"><h3 style={{ marginRight: 'auto' }}>{recipe.name}</h3><span className="status">{recipe.preset_type}</span></div>
        <p>{recipe.config.model} · {recipe.config.host}:{recipe.config.port}</p>
        <div className="row"><button className="btn secondary" onClick={() => createInstance.mutate(recipe.id)}>Create instance</button></div>
      </div>)}
    </>
  );
}
