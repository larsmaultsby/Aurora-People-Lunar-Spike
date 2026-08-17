# Aurora World Local Narrator Model Requirements

## Purpose

This document is a handoff for a local agent to identify and assess a better narrator model for Aurora World / Project Lunar on this machine.

The goal is **not** to find the most creative roleplay model. The goal is to find the strongest **uncensored, instruction-following narrator model that can run locally at usable interactive latency**.

Aurora World currently routes Lunar through LM Studio's OpenAI-compatible server. The chosen model must work in that environment without requiring a cloud provider.

Related canonical plan: `aurora-world-next-steps-after-local-model-evaluation`.

## Why a new model is needed

Recent playtesting exposed recurring failures from the currently available 8–9B roleplay-oriented models:

- invention of player identity, backstory, thoughts, emotions, speech, and actions;
- weak adherence to direct-NPC turn-taking;
- rapid escalation from ambiguity to supernatural certainty;
- repetitive dramatic language and mirrored sentence patterns;
- protocol leakage and menu-like endings;
- excessive scene invention instead of incremental, evidence-based world progression.

These problems persisted even after adding explicit narrator rules. The next candidate should therefore be selected primarily for **instruction fidelity, role separation, grounding, and continuity**.

## Hard requirements

A candidate is acceptable only if it satisfies all of the following.

### 1. Uncensored / permissive fictional roleplay

The model must be suitable for unrestricted fictional storytelling and roleplay, including mature themes, horror, violence, profanity, morally difficult characters, and consensual adult content without routine provider-style refusals.

"Uncensored" does **not** mean "aggressive," chaotic, or instruction-resistant. The model must still obey system instructions and narrator-role boundaries reliably.

Prefer an uncensored or minimally restricted derivative of a strong general-purpose instruct model over a model whose primary tuning goal is erotic roleplay, shock value, or maximum creativity.

### 2. Strong instruction hierarchy

The model must reliably follow a long system prompt containing behavioral rules. In particular it must respect rules even when its roleplay priors would otherwise encourage dramatic improvisation.

It must be able to distinguish:

- system instructions from story content;
- player actions from narrator output;
- engine protocol from prose;
- established canon from speculative inference.

### 3. Player agency preservation

The narrator must not invent or control the player's:

- identity or backstory;
- thoughts or conclusions;
- emotions or desires;
- dialogue;
- voluntary movement or decisions;
- abilities that have not been established.

Observable involuntary effects may be narrated when justified by the scene, but voluntary decisions belong to the player.

A single severe player-agency takeover during the benchmark is a major disqualifier.

### 4. NPC turn-taking and knowledge discipline

When the player directly addresses a named NPC, that NPC should normally answer first unless a concrete interruption is justified.

NPCs must not casually know private or future information. If an NPC does not know something, uncertainty, ignorance, deception, or refusal should be represented explicitly rather than replaced with generic mystery language.

### 5. Grounded escalation

The model must be able to sustain uncertainty.

It should develop mystery through observable evidence, contradiction, behavior, and consequences rather than immediately declaring supernatural causes, secret powers, hidden organizations, or cosmic significance.

The model should advance one or a few concrete beats per turn instead of writing several scenes ahead of the player.

### 6. No narrator protocol leakage

Narrator prose must not emit or imitate engine/player control syntax such as:

- `[SAY]`
- `[DO]`
- `[CONTINUE]`
- `[META]`
- hidden inventory/state tags
- menu endings such as `Do you:` followed by suggested actions

The model must be comfortable consuming structured/action syntax without echoing it back as prose.

### 7. Good continuity and low repetition

The model should:

- preserve established facts;
- avoid contradicting recent scene state;
- avoid repeating paragraphs during continuation;
- avoid stock mystery phrases on every turn;
- avoid mirroring the same sentence template across multiple NPCs;
- add concrete information or consequences rather than merely restating mood.

## Local runtime compatibility

### Required

- Must run locally in **LM Studio**.
- Must be available in, or convertible to, a **GGUF** format supported by LM Studio.
- Must work through LM Studio's **OpenAI-compatible HTTP API**.
- Must support the chat/instruction template required by its model family.
- Must support at least an **8k context window** in practical use; **16k+ is preferred** because Lunar's narrator prompt and accumulated context can become large.
- Streaming output must work correctly through the OpenAI-compatible API.

### Quantization guidance

Start with **Q4_K_M** or an equivalent high-quality 4-bit quantization. If there is sufficient memory headroom, compare Q5_K_M or equivalent. Avoid extremely aggressive Q2/Q3 quantization unless hardware measurements show it is necessary and the benchmark demonstrates that instruction quality remains acceptable.

## Machine-fit requirement

The candidate must run well on **this specific machine**, not merely fit theoretically.

Observed proof point: local GGUF models in roughly the **6.5–6.6 GB loaded-model range** have successfully loaded and served inference through LM Studio on this machine. This is the proven baseline, not a hard maximum.

Before recommending anything materially larger, the local agent must inspect and report:

- Mac model / CPU / Apple Silicon generation if applicable;
- total physical or unified memory;
- available memory before model load;
- memory pressure during generation;
- swap growth during a multi-turn test;
- LM Studio model memory footprint;
- context/KV-cache memory at the proposed context size;
- whether the model can remain loaded without causing sustained system instability or severe swapping.

Do **not** assume that a 14B, 20B, 32B, or larger model fits simply because a quantized file can be opened. Practical context headroom and interactive latency matter.

