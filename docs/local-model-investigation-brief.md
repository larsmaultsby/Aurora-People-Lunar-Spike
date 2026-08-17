# Aurora World Local Model Investigation Brief

## Purpose

This document is a self-contained handoff for an investigative agent working on Aurora World / Project Lunar.

The immediate goal is to determine whether this machine can run a materially better **uncensored, instruction-following local narrator model** than the models tested so far, and to determine whether Lunar's structured post-turn maintenance should use a **different model or deterministic/schema-validated logic** instead of sharing the creative narrator.

Do not treat this as a prompt-writing task. The current evidence says the main bottleneck is model fit and structured-maintenance reliability, not lack of narrator rules.

Related documents:

- Canonical plan: `aurora-world-next-steps-after-local-model-evaluation`
- Canonical runtime decision: `decision-20260816044225-aurora-world-uses-native-project-lunar-as-its-primary-playable-runtime`
- Earlier requirements handoff: `docs/local-narrator-model-requirements.md`

## Verified current state

### Runtime ownership

Aurora World uses native Project Lunar as its primary playable runtime.

The current Aurora World branch already contains targeted local-runtime improvements and should not be replaced with a different backend merely to solve model quality problems.

### Local routing

Aurora World is now intentionally pinned to LM Studio through the OpenAI-compatible route.

The browser, API request defaults, backend startup defaults, and managed runtime all resolve to:

- provider: `openai`
- model alias: `gpt-5.6-sol`

The alias is deliberately stable while the actual model loaded in LM Studio may change during evaluation.

DeepSeek is no longer presented as an Aurora World UI choice. Stale browser settings are normalized to the local Sol route. The managed runtime also forces the local route server-side as a safety net.

Therefore, **do not spend investigation time on DeepSeek routing unless logs show an actual regression**.

### Foreground-priority scheduling

Aurora World now prioritizes player-facing narration over post-turn maintenance.

Current behavior:

1. player action enters the foreground path;
2. narrator generation runs and response is persisted;
3. foreground input is released;
4. post-turn maintenance runs through one serialized worker per session;
5. a newly waiting player turn gets priority between maintenance stages.

This change successfully reduced the previous "the game crashed" feeling caused by many local-model calls competing at once.

Observed example after this change:

- mode detection: about 3.4 seconds;
- narrator generation: about 21.8 seconds;
- foreground turn complete: about 25.2 seconds;
- maintenance then continued in the background for roughly another 50 seconds.

This scheduling behavior is considered a working infrastructure improvement. Do not redesign it unless the investigation finds a concrete defect.

## Scenario used for evaluation

Use the existing scenario:

**The Last Train to Blackwater**

Scenario characteristics:

- grounded supernatural mystery;
- isolated overnight train in the Blackwater mountains;
- escalation should be gradual;
- NPC knowledge should remain limited;
- consequences should be concrete;
- player agency should remain high;
- no predetermined solution;
- no configured player backstory.

Opening premise:

> Rain follows the last train north as it climbs into the Blackwater mountains. Near midnight, the conductor locks the door between carriages and quietly asks everyone to remain seated. A few minutes later the train brakes hard in open country, though there is no station on the timetable. The lights flicker. Outside your window, a lone lantern is moving toward the tracks.

Important: the word "Rain" in the opening refers to weather. It is **not the player name**.

The scenario has no setup questions and clean test campaigns use player name `Player` with no generated backstory.

Any narrator-created identity, profession, history, abilities, relationships, internal thoughts, desires, dialogue, or voluntary actions for the player are agency/canon failures unless they were explicitly established by the player.

## Models tested so far

### `undi95_-_llama-3-roleplay-8b-evo`

Result: rejected.

Observed problems:

- repetitive dramatic signaling;
- weak NPC discipline;
- protocol leakage;
- dangling character mentions caused continuation behavior and state pollution;
- model output often prioritized roleplay theatrics over system constraints.

### `qwen3.5-9b-uncensored-hauhaucs-aggressive`

Result: rejected.

Observed problems:

- better surface prose than some 8B alternatives;
- still violated player agency;
- rapidly converted ambiguity into supernatural certainty;
- invented excessive scene state and future knowledge;
- introduced too many characters and concepts at once;
- ended with soft action-menu language;
- the "aggressive" fine-tune appears too eager to invent/escalate.

### `llama-3.1-8b-stheno-v3.4`

Result: rejected.

Observed problems:

- severe player takeover;
- misread the weather word "Rain" as the player's name and made the player female;
- invented player emotions, thoughts, dialogue, movement, and decisions;
- forced the player outside the train;
- escalated rapidly to a mutilated corpse and explicit supernatural framing;
- exposed a genuine Lunar continuation/control-tag defect involving `[ITEM_ADD:...]`.

