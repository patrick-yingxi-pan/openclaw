---
name: ai-content-extraction
description: AI-assisted content extraction from diverse sources (web pages, documents, images, PDFs). Use when extracting structured data from unstructured sources, web crawling, or document processing.
---

# AI Content Extraction

Systematic approach to extracting structured data from unstructured sources using AI assistance.

## Core Principles

### Source Agnostic

Extract from any source with a consistent interface.

### Structured Output

Always extract to well-defined schemas, not free text.

### Progressive Refinement

Extract → Validate → Refine → Repeat.

### Fallback Chains

When one method fails, try the next one in sequence.

## Extraction Patterns

### 1. Source Types & Extractors

| Source Type    | Tools/Methods                                   |
| -------------- | ----------------------------------------------- |
| **Web Pages**  | Playwright, Cheerio, Puppeteer, crawlee         |
| **PDFs**       | pdfplumber, PyPDF2, pdf.js                      |
| **Images**     | Vision LLMs (GPT-4V, Claude 3), OCR (Tesseract) |
| **Documents**  | docx, unstructured, llama-index                 |
| **Structured** | CSV, JSON, XML parsers                          |

### 2. Extraction Pipeline

```
Input Source → Fetch/Raw → Parse → AI Extraction → Validation → Structured Output
```

**Pipeline Stages:**

1. **Fetch**: Retrieve content from source (HTTP request, file read)
2. **Parse**: Convert to intermediate format (HTML, text, image)
3. **Extract**: Use AI to pull structured data
4. **Validate**: Verify completeness and correctness
5. **Persist**: Store to database

### 3. AI Extraction Patterns

#### Pattern A: Schema-Driven Extraction

Define a schema, ask AI to populate it.

**Example - Extraction Prompt:**

```
Extract information from the following content into this JSON schema:

{
  "title": "string (required)",
  "description": "string (optional)",
  "date": "ISO date string (YYYY-MM-DD, optional)",
  "tags": "array of strings",
  "entities": {
    "people": ["array of names"],
    "locations": ["array of places"],
    "organizations": ["array of orgs"]
  }
}

Content to extract from:
[CONTENT HERE]

Return ONLY valid JSON, no other text.
```

#### Pattern B: Progressive Extraction

Extract in multiple passes with increasing specificity.

**Pass 1**: Quick overview and document type classification
**Pass 2**: Extract high-level structure (sections, headings)
**Pass 3**: Extract detailed content from each section

#### Pattern C: Validation-First

Define validation rules before extraction, validate output against them.

**Validation Rules:**

- Required fields must be present
- Dates must be valid ISO format
- URLs must be reachable (optional)
- Numeric fields within expected ranges
- Enum values must match allowed options

**Example - Validation:**

```typescript
function validateExtractedData(
  data: unknown,
  schema: ZodSchema,
): { valid: boolean; errors: string[] } {
  const result = schema.safeParse(data);
  if (result.success) return { valid: true, errors: [] };

  return {
    valid: false,
    errors: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
  };
}
```

### 4. Web Crawling Architecture

**Crawler Components:**

- **Queue**: URLs to visit
- **Fetcher**: Download pages
- **Parser**: Extract links and content
- **Extractor**: AI-powered content extraction
- **Store**: Persist results
- **Deduplicator**: Avoid revisiting URLs

**Respectful Crawling:**

- Obey `robots.txt`
- Rate limiting (delay between requests)
- User agent identification
- Avoid crawling during peak hours
- Respect `Crawl-Delay` directives

**Example - Crawler State Tracking:**

```typescript
interface CrawlTask {
  id: string;
  url: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  depth: number;
  retries: number;
  lastError?: string;
}

async function crawlUrl(task: CrawlTask) {
  try {
    const page = await fetchPage(task.url);
    const links = extractLinks(page);
    const content = await extractContentWithAI(page);

    await saveResults(task.id, content);
    await enqueueNewUrls(links, task.depth + 1);

    return { success: true, content };
  } catch (error) {
    if (task.retries < 3) {
      return scheduleRetry(task);
    }
    return { success: false, error };
  }
}
```

### 5. Handling Diverse Content Types

**Images (Vision Models):**

```
Analyze this image and extract:
- Main subject(s)
- Text visible in image (OCR)
- Style/genre
- Color palette
- Any people, objects, or scenes depicted
```

**PDF Documents:**

1. Extract raw text
2. Identify sections and structure
3. Extract tables (if any)
4. AI-assisted semantic extraction

**Web Pages:**

1. Remove boilerplate (ads, navigation, footers)
2. Extract main content
3. Extract metadata (title, OG tags)
4. AI extraction on cleaned content

### 6. Error Handling & Retries

**Retry Strategy:**

- **Transient errors**: Retry with exponential backoff
- **Permanent errors**: Fail fast, log, move on
- **Rate limiting**: Respect `Retry-After` headers
- **Circuit breakers**: Stop hammering failing endpoints

**Example - Retry with Backoff:**

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries - 1) {
        const delayMs = baseDelayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}
```

## Extraction Quality Assurance

### 1. Confidence Scoring

Ask AI to provide confidence levels for each extracted field:

```json
{
  "data": { ... },
  "confidence": {
    "title": 0.98,
    "date": 0.65,
    "description": 0.90
  }
}
```

### 2. Cross-Validation

Extract the same content using multiple methods and compare results.

### 3. Human-in-the-Loop

Flag low-confidence extractions for human review.

## Implementation Checklist

For AI content extraction systems:

1. **Schema Definition** - Is output structured with clear schemas?
2. **Source Diversity** - Can it handle multiple source types?
3. **Validation** - Is output validated against rules?
4. **Retries** - Are transient errors handled with retries?
5. **Crawl Etiquette** - Are robots.txt and rate limits respected?
6. **Quality Checks** - Is there confidence scoring or validation?

## Example: Tina Design Platform Content Extraction

- **Sources**: Web pages, design portfolios, image galleries
- **Extractors**: Web crawler + vision AI for images
- **Output**: Structured design case metadata
- **Validation**: Schema validation with Zod
- **Quality**: Confidence scoring on extracted fields
