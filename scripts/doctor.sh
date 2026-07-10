#!/usr/bin/env bash
set -euo pipefail

printf "Python: "
python --version || true
printf "Node: "
node --version || true
printf "npm: "
npm --version || true
printf "vLLM: "
(vllm --version || true) 2>/dev/null
printf "NVIDIA GPU:\n"
(nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader || true) 2>/dev/null
printf "Docker: "
(docker --version || true) 2>/dev/null