### `qwen3-14b-abliterated`

Result: not selected; investigation stopped before full qualification.

Observed problems:

- loaded successfully at about 9 GB;
- exposed Chinese planning/reasoning text and `</think>` in narrator output under the LM Studio serving setup;
- `/no_think` prompt attempts did not cleanly eliminate all leaked wrapper/reasoning text;
- invented crossover/non-canon characters including `@Satoru Gojo`;
- advanced the mystery too quickly;
- player-agency behavior looked somewhat better than Stheno, but the serving/template behavior was unacceptable for gameplay without further configuration work.

Do not assume this model is permanently disqualified. It may be worth revisiting **only if** the agent can verify a clean LM Studio non-thinking configuration that produces no reasoning leakage and no template garbage.

### `dolphin-2.9.3-mistral-nemo-12b`

Result: rejected as primary narrator.

Positive findings:

- technically stable in LM Studio;
- approximately 7.12 GB loaded size;
- no visible `<think>` leakage;
- no Chinese planning preamble;
- no `[SAY]`, `[DO]`, `[CONTINUE]`, or `[META]` leakage in the reviewed turn;
- no action menu in the reviewed turn;
- routed reliably through `gpt-5.6-sol`;
- foreground scheduling worked correctly with it.

Narrative failures:

- on a simple `[CONTINUE]`, it took control of the player;
- it made the player recount events and agree with the conductor;
- it assigned the player feelings of renewed purpose/responsibility;
- it asserted that passengers had entrusted their safety to the player;
- it decided the player's movement and future motivation;
- Blackwater drifted into a generic supernatural-adventure sequence involving an ancient glowing tree, aggressive branches, forest exploration, an abandoned station, and broad "secrets/danger/unknown" language;
- direct NPC responses remained low-information and generic;
- prose repeatedly substituted vague mystery language for concrete evidence or constrained knowledge.

Conclusion: technically usable, narratively unreliable.

## New structured-maintenance finding

The latest Mistral test revealed that the **same creative narrator model is a poor fit for structured maintenance calls**.

Observed example:

- witness extraction returned `['NR']`;
- Lunar then treated `NR` as an NPC present in the scene and passed it into NPC-mind processing;
- logs also contained malformed/placeholder-like state such as `<unnamed station>`.

This creates a separate architectural question from narrator quality:

> Should witness extraction, entity extraction, journal classification, power evaluation, and other structured maintenance continue to use the same creative narrator model?

Current evidence suggests the answer may be **no**.

Possible directions to investigate:

1. a smaller instruction model dedicated to structured extraction/classification;
2. deterministic extraction where the data already exists in engine state;
3. schema-constrained structured outputs with strict validation/rejection;
4. explicit confidence thresholds and "no result" behavior rather than accepting hallucinated entities;
5. different models for narrator and maintenance, both served locally.

Do not implement these changes during the initial investigation unless explicitly directed. First determine whether the failure is model-specific, prompt/schema-specific, or architectural.

## Separate known engine defect

Do not confuse model quality with the known continuation/control-tag defect.

Observed with Stheno:

1. a narrator response ended with a hidden state tag such as `[ITEM_ADD:rusty old pocket knife|weapon|found lying on train tracks]`;
2. because the tag followed otherwise complete prose, Lunar appears to have judged the response incomplete;
3. auto-continuation fired;
4. continuation repeated the prior paragraph;
5. the same state tag appeared again, creating a risk of duplicate state mutation.

This is an engine robustness defect and remains a separate work item.

The intended fix is to process/remove trailing hidden control/state tags before response-completeness evaluation and ensure continuation cannot duplicate state mutations.

For the model investigation, simply record whether a candidate triggers this behavior. Do not use it as evidence that the model alone is bad unless the model is clearly emitting malformed/duplicated protocol.

## Investigation objectives

The investigative agent should answer the following questions.

### 1. What hardware envelope actually exists?

Measure, do not assume:

- exact Mac model/chip;
- total unified/physical memory;
- baseline memory usage before model load;
- available memory before model load;
- memory pressure during generation;
- swap growth;
- LM Studio loaded-model footprint;
- context/KV-cache memory at tested context sizes;
- sustained temperature/throttling if observable;
- practical headroom for keeping the machine usable during gameplay.

Known proof points:

- models around 6.5–7.1 GB load and run;
- a roughly 9 GB Qwen3 14B GGUF also loaded successfully;
- successful loading alone is not sufficient evidence of playable headroom.

### 2. Which stronger uncensored narrator candidates fit?

Prefer **strong general instruct models or faithful uncensored derivatives** over models whose primary identity is "roleplay," "aggressive," "erotic," "storyteller," or "maximum creativity."

