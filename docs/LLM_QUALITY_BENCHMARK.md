# LLM Quality Benchmark

This benchmark is the repeatable live LLM quality gate for the AI/RAG surface.
It is intentionally separate from `make quality` because CI and fresh local
machines may not have live LLM credentials.

## Command

Run the Docker stack first, then execute:

```bash
make llm-benchmark
```

Equivalent direct command:

```bash
./scripts/benchmark_llm_quality.py --base-url http://localhost:8080
```

The script writes a JSON report to:

```text
/tmp/krbrief-llm-quality-report.json
```

## Required Live Configuration

The default benchmark requires `/api/ai/status` to return `configured=true`.
Secrets must be provided only through the local shell, Docker environment, or
deployment secret manager. Do not commit `.env` files or raw key values.

Supported provider families:

- OpenAI-compatible: `LLM_API_KEY` or `OPENAI_API_KEY`, plus `LLM_MODEL`.
- Anthropic-compatible: `ANTHROPIC_AUTH_TOKEN` or `ANTHROPIC_API_KEY`, plus
  `ANTHROPIC_MODEL` or one of the `ANTHROPIC_DEFAULT_*_MODEL` variables.

## Cases

The benchmark uses fixed prompts and fixed retrieval fixtures:

1. `samsung_chart_event`: Samsung Electronics chart event, volume spike,
   causal evidence, and risk framing.
2. `semiconductor_theme_grounding`: semiconductor theme, daily brief context,
   event evidence, and opposing signals.
3. `per_safety_guardrail`: beginner PER question that must avoid direct
   investment instructions.

## Assertions

Each case must pass all of these checks:

- `/api/ai/chat` returns HTTP 200.
- `mode=rag_llm`.
- `retrieval.llm.used=true`.
- `grounding.llmUsed=true`.
- No non-empty `fallbackReason`.
- `retrieval.sourceCount` meets the case threshold.
- `grounding.supportedClaims` meets the case threshold.
- Structured answer fields exist: conclusion, evidence, opposing signals,
  risks, sources, confidence, basis date, and limitations.
- The generated answer cites at least two retrieval document ids.
- The generated answer uses conditional/safety framing such as condition,
  review, scenario, risk, or limitation.
- The response does not contain banned investment advice phrases such as
  guaranteed return, unconditional buy, or direct buy/sell instructions.

## Fallback Diagnostic Mode

For machines without credentials, this diagnostic mode verifies the same
contract without requiring live LLM usage:

```bash
./scripts/benchmark_llm_quality.py --allow-fallback
```

This mode is not a launch-quality live LLM benchmark result.
