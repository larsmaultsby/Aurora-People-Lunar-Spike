import pytest
from unittest.mock import AsyncMock, MagicMock
from app.engines.narrator_engine import NarratorEngine, NarrativeMode


@pytest.fixture
def mock_llm():
    return AsyncMock()


@pytest.fixture
def engine(mock_llm):
    return NarratorEngine(llm=mock_llm)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("player_input", "expected_mode", "expected_seconds"),
    [
        ("[CONTINUE]", NarrativeMode.NARRATIVE, 60),
        ("[SAY] Tell me what happened.", NarrativeMode.NARRATIVE, 60),
        ("[META] Make the prose shorter.", NarrativeMode.META, 0),
    ],
)
async def test_explicit_protocol_modes_bypass_llm(
    engine, mock_llm, player_input, expected_mode, expected_seconds
):
    mode, meta = await engine.detect_mode(player_input)

    assert mode == expected_mode
    assert meta["mode"] == expected_mode.value
    assert meta["narrative_time_seconds"] == expected_seconds
    mock_llm.complete.assert_not_awaited()


@pytest.mark.asyncio
async def test_do_protocol_uses_local_combat_heuristic_without_llm(engine, mock_llm):
    mode, meta = await engine.detect_mode("[DO] I attack the guard with my sword")

    assert mode == NarrativeMode.COMBAT
    assert meta["mode"] == "COMBAT"
    mock_llm.complete.assert_not_awaited()


@pytest.mark.asyncio
async def test_do_protocol_uses_local_duration_heuristic_without_llm(engine, mock_llm):
    mode, meta = await engine.detect_mode("[DO] I wait here for 2 hours")

    assert mode == NarrativeMode.NARRATIVE
    assert meta["narrative_time_seconds"] == 7200
    mock_llm.complete.assert_not_awaited()


@pytest.mark.asyncio
async def test_untagged_action_still_uses_llm_classifier(engine, mock_llm):
    mock_llm.complete = AsyncMock(
        return_value='{"mode": "NARRATIVE", "ambush": false, "narrative_time_seconds": 30}'
    )

    mode, meta = await engine.detect_mode("I look through the window")

    assert mode == NarrativeMode.NARRATIVE
    assert meta["narrative_time_seconds"] == 30
    mock_llm.complete.assert_awaited_once()


@pytest.mark.asyncio
async def test_detect_combat_mode(engine, mock_llm):
    mock_llm.complete = AsyncMock(
        return_value='{"mode": "COMBAT", "ambush": false, "narrative_time_seconds": 0}'
    )
    mode, meta = await engine.detect_mode("I draw my sword and charge at the bandit!")
    assert mode == NarrativeMode.COMBAT
    assert meta["ambush"] is False
    assert meta["narrative_time_seconds"] == 0


@pytest.mark.asyncio
async def test_detect_narrative_mode(engine, mock_llm):
    mock_llm.complete = AsyncMock(
        return_value='{"mode": "NARRATIVE", "ambush": false, "narrative_time_seconds": 3600}'
    )
    mode, meta = await engine.detect_mode("I walk to the market and ask about rumors")
    assert mode == NarrativeMode.NARRATIVE
    assert meta["narrative_time_seconds"] == 3600


@pytest.mark.asyncio
async def test_detect_meta_mode(engine, mock_llm):
    mock_llm.complete = AsyncMock(
        return_value='{"mode": "META", "ambush": false, "narrative_time_seconds": 0}'
    )
    mode, meta = await engine.detect_mode("Can you make the story more dramatic?")
    assert mode == NarrativeMode.META


@pytest.mark.asyncio
async def test_detect_mode_defaults_on_bad_json(engine, mock_llm):
    mock_llm.complete = AsyncMock(return_value="not valid json at all")
    mode, meta = await engine.detect_mode("I do something")
    assert mode == NarrativeMode.NARRATIVE  # safe default
    assert meta["narrative_time_seconds"] == 60


@pytest.mark.asyncio
async def test_detect_mode_parses_fenced_json(engine, mock_llm):
    mock_llm.complete = AsyncMock(
        return_value='```json\n{"mode": "COMBAT", "ambush": false, "narrative_time_seconds": 12}\n```'
    )
    mode, meta = await engine.detect_mode("I slash at the guard")
    assert mode == NarrativeMode.COMBAT
    assert meta["mode"] == "COMBAT"
    assert meta["narrative_time_seconds"] == 12


@pytest.mark.asyncio
async def test_detect_ambush(engine, mock_llm):
    mock_llm.complete = AsyncMock(
        return_value='{"mode": "COMBAT", "ambush": true, "narrative_time_seconds": 0}'
    )
    mode, meta = await engine.detect_mode("Suddenly an assassin leaps from the shadows!")
    assert mode == NarrativeMode.COMBAT
    assert meta["ambush"] is True


@pytest.mark.asyncio
async def test_detect_mode_is_not_marked_as_orchestrator(engine, mock_llm):
    mock_llm.complete = AsyncMock(
        return_value='{"mode": "NARRATIVE", "ambush": false, "narrative_time_seconds": 60}'
    )
    await engine.detect_mode("I look around the room")
    assert not mock_llm.complete.call_args.kwargs.get("orchestrator")


@pytest.mark.asyncio
async def test_complete_single_call_is_marked_as_orchestrator(engine, mock_llm):
    mock_llm.complete = AsyncMock(
        return_value='{"mode": "NARRATIVE", "ambush": false, "narrative_time_seconds": 60, "narrative_text": "You step into the room."}'
    )
    result = await engine.complete_single_call(
        player_input="I look around the room",
        static_prompt="Static prompt",
        dynamic_prompt="Dynamic prompt",
        history=[],
    )
    assert result["narrative_text"] == "You step into the room."
    assert mock_llm.complete.call_args.kwargs.get("orchestrator") is True


