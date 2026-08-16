from app.engines.llm_router import LLMConfig, LLMProvider


def test_llm_config_defaults_to_local_openai_compatible_model(monkeypatch):
    monkeypatch.delenv("LUNAR_DEFAULT_PROVIDER", raising=False)
    monkeypatch.delenv("LUNAR_DEFAULT_MODEL", raising=False)
    config = LLMConfig()
    assert config.primary_provider == LLMProvider.OPENAI
    assert config.primary_model == "undi95_-_llama-3-roleplay-8b-evo"


def test_llm_config_honors_environment_defaults(monkeypatch):
    monkeypatch.setenv("LUNAR_DEFAULT_PROVIDER", "deepseek")
    monkeypatch.setenv("LUNAR_DEFAULT_MODEL", "custom-local-model")
    config = LLMConfig()
    assert config.primary_provider == LLMProvider.DEEPSEEK
    assert config.primary_model == "custom-local-model"