The ideal narrator model should be:

- uncensored/permissive for fictional roleplay;
- highly instruction-following;
- strong at system/user role separation;
- good at preserving player agency;
- able to sustain uncertainty;
- grounded and incremental;
- good with multi-character dialogue;
- resistant to inventing non-canon backstory;
- able to avoid action menus and protocol leakage;
- usable through LM Studio's OpenAI-compatible API;
- available in GGUF at a practical quantization.

Strong uncensored behavior must not come at the expense of instruction hierarchy.

### 3. Can Qwen3 14B be salvaged with correct serving configuration?

Investigate only if practical.

Determine whether LM Studio can serve `qwen3-14b-abliterated` with thinking genuinely disabled at the chat-template/inference level so that:

- no Chinese planning preamble is emitted;
- no `<think>`/`</think>` wrapper appears;
- no hidden reasoning text leaks into narrator prose;
- system instructions still work correctly;
- latency remains playable.

Do not "solve" this by merely stripping reasoning text after generation unless that is the only viable route and its downsides are explicitly documented.

### 4. Should structured maintenance use a different model?

Evaluate whether one small local instruction model can reliably handle tasks such as:

- witness extraction;
- entity extraction;
- journal relevance/classification;
- power scoring/evaluation;
- other JSON/schema-oriented post-turn calls.

Measure:

- structured-output validity rate;
- hallucinated entity rate;
- ability to return empty/no-result outputs;
- latency;
- loaded memory cost if kept beside the narrator;
- whether two simultaneously loaded models fit comfortably;
- whether a single small model can replace multiple creative-model auxiliary calls.

Prefer a model that is boring, literal, and schema-reliable over one that is creative.

### 5. Which maintenance operations could become deterministic?

Inspect the current data flow conceptually and identify operations where Lunar already has sufficient state to avoid an LLM call.

Examples to consider:

- whether witnesses can be bounded to explicitly present NPCs plus directly addressed names;
- whether player inventory/state changes can be validated against structured engine events;
- whether journal updates need generation every turn;
- whether power evaluation can be event-driven rather than free-form prose interpretation.

The deliverable should distinguish:

- work that truly needs an LLM;
- work that benefits from a small structured model;
- work that should become deterministic/schema-validated.

Do not implement a broad rewrite during this investigation.

## Narrator benchmark procedure

Use a **fresh zero-history Blackwater campaign for every candidate**.

Keep constant:

- scenario definition;
- narrator prompt;
- Aurora World engine revision;
- LM Studio serving path;
- context policy;
- scripted player actions.

Change only the model and explicitly documented serving/quantization settings.

Suggested 10-turn sequence:

1. `[CONTINUE]`
2. `[DO] I remain seated and watch the lantern through the window.`
3. Ask the conductor directly why the train stopped.
4. `[DO] I say nothing and listen to the other passengers.`
5. Examine one concrete piece of scene evidence without deciding what it means.
6. Ask a named NPC a direct factual follow-up.
7. Refuse an implied invitation or suggested action and remain where you are.
8. Ask an open-ended question that could tempt the model to invent player backstory.
9. `[CONTINUE]`
10. Perform one mundane action and observe whether the model needlessly turns it into a conspiracy/supernatural event.

Save the exact action text and reuse it across candidates.

## Narrator scoring rubric

Score each category from 0–2 per turn or use an equivalent normalized rubric.

- **Player agency** — leaves player decisions, dialogue, voluntary movement, thoughts, emotions, identity, and backstory to the player.
- **NPC turn-taking** — the directly addressed NPC normally answers first unless concretely interrupted.
- **NPC knowledge discipline** — claims are limited to what the NPC could plausibly know.
- **Grounding** — mystery develops through observable evidence rather than unsupported declarations.
- **Information gain** — each turn adds concrete facts/reactions/consequences rather than vague atmosphere alone.
- **Continuity** — preserves established state and avoids contradictions.
- **Pacing** — advances one or a few beats rather than writing several scenes ahead.
- **Repetition** — avoids duplicated prose and stock mystery phrasing.
- **Protocol discipline** — no narrator echo of player/control syntax or hidden-state garbage.
- **Backstory discipline** — no invented player history or identity.
- **Latency** — time to first visible token and total narrator time.
- **Throughput** — tokens/sec under actual Lunar context.

## Narrator disqualifiers

Normally reject a candidate for repeated or severe instances of:

- taking control of the player's character;
- inventing player identity/backstory;
- ignoring explicit system narrator rules;
- leaking control or reasoning syntax;
- repeated wrong-NPC responses;
- unsupported supernatural certainty;
- severe scene over-advancement;
- repetitive or generic low-information prose;
- routine content refusal inconsistent with Aurora World's intended fictional range;
- unacceptable memory pressure or swap thrashing;
- unusable latency at the actual Lunar context size.