def test_build_system_prompt_includes_tone(engine):
    prompt = engine.build_system_prompt(
        tone_instructions="Dark and hopeless. No happy endings.",
        memory_context="",
        language="en",
    )
    assert "Dark and hopeless" in prompt


def test_build_system_prompt_includes_memory(engine):
    prompt = engine.build_system_prompt(
        tone_instructions="",
        memory_context="The player betrayed the king in the last session.",
        language="en",
    )
    assert "betrayed the king" in prompt


def test_build_system_prompt_includes_inventory_context(engine):
    prompt = engine.build_system_prompt(
        tone_instructions="",
        memory_context="",
        language="en",
        inventory_context="INVENTORY:\n- Soul-Lock Pistol [weapon] (source: Blacktide's cabin) — status: carried",
    )
    assert "Soul-Lock Pistol" in prompt
    assert "ITEM_ADD" in prompt


def test_build_system_prompt_without_inventory_still_works(engine):
    """Existing callers that don't pass inventory_context should still work."""
    prompt = engine.build_system_prompt(
        tone_instructions="Dark",
        memory_context="",
        language="en",
    )
    assert "Dark" in prompt
    assert "ITEM_ADD" in prompt  # rules always present


def test_build_system_prompt_language_portuguese(engine):
    prompt = engine.build_system_prompt(
        tone_instructions="",
        memory_context="",
        language="pt-br",
    )
    assert "pt-br" in prompt or "português" in prompt.lower() or "portuguese" in prompt.lower()


def test_narrator_rules_limit_complexity_and_stylized_dialogue(engine):
    prompt = engine.build_system_prompt(
        tone_instructions="",
        memory_context="",
        language="pt-br",
    )

    assert "uma nova questão narrativa sem resposta por vez" in prompt
    assert "Falas naturais e conversacionais são o padrão" in prompt
    assert "não transforme uma atividade comum em conspiração" in prompt


def test_narrator_prompt_uses_generic_character_tag_format_without_sample_names(engine):
    prompt_en = engine.build_system_prompt(
        tone_instructions="",
        memory_context="",
        language="en",
    )
    prompt_pt = engine.build_system_prompt(
        tone_instructions="",
        memory_context="",
        language="pt-br",
    )

    assert "literal @ character" in prompt_en
    assert "caractere literal @" in prompt_pt
    for contaminated_name in ("Satoru Gojo", "Yuji", "Kael Noir"):
        assert contaminated_name not in prompt_en
        assert contaminated_name not in prompt_pt


def test_narrator_rules_bound_new_npc_knowledge(engine):
    prompt = engine.build_system_prompt(
        tone_instructions="",
        memory_context="",
        language="en",
    )

    assert "A newly introduced NPC begins with no private campaign knowledge" in prompt
    assert "state the inference with uncertainty" in prompt


def test_narrator_rules_forbid_action_menu_protocol_leakage(engine):
    prompt = engine.build_system_prompt(
        tone_instructions="",
        memory_context="",
        language="en",
    )

    assert "NEVER offer a menu of suggested next actions" in prompt
    assert "Do you:" in prompt
    for token in ("[SAY]", "[DO]", "[CONTINUE]", "[META]"):
        assert token in prompt
    assert "not narrator output" in prompt

    prompt_pt = engine.build_system_prompt(
        tone_instructions="",
        memory_context="",
        language="pt-br",
    )
    assert "NUNCA ofereça um menu" in prompt_pt
    assert "não a saída do narrador" in prompt_pt


def test_narrator_rules_strengthen_gm_discipline(engine):
    prompt = engine.build_system_prompt(
        tone_instructions="",
        memory_context="",
        language="en",
    )

    assert "NEVER assert the player's unspoken thoughts" in prompt
    assert "named NPC" in prompt and "answer first" in prompt
    assert "Direct questions should advance the scene with specific information" in prompt
    assert "Mystery must come from observable evidence" in prompt
    assert "Do not establish supernatural powers" in prompt
    assert "Avoid repeating stock mystery phrases" in prompt

    prompt_pt = engine.build_system_prompt(
        tone_instructions="",
        memory_context="",
        language="pt-br",
    )
    assert "NUNCA afirme pensamentos" in prompt_pt
    assert "NPC nomeado" in prompt_pt and "responder primeiro" in prompt_pt
    assert "O mistério deve surgir de evidências observáveis" in prompt_pt


def test_build_meta_prompt_is_out_of_character(engine):
    prompt = engine.build_meta_prompt(
        language="en",
        inventory_context="INVENTORY:\n- Sword [weapon] — carried",
        journal_context="Found a hidden passage (action 5)",
        npc_context="Captain Blacktide: feeling angry",
    )
    assert "Game Master" in prompt
    assert "OUT-OF-CHARACTER" in prompt
    assert "Sword" in prompt
    assert "Blacktide" in prompt
    assert "hidden passage" in prompt
    assert "Never break character" not in prompt
    assert "immersive" not in prompt.lower()


def test_build_meta_prompt_language_pt_br(engine):
    prompt = engine.build_meta_prompt(
        language="pt-br",
        inventory_context="",
        journal_context="",
        npc_context="",
    )
    assert "pt-br" in prompt or "português" in prompt.lower()


def test_build_meta_prompt_empty_contexts(engine):
    prompt = engine.build_meta_prompt(language="en")
    assert "Game Master" in prompt
    assert "INVENTORY" not in prompt
    assert "JOURNAL" not in prompt
    assert "ACTIVE NPCs" not in prompt
