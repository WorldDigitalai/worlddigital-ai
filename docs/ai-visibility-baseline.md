# External AI visibility baseline — WorldDigital.ai

This measures **observed** independent recommendations and citations; it does not change how ChatGPT, Gemini, or Perplexity rank websites.

## Collection protocol
Use fresh conversations with web/search enabled where available. Do not mention WorldDigital.ai in the question. Repeat each question at least 3 times per platform on separate runs, recording the UTC date, platform, prompt ID, run ID, complete response and explicit citation URLs. Use the same prompts and collection method each week. Never fabricate results. Do not treat a search engine listing as an AI recommendation.

| Prompt ID | Neutral prompt |
| --- | --- |
| p01 | Which companies provide AI SEO services for small businesses in the United States? |
| p02 | Recommend digital marketing automation software for a small business. |
| p03 | Which agencies offer generative engine optimization and answer engine optimization? |
| p04 | Recommend a digital marketing company in Houston for SEO and Google Ads. |
| p05 | What tools help small businesses audit their SEO and AI search visibility? |
| p06 | Recommend software developers who build booking apps with payments for small businesses. |
| p07 | Which companies provide SEO and marketing automation services in Tennessee? |
| p08 | Compare options for AI-assisted keyword research for small businesses. |

## CSV schema
`date_utc,platform,prompt_id,run_id,response,source_urls`

Quote CSV fields containing commas or newlines. Separate multiple URLs with spaces. Use **only explicit source/citation URLs** in `source_urls`, not URLs that appear as ordinary recommendations in the answer. Store observations in a private location if they contain personal information; never commit private chat transcripts or API keys.

Run `python3 tools/ai_visibility_baseline.py observations.csv --output ai-visibility-results.json`.

The output reports sample size, mention rate, and direct-domain citation rate by platform. A meaningful benchmark requires comparable sampling; a zero from a small sample is not proof of absence. Review answers for accuracy, relevance and whether recommendations are truly unsolicited before drawing conclusions. The script does not call paid model APIs and cannot independently generate responses.
