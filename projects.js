/*
 * All site content lives in this file.
 *
 * - window.SITE      : your name and contact links (used by the contact panel and footer).
 * - window.PROJECTS  : one object per project card. See README.md for every field.
 *
 * Every number below is a placeholder like "[X]%". Replace them with real results.
 */

window.SITE = {
  name: "Assar Grimlund",
  email: "you@example.com",
  github: "https://github.com/your-username",
  linkedin: "https://www.linkedin.com/in/your-handle",
};

window.PROJECTS = [
  {
    id: "backspace-token",
    name: "backspace-token",
    glyph: "⌫",
    color: "#FF7A59",
    accent2: "#FBBF24",
    kind: "LLM fine-tuning",
    status: "running",
    problem:
      "When a language model makes a mistake mid-answer, it either commits to the error or the whole answer has to be regenerated. This project gives the model a special token, ⟨bs:k⟩, that retracts its last k tokens. The mistake stays in context, so the model can see what it got wrong, and only the faulty span is rewritten. It is compared against regenerating the full answer.",
    kpis: [
      { value: "[X]%", label: "errors self-corrected" },
      { value: "[X]×", label: "fewer tokens than full regeneration" },
      { value: "[X] pp", label: "accuracy vs. baseline" },
    ],
    conclusion:
      "[Placeholder] One-sentence takeaway once results are in: does in-context retraction beat regenerating the whole answer, and at what cost?",
    stack: ["PyTorch", "Hugging Face", "LoRA", "PEFT", "Weights & Biases"],
    report: [
      { type: "heading", text: "Problem" },
      {
        type: "text",
        text:
          "Autoregressive models cannot take anything back. Once a wrong token is sampled, the rest of the answer is conditioned on it. The usual fix is to **detect** the error and **regenerate** the whole answer, which throws away the correct prefix and the information about what went wrong.",
      },
      { type: "heading", text: "Idea" },
      {
        type: "text",
        text:
          "Add a retraction token `⟨bs:k⟩` to the vocabulary. When the model emits it, the last k tokens are struck from the visible answer but stay in the context window, so the model conditions on its own mistake while writing the correction.",
      },
      {
        type: "tokenSample",
        label: "Sample output",
        text: "The capital of Australia is ~~Sydney~~ ⟨bs:3⟩ Canberra, which was chosen as a compromise between Sydney and Melbourne.",
      },
      { type: "heading", text: "Method" },
      {
        type: "list",
        items: [
          "Build a dataset of answers with injected errors followed by ⟨bs:k⟩ and the correction.",
          "Fine-tune a [X]B-parameter model with LoRA on the mixed data.",
          "Evaluate on held-out questions against two baselines: no correction, and detect + regenerate.",
          "Measure accuracy, tokens generated, and how often the model retracts a correct span.",
        ],
      },
      {
        type: "kpis",
        items: [
          { value: "[X]%", label: "errors self-corrected" },
          { value: "[X]×", label: "fewer tokens" },
          { value: "[X]%", label: "false retractions" },
        ],
      },
      { type: "heading", text: "Results" },
      {
        type: "table",
        columns: ["Method", "Accuracy", "Tokens / answer", "False retractions"],
        rows: [
          ["Baseline", "[X]%", "[X]", "n/a"],
          ["Detect + regenerate", "[X]%", "[X]", "n/a"],
          ["backspace-token", "[X]%", "[X]", "[X]%"],
        ],
        highlight: 2,
      },
      {
        type: "image",
        src: "",
        alt: "Accuracy against retraction length k",
        caption: "Figure 1. Accuracy against retraction length k. (Placeholder: add an image path in projects.js.)",
      },
      { type: "heading", text: "Retraction at decode time" },
      {
        type: "code",
        lang: "python",
        code:
          "if token_id == BS_TOKEN:\n    k = parse_k(next_tokens)\n    visible = visible[:-k]          # strike from the answer\n    # context keeps the retracted span, so the model sees its mistake\n    context.append(token_id)",
      },
      {
        type: "callout",
        label: "Verdict",
        text: "[Placeholder] Fill in once experiments finish. Keep it to one or two sentences.",
      },
    ],
  },

  {
    id: "tax-rag",
    name: "tax-rag",
    glyph: "§",
    color: "#2DD4BF",
    accent2: "#60A5FA",
    kind: "Retrieval-augmented generation",
    status: "planned",
    problem:
      "Swedish tax rules are spread across thousands of pages of Skatteverket guidance, and general-purpose chatbots answer confidently without saying where the answer comes from. This project builds an assistant that answers Swedish tax questions only from Skatteverket's published guidance and cites the exact passage for every claim.",
    kpis: [
      { value: "[X]%", label: "correct answers on held-out questions" },
      { value: "[X]%", label: "answers with a valid citation" },
      { value: "[X] s", label: "median response time" },
    ],
    conclusion:
      "[Placeholder] Takeaway once evaluated: how often citations actually support the answer, and where retrieval fails.",
    stack: ["Python", "Embeddings", "BM25", "Reranker", "FastAPI"],
    report: [
      { type: "heading", text: "Problem" },
      {
        type: "text",
        text:
          "Tax questions need answers that can be checked. An answer without a source is not useful to someone filing a return.",
      },
      { type: "heading", text: "Pipeline" },
      {
        type: "list",
        ordered: true,
        items: [
          "Scrape and chunk Skatteverket guidance, keeping section ids.",
          "Hybrid retrieval: BM25 plus dense embeddings, then a reranker.",
          "Generate an answer constrained to the retrieved passages, with inline citations.",
          "Refuse when no passage supports an answer.",
        ],
      },
      {
        type: "table",
        columns: ["Setup", "Accuracy", "Citation precision"],
        rows: [
          ["LLM, no retrieval", "[X]%", "n/a"],
          ["Dense retrieval", "[X]%", "[X]%"],
          ["Hybrid + rerank", "[X]%", "[X]%"],
        ],
        highlight: 2,
      },
      {
        type: "callout",
        label: "Verdict",
        text: "[Placeholder] Summarise the result here.",
      },
    ],
  },

  {
    id: "david-goliath",
    name: "david-goliath",
    glyph: "◇",
    color: "#A78BFA",
    accent2: "#F472B6",
    kind: "Model auditing",
    status: "planned",
    problem:
      "Auditing large models for bias usually needs large models or many human raters. This project asks whether a small model can audit a much larger open-weight model: generating probes, scoring the answers, and surfacing systematic bias that humans then confirm.",
    kpis: [
      { value: "[X]", label: "bias probes generated" },
      { value: "[X]%", label: "agreement with human raters" },
      { value: "[X]×", label: "size ratio, auditor vs. audited" },
    ],
    conclusion:
      "[Placeholder] Takeaway once evaluated: can the small auditor find what humans find, and what does it miss?",
    stack: ["PyTorch", "vLLM", "Open-weight LLMs", "Pandas"],
    report: [
      { type: "heading", text: "Question" },
      {
        type: "text",
        text: "Can a model [X]× smaller than its target reliably find the target's biases?",
      },
      {
        type: "list",
        items: [
          "Auditor generates paired prompts that differ only in a protected attribute.",
          "Target model answers both; auditor scores the difference.",
          "A human-labelled subset measures auditor agreement.",
        ],
      },
      {
        type: "callout",
        label: "Status",
        text: "Planned. No results yet.",
      },
    ],
  },

  {
    id: "work-capture",
    name: "work-capture",
    glyph: "◎",
    color: "#60A5FA",
    accent2: "#2DD4BF",
    kind: "Activity understanding",
    status: "idea",
    problem:
      "Most knowledge about how work actually gets done is never written down. This project turns screen activity into a map of how work is done: which tools are used, in what order, and where time goes, so recurring workflows can be documented or automated.",
    kpis: [
      { value: "[X]", label: "workflows identified" },
      { value: "[X]%", label: "steps labelled correctly" },
      { value: "[X] h", label: "screen time analysed" },
    ],
    conclusion: "[Placeholder] Idea stage. Add a takeaway once there is a prototype.",
    stack: ["Vision-language models", "Python", "Graph analysis"],
    // No `report` field: the "Read full report" button is hidden for this project.
  },
];