## Structured-maintenance benchmark

Use a fixed set of representative narrator passages, including passages with:

- zero named NPCs;
- one named NPC;
- multiple named NPCs;
- an NPC mentioned but not physically present;
- an unnamed stranger;
- a location reference;
- no inventory change;
- one valid inventory change;
- ambiguous language that should produce an empty/no-result extraction.

For each candidate maintenance model, measure:

- JSON/schema validity;
- exact witness precision/recall;
- hallucinated names/entities;
- false-positive state changes;
- ability to return empty arrays/null/no-change;
- latency per call;
- throughput;
- memory footprint;
- compatibility with being loaded alongside the chosen narrator.

A hallucinated witness such as `NR` should count as a serious failure.

## Performance targets

These are gameplay targets, not absolute laboratory limits.

### Narrator

Preferred:

- first visible token <= 5 seconds;
- up to about 10 seconds may be acceptable for a clearly better model;
- >= 8 tokens/sec preferred;
- ~5 tokens/sec may be acceptable for materially better quality;
- a typical 300–500 token narrator response should ideally finish well under 45 seconds.

### Structured maintenance

Prefer much faster/lighter behavior than the narrator.

The maintenance model should be judged primarily on correctness and low hallucination, but it should also be cheap enough that post-turn processing does not monopolize the machine.

## Quantization/context guidance

Start with Q4_K_M or an equivalent high-quality 4-bit quantization.

If memory headroom permits, compare Q5-class quantization for leading candidates.

Avoid Q2/Q3 unless necessary and benchmarked; aggressive quantization may damage instruction fidelity enough to invalidate the comparison.

Practical context target:

- minimum: 8k;
- preferred: 16k+;
- larger only if the model and machine can sustain it without severe KV-cache pressure or swap.

Do not choose a larger parameter count at the cost of severe quantization, instability, or unusable latency.

## What not to change during investigation

Unless explicitly directed, do not:

- add more broad narrator prompt rules;
- replace Project Lunar as the playable runtime;
- restore Aurora People as a mandatory backend;
- weaken the local Sol routing pin;
- disable the new foreground-priority scheduling;
- broadly rewrite inventory, graph, journal, NPC mind, or power systems;
- judge a model from one attractive response;
- accept a model merely because it is labeled uncensored/roleplay/aggressive.

The investigation should produce evidence first.

## Expected deliverable

Return a concise but evidence-rich report with the following sections.

### A. Hardware and runtime envelope

- exact machine/chip;
- total memory;
- LM Studio version/runtime details;
- baseline memory;
- narrator-only loaded memory;
- narrator + maintenance-model loaded memory if testing two models;
- memory pressure and swap under multi-turn load;
- practical context size.

### B. Narrator candidate table

For each candidate:

- exact model/source;
- base model and fine-tune;
- uncensored/permissive status and how verified;
- parameter count;
- GGUF quantization and file size;
- context setting;
- loaded footprint;
- TTFT;
- tokens/sec;
- representative 300–500 token total time;
- Blackwater benchmark score;
- severe failure notes.

### C. Structured-maintenance candidate table

For each candidate or deterministic approach:

- exact model/approach;
- tasks tested;
- schema validity rate;
- hallucinated entity/witness rate;
- empty/no-result correctness;
- latency;
- memory footprint;
- whether it can remain loaded alongside the narrator.

### D. Findings

Answer directly:

1. What is the strongest narrator that fits comfortably?
2. Is there a materially better narrator than Dolphin Mistral Nemo 12B on this machine?
3. Can Qwen3 14B be served cleanly without reasoning leakage?
4. Should Aurora World use a separate structured-maintenance model?
5. Which maintenance tasks should become deterministic instead of LLM-based?
6. Does a two-model local configuration fit without harming playability?
7. What is the highest-leverage next implementation after model selection?

### E. Recommendation

Return:

- **primary narrator recommendation**;
- **fallback narrator**;
- **structured-maintenance recommendation**;
- **models rejected and why**;
- recommended quantization/context settings;
- expected memory/latency tradeoff;
- whether the current machine is sufficient for the recommended architecture.

If no model provides a meaningful quality step at playable latency, state that explicitly. That is a valid architectural result.

## Decision principle

The target is not the largest or most creative model the machine can technically load.

The target is:

> **the strongest uncensored local narrator that reliably executes Lunar's narrator contract, paired with the safest low-hallucination approach for structured game-state maintenance, while keeping Aurora World pleasant to play on this machine.**
