---
name: multi-agent-dispatch
description: Coordinating parallel subagent execution on large projects. Use when breaking down large projects into independent tasks that can be executed in parallel by multiple subagents.
---

# Multi-Agent Dispatch

Systematic approach to breaking down and coordinating parallel subagent execution for large projects.

## Core Principles

### Divide and Conquer

Break large tasks into smaller, independent units of work.

### Independent Execution

Tasks that don't share state can run in parallel.

### Clear Boundaries

Each subagent has one clear responsibility with well-defined inputs and outputs.

### Result Aggregation

Combine parallel results into a coherent final output.

## When to Use

\*\*Good candidates for parallel dispatch:

- Large document processing (many independent files)
- Batch operations on collections
- Independent sections of a large project
- Tasks that don't need to share state during execution

\*\*Bad candidates (sequential instead:

- Tasks with strong dependencies
- Shared mutable state
- Sequential pipelines where each step needs previous output
- Small, fast tasks (coordination overhead > benefit

## Multi-Agent Patterns

### 1. Task Decomposition

\*\*Step 1: Analyze the Task

- Can it be broken into independent sub-tasks?
- Do sub-tasks need to communicate?
- What are the inputs/outputs?

\*\*Step 2: Define Sub-Task Boundaries
Each sub-task should have:

- Clear, single purpose
- Well-defined inputs
- Well-defined outputs
- No dependencies on other sub-tasks (or minimal, well-managed dependencies

\*\*Step 3: Create Dispatch Plan
Map sub-tasks to agents, define:

- What each agent will do
- Inputs for each
- Expected outputs
- How results will be combined

### 2. Parallel Execution Models

#### Model A: Embarrassingly Parallel

All sub-tasks are completely independent.

```
Main Task
├── Sub-agent 1 → Task A → Result A
├── Sub-agent 2 → Task B → Result B
├── Sub-agent 3 → Task C → Result C
└── ...
```

**Use when**: Processing a directory of 100 files: each file is independent.

#### Model B: Map-Reduce

1. **Map**: Break into parallel tasks
2. **Reduce**: Combine results

```
Main Task
├── Map Phase (parallel)
│   ├── Sub-agent 1 → Map Task 1 → Intermediate 1
│   ├── Sub-agent 2 → Map Task 2 → Intermediate 2
│   └── ...
└── Reduce Phase (sequential)
    └── Main Agent → Combine Intermediates → Final Result
```

**Use when**: Analyzing many items then synthesizing a summary.

#### Model C: Pipeline with Parallel Stages

Each pipeline, some stages parallel.

```
Stage 1 (Sequential)
    ↓
Stage 2 (Parallel: Sub-agents A, B, C
    ↓
Stage 3 (Sequential)
```

**Use when**: Fetch → Process (parallel) → Save.

### 3. Result Aggregation

\*\*Strategies for combining parallel results:

**Strategy 1: Concatenation**

- Combine sequentially (e.g., documents, logs
- Simple but requires consistent formats

**Strategy 2: Merge**

- Combine into structured object
- Good for key-value data

**Strategy 3: Summary Synthesis**

- Read all parallel results
- Synthesize coherent summary
- Use AI for synthesis

**Example - Aggregation:**

```typescript
async function aggregateResults(taskResults: TaskResult[]): Promise<FinalResult> {
  // 1. Validate all results
  const successful = taskResults.filter(r => r.success);
  const errors = taskResults.filter(r => !r.success);

  if (errors.length > 0) {
    console.warn(`Some tasks failed: ${errors.length}/${taskResults.length}`);
  }

  // 2. Combine according to task type
  if (taskType === 'document-processing') {
    return {
      type: 'combined',
      documents: successful.map(r => r.output),
      summary: await synthesizeSummary(successful.map(r => r.output))
    };
  }

  // 3. Generate final summary
  return { ... };
}
```

### 4. Coordination & Tracking

\*\*Track for each dispatched task:

- Status (pending/running/completed/failed)
- Start/end times
- Outputs/errors
- Progress updates

**Example - Task Tracker:**

```typescript
interface DispatchedTask {
  id: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt?: Date;
  completedAt?: Date;
  output?: unknown;
  error?: string;
}

class TaskTracker {
  private tasks = new Map<string, DispatchedTask>();

  createTask(description: string): string {
    const id = crypto.randomUUID();
    this.tasks.set(id, { id, description, status: "pending" });
    return id;
  }

  updateStatus(id: string, status: DispatchedTask["status"], update?: Partial<DispatchedTask>) {
    const task = this.tasks.get(id);
    if (!task) throw new Error(`Task ${id} not found`);

    this.tasks.set(id, {
      ...task,
      status,
      ...update,
      startedAt: status === "running" ? new Date() : task.startedAt,
      completedAt: status === "completed" || status === "failed" ? new Date() : task.completedAt,
    });
  }

  getStatus(): DispatchedTask[] {
    return Array.from(this.tasks.values());
  }
}
```

### 5. Error Handling & Recovery

\*\*Error Handling Strategies:

\*\*Strategy 1: Fail-Fast with Report

- First error stops everything
- Good for critical dependencies
- Fast feedback

\*\*Strategy 2: Continue-on-Error

- Individual failures don't stop others
- Log and continue
- Good for independent tasks

\*\*Strategy 3: Retry Failed Tasks

- Retry with backoff
- Good for transient failures
- Max retries limit

\*\*Strategy 4: Partial Result

- Combine successful tasks
- Report failures
- Good for batch processing

**Example - Error-Aware Dispatch:**

```typescript
async function dispatchWithErrorHandling(
  tasks: SubagentTask[],
  strategy: "fail-fast" | "continue" | "retry",
) {
  const results: TaskResult[] = [];
  const tracker = new TaskTracker();

  for (const task of tasks) {
    const taskId = tracker.createTask(task.description);
    try {
      tracker.updateStatus(taskId, "running");

      let result;
      let attempts = 0;
      const maxAttempts = strategy === "retry" ? 3 : 1;

      while (attempts < maxAttempts) {
        try {
          result = await executeSubagent(task);
          break;
        } catch (err) {
          attempts++;
          if (attempts >= maxAttempts) throw err;
          await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempts)));
        }
      }

      tracker.updateStatus(taskId, "completed", { output: result });
      results.push({ success: true, output: result, taskId });
    } catch (error) {
      tracker.updateStatus(taskId, "failed", { error: String(error) });
      results.push({ success: false, error: String(error), taskId });

      if (strategy === "fail-fast") {
        throw new Error(`Task ${taskId} failed, aborting: ${error}`);
      }
    }
  }

  return { results, status: tracker.getStatus() };
}
```

## Dispatch Workflow

### Complete Workflow

**1. Decompose**

- Break main task → sub-tasks
- Verify no dependencies

**2. Plan**

- Define each sub-task
- Inputs/outputs
- Execution order

**3. Dispatch**

- Spawn subagents
- Track progress

**4. Monitor**

- Check status
- Handle errors
- Retries if needed

**5. Aggregate**

- Collect results
- Handle failures
- Synthesize final output

**6. Report**

- Summary
- Success/failures
- Next steps

## Best Practices

\*\*1. Keep Sub-Tasks Small but Meaningful

- Not too tiny (coordination overhead)
- Not too large (miss parallelism)

\*\*2. Clear Contracts

- Well-defined inputs/outputs
- No hidden side effects

\*\*3. Good Logging

- Each subagent should log what it's doing
- Main agent aggregates logs

\*\*4. Progress Updates

- Periodic check-ins
- Visibility into what's happening

\*\*5. Idempotent Operations

- If a sub-task fails, can safely retry?
- Design for re-runs

## Example: Tina Design Platform Multi-Agent Dispatch

- **Decomposition**: Each design case processed independently
- **Parallel**: Cases processed simultaneously
- **Aggregation**: Results combined into final collection
- **Error Handling**: Continue-on-error with detailed error reporting
- **Tracking**: Full visibility into all subagent status
