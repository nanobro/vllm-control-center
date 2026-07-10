# v23.1 Agent Prompt — Run Model Simplification Pass

You are continuing vLLM Control Center after v23.0 public beta RC.

User feedback: the app still feels visually busy and repetitive compared with LM Studio. The old Run Model page had too many stacked surfaces saying similar things.

Implement v23.1 with this priority:

- Simplify Run Model into one daily-use workbench.
- Do not add another top-level card unless it removes/replaces an existing one.
- Keep setup checks available, but collapse them unless something needs attention.
- Keep advanced vLLM/operator controls available, but behind Advanced cockpit.
- The main mental model must be: select model -> load/unload -> quick test -> copy endpoint.

Acceptance criteria:

- Sidebar badge says v23.1 beta RC.
- Run Model no longer stacks beta quick-start, one-click flow, success panel, setup doctor, and simple mode as separate always-visible cards.
- One compact workbench includes selected model, source, endpoint state, primary actions, compact model picker, and detail drawer.
- Setup Doctor opens automatically only when attention is needed.
- Backend tests, backend lint, frontend build, and desktop shell check pass.