### Size-search strategy

1. Establish the actual memory envelope.
2. Test the strongest instruction-tuned model that fits comfortably.
3. Prefer an 8–14B high-quality instruct model at a good quantization over a larger model that requires severe quantization or swap thrashing.
4. Consider larger classes only if measured memory and throughput make them genuinely playable.

## Interactive performance targets

These are gameplay targets, not absolute laboratory requirements.

### Preferred

- Time to first visible token: **<= 5 seconds**.
- Maximum acceptable time to first token for a clearly better model: **<= 10 seconds**.
- Sustained generation: **>= 8 tokens/sec preferred**.
- Minimum worth considering if quality is materially better: **~5 tokens/sec**.
- A normal 300–500 token narrator response should remain within an interactive turn budget, ideally **well under 45 seconds total generation time**.

The local agent should report actual measured numbers rather than assuming them from model size.

A model that produces excellent prose but makes every turn feel non-interactive should not be recommended as the default narrator.

## Model-family preference

Prefer candidates derived from strong modern **general instruct** models with good role separation and constraint following.

Useful characteristics include:

- strong system-prompt adherence;
- good long-context behavior;
- low hallucination under explicit grounding constraints;
- reliable structured-output behavior;
- good multi-character conversation tracking;
- ability to maintain uncertainty rather than over-resolve a scene;
- uncensored or minimally restricted fine-tune that preserves the base model's instruction quality.

Do not prioritize models merely because they are labeled:

- roleplay;
- storyteller;
- uncensored;
- aggressive;
- erotic;
- creative.

Those labels are not substitutes for narrator-contract performance.

## Blackwater benchmark

Use the existing Aurora World scenario **The Last Train to Blackwater** with a clean zero-history campaign for every candidate.

Keep engine settings, narrator prompt, scenario definition, and scripted player actions constant. Change only the loaded model.

### Suggested benchmark sequence

Use a fresh campaign and run a short controlled sequence such as:

1. `[CONTINUE]`
2. `[DO] I remain seated and watch the lantern through the window.`
3. Ask the conductor directly why the train stopped.
4. `[DO] I say nothing and listen to the other passengers.`
5. Examine a concrete piece of scene evidence without deciding what it means.
6. Ask a named NPC a direct factual follow-up question.
7. Refuse an implied invitation or suggested action and remain where you are.
8. Ask an open-ended question that could tempt the model to invent player backstory.
9. Continue once more without specifying an action.
10. Perform one mundane action to test whether the model needlessly turns it into a conspiracy or supernatural event.

The exact wording should be saved and reused for every candidate.

## Scoring rubric

Score each category from 0–2 per turn or use an equivalent normalized rubric.

- **Player agency** — does the model leave player decisions to the player?
- **NPC turn-taking** — does the addressed NPC respond appropriately?
- **NPC knowledge discipline** — are claims limited to plausible knowledge?
- **Grounding** — does mystery emerge from evidence rather than declarations?
- **Information gain** — does each turn add concrete useful information?
- **Continuity** — are established facts preserved?
- **Pacing** — does the model avoid writing several scenes ahead?
- **Repetition** — does it avoid duplicated prose and stock phrases?
- **Protocol discipline** — no control-token/menu leakage.
- **Player-backstory discipline** — no invented identity/history.
- **Latency** — first-token and total-generation time.
- **Throughput** — tokens/sec under actual Lunar context.

## Immediate disqualifiers

A candidate should normally be rejected if it repeatedly or severely does any of the following:

- plays the player's character for them;
- invents a player identity/backstory without establishment;
- ignores explicit system-level narrator rules;
- emits engine/player protocol as narration;
- repeatedly lets the wrong NPC answer direct questions;
- converts ambiguity into unsupported supernatural certainty immediately;
- produces severe repetition or continuation loops;
- routinely refuses the fictional content range Aurora World is intended to support;
- cannot sustain the required context window;
- causes unacceptable memory pressure, swap thrashing, crashes, or unusable latency.

## Expected local-agent deliverable

Return a concise assessment containing:

### Hardware

- exact machine model/chip;
- total memory/unified memory;
- relevant GPU/Metal information;
- LM Studio version/runtime information;
- baseline memory usage before model load.

### Candidate shortlist

For each candidate:

- exact model name and source;
- base model;
- fine-tune type;
- uncensored/permissive status and how that was established;
- parameter count;
- GGUF quantization tested;
- GGUF file size;
- configured context window;
- loaded memory footprint;
- observed memory pressure/swap behavior;
- time to first token;
- tokens/sec;
- total time for a representative 300–500 token response.

### Narrator benchmark

For each candidate:

- same Blackwater benchmark actions;
- scores for the rubric above;
- any severe failures quoted or summarized;
- whether the model invented player state or supernatural facts;
- whether it leaked protocol;
- whether it maintained NPC turn-taking and continuity.

### Recommendation

Return:

1. **best model that fits comfortably**;
2. **best higher-quality model worth trying if memory allows**;
3. **models rejected and why**;
4. recommended quantization/context settings;
5. whether the machine appears capable of a meaningful quality step above the current 8–9B roleplay models.

If no clearly better model fits the machine at playable latency, state that directly. That result is useful architectural information and should not be hidden by recommending a marginal model.

## Decision principle

The target is not the largest model the machine can technically load.

The target is the **strongest uncensored model that can reliably execute Lunar's narrator contract while remaining pleasant to play locally**.
