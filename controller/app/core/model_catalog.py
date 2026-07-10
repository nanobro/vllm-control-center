from __future__ import annotations

from app.schemas.model_hub import CatalogModelRecord

# Starter catalog: intentionally small, editable, and vLLM/Hugging Face oriented.
# Unlike LM Studio screenshots, vLLM generally serves HF Transformers/safetensors
# repos rather than GGUF/MLX files.
CATALOG_MODELS: list[CatalogModelRecord] = [
    CatalogModelRecord(
        id='qwen3-0_6b',
        model_id='Qwen/Qwen3-0.6B',
        display_name='Qwen3 0.6B',
        description='Tiny smoke-test model for validating the full download -> instance -> start flow.',
        tags=['qwen', 'small', 'test', 'instruct'],
        size_label='0.6B',
        parameter_count_b=0.6,
        suggested_max_model_len=8192,
    ),
    CatalogModelRecord(
        id='qwen3-4b',
        model_id='Qwen/Qwen3-4B',
        display_name='Qwen3 4B',
        description='Small general model for local testing when you want something more realistic than 0.6B.',
        tags=['qwen', 'small', 'general'],
        size_label='4B',
        parameter_count_b=4,
        suggested_max_model_len=32768,
    ),
    CatalogModelRecord(
        id='qwen3-8b',
        model_id='Qwen/Qwen3-8B',
        display_name='Qwen3 8B',
        description='Good default candidate for local vLLM serving experiments.',
        tags=['qwen', 'general', 'tool-use'],
        size_label='8B',
        parameter_count_b=8,
        suggested_max_model_len=32768,
    ),
    CatalogModelRecord(
        id='qwen2_5-coder-7b-instruct',
        model_id='Qwen/Qwen2.5-Coder-7B-Instruct',
        display_name='Qwen2.5 Coder 7B Instruct',
        description='Coding-oriented starter model for agent/dev workflows.',
        tags=['qwen', 'coding', 'agent'],
        size_label='7B',
        parameter_count_b=7,
        suggested_max_model_len=32768,
    ),

    CatalogModelRecord(
        id='qwen3-14b',
        model_id='Qwen/Qwen3-14B',
        display_name='Qwen3 14B',
        description='Mid-size Qwen model for stronger local/remote vLLM tests on larger GPUs.',
        tags=['qwen', 'mid', 'general', 'dgx'],
        size_label='14B',
        parameter_count_b=14,
        suggested_max_model_len=32768,
    ),
    CatalogModelRecord(
        id='qwen3-32b',
        model_id='Qwen/Qwen3-32B',
        display_name='Qwen3 32B',
        description='Larger Qwen candidate for serious GPU workstations and remote DGX-style servers.',
        tags=['qwen', 'large', 'general', 'dgx'],
        size_label='32B',
        parameter_count_b=32,
        suggested_max_model_len=32768,
    ),
    CatalogModelRecord(
        id='qwen2_5-coder-32b-instruct',
        model_id='Qwen/Qwen2.5-Coder-32B-Instruct',
        display_name='Qwen2.5 Coder 32B Instruct',
        description='Coding-focused larger model for agent workflows on high-memory GPUs.',
        tags=['qwen', 'coding', 'agent', 'large', 'dgx'],
        size_label='32B',
        parameter_count_b=32,
        suggested_max_model_len=32768,
    ),
    CatalogModelRecord(
        id='deepseek-r1-distill-qwen-7b',
        model_id='deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
        display_name='DeepSeek R1 Distill Qwen 7B',
        description='Reasoning-oriented test model. Pair with a vLLM reasoning parser when appropriate.',
        tags=['reasoning', 'qwen', 'distill'],
        size_label='7B',
        parameter_count_b=7,
        suggested_max_model_len=32768,
        notes='Some clients may want reasoning output handling enabled separately.',
    ),
    CatalogModelRecord(
        id='mistral-7b-instruct-v0_3',
        model_id='mistralai/Mistral-7B-Instruct-v0.3',
        display_name='Mistral 7B Instruct v0.3',
        description='Compact general instruct model for comparison tests.',
        tags=['mistral', 'general', 'instruct'],
        size_label='7B',
        parameter_count_b=7,
        suggested_max_model_len=32768,
    ),
    CatalogModelRecord(
        id='llama-3_1-8b-instruct',
        model_id='meta-llama/Llama-3.1-8B-Instruct',
        display_name='Llama 3.1 8B Instruct',
        description='Popular general instruct baseline. May require accepting model terms and using an HF token.',
        tags=['llama', 'general', 'gated'],
        size_label='8B',
        parameter_count_b=8,
        suggested_max_model_len=32768,
        gated=True,
    ),
]


def list_catalog_models(query: str | None = None, tag: str | None = None) -> list[CatalogModelRecord]:
    models = CATALOG_MODELS
    if query:
        q = query.lower().strip()
        models = [m for m in models if q in m.model_id.lower() or q in m.display_name.lower() or q in m.description.lower()]
    if tag:
        t = tag.lower().strip()
        models = [m for m in models if t in {tag_item.lower() for tag_item in m.tags}]
    return models


def get_catalog_model(catalog_id: str) -> CatalogModelRecord | None:
    for model in CATALOG_MODELS:
        if model.id == catalog_id:
            return model
    return None


def default_instance_name(model_id: str) -> str:
    return model_id.split('/')[-1].replace('.', '-').replace('_', '-').lower()
