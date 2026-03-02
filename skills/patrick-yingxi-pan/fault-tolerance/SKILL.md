---
name: fault-tolerance
description: Building fault-tolerant systems with checkpointing, WAL, idempotency, and crash recovery. Use when systems need to survive crashes, handle retries safely, or recover from failures without data loss.
---

# Fault Tolerance

Patterns and practices for building resilient systems that can fail gracefully and recover reliably.

## Core Principles

### Fail Fast, Recover Well

- Detect errors early
- Log enough context to diagnose
- Provide clear recovery paths

### Idempotency First

Every operation should be safely retryable without causing duplicates or side effects.

### Checkpoints > Atomicity

For long-running operations, save progress at checkpoints rather than trying to make everything atomic.

## Fault Tolerance Patterns

### 1. Idempotency

Make operations safe to retry multiple times.

**Key Patterns:**

- **Idempotency Keys**: Generate unique keys from input parameters
- **Result Caching**: Store and return previous results for same inputs
- **Deduplication Checks**: Verify existence before creating

**Example - Idempotency Key Generation:**

```typescript
function generateIdempotencyKey(...inputs: (string | number | object)[]): string {
  const hash = crypto.createHash("sha256");
  for (const input of inputs) {
    hash.update(
      typeof input === "object" ? JSON.stringify(input, Object.keys(input).sort()) : String(input),
    );
  }
  return hash.digest("hex");
}
```

**Example - Idempotent Decorator:**

```typescript
function idempotent<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string,
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator ? keyGenerator(...args) : generateIdempotencyKey(fn.name, ...args);

    const cached = idempotencyCache.get(key);
    if (cached !== null) return cached as ReturnType<T>;

    const result = fn(...args);
    idempotencyCache.set(key, result);
    return result;
  };
}
```

### 2. Checkpointing

Save progress at meaningful intervals so work can resume after interruptions.

**Checkpoint Strategy:**

- **Named Checkpoints**: Save at logical milestones ("started", "processed-100-items", "completed")
- **Data In Checkpoints**: Store enough state to resume without reprocessing
- **Checkpoint Cleanup**: Keep only recent checkpoints (e.g., last 10)

**Example - Checkpoint Service:**

```typescript
class CheckpointService {
  async saveCheckpoint(taskId: string, name: string, data: CheckpointData) { ... }
  async getLatestCheckpoint(taskId: string) { ... }
  async getCheckpointByName(taskId: string, name: string) { ... }
  async cleanupOldCheckpoints(taskId: string, keepLatest = 10) { ... }
}
```

### 3. Write-Ahead Logging (WAL)

Log operations before executing them to enable recovery.

**WAL States:**

- **PENDING**: Operation logged but not executed
- **EXECUTED**: Operation completed successfully
- **ROLLED_BACK**: Operation failed and was reverted

**WAL Workflow:**

1. Log the operation with `beforeState`
2. Execute the operation
3. Log `afterState` and mark as EXECUTED
4. On failure, mark as ROLLED_BACK and revert

**Example - WAL Service:**

```typescript
class WALService {
  async beginOperation<T>(operation: Operation<T>): Promise<string> { ... }
  async commitOperation(operationId: string): Promise<boolean> { ... }
  async rollbackOperation(operationId: string): Promise<boolean> { ... }
  async executeWithWAL<T>(operation: Operation, fn: () => Promise<T>): Promise<T> { ... }
}
```

### 4. State Machine Task Management

Model long-running tasks as explicit state machines with valid transitions.

**Typical States:**

- `PENDING` → `RUNNING` or `PAUSED`
- `RUNNING` → `PAUSED`, `COMPLETED`, or `FAILED`
- `PAUSED` → `RUNNING` or `FAILED`
- `COMPLETED` / `FAILED` → Terminal states

**State Machine Benefits:**

- Validates only legal transitions
- Clear visibility into task lifecycle
- Enables pause/resume semantics

**Example - Task Service:**

```typescript
class TaskService {
  private VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
    PENDING: ["RUNNING", "PAUSED"],
    RUNNING: ["PAUSED", "COMPLETED", "FAILED"],
    PAUSED: ["RUNNING", "FAILED"],
    COMPLETED: [],
    FAILED: [],
  };

  async updateTaskStatus(taskId: string, newStatus: TaskStatus) {
    const currentTask = await this.getTask(taskId);
    if (!this.VALID_TRANSITIONS[currentTask.status].includes(newStatus)) {
      throw new Error(`Invalid transition: ${currentTask.status} → ${newStatus}`);
    }
    return prisma.task.update({ where: { id: taskId }, data: { status: newStatus } });
  }
}
```

### 5. Crash Recovery

Automatically recover from system restarts.

**Recovery Workflow:**

1. **Process Pending WAL**: Determine if pending operations actually executed
2. **Recover Interrupted Tasks**: Mark tasks stuck in `RUNNING`/`PAUSED` as `FAILED` with recovery info
3. **Cleanup Stale Data**: Remove old logs and temporary files

**Example - Recovery Service:**

```typescript
class RecoveryService {
  async runStartupRecovery(): Promise<RecoveryResult> {
    const result = { tasksRecovered: 0, walOperationsProcessed: 0, errors: [] };
    await this.processPendingWAL(result);
    await this.recoverInterruptedTasks(result);
    await this.cleanupStaleData(result);
    return result;
  }
}
```

### 6. Safe File Operations

Use tmp→rename pattern for atomic file writes with checksum verification.

**Safe Write Pattern:**

1. Write to temporary file
2. Verify checksum
3. Atomic rename to final location
4. Verify final file

**Example - File Service:**

```typescript
class FileService {
  async writeFile(filePath: string, data: Buffer | string): Promise<FileWriteResult> {
    const tmpPath = path.join(this.tmpDir, `${path.basename(filePath)}.tmp.${crypto.randomUUID()}`);
    try {
      const checksum = this.calculateChecksum(data);
      await fs.promises.writeFile(tmpPath, data);

      const tmpChecksum = await this.calculateFileChecksum(tmpPath);
      if (tmpChecksum !== checksum) throw new Error('Checksum mismatch');

      await fs.promises.rename(tmpPath, filePath);
      const finalChecksum = await this.calculateFileChecksum(filePath);

      return { success: finalChecksum === checksum, filePath, checksum: finalChecksum, ... };
    } finally {
      await fs.promises.unlink(tmpPath).catch(() => {});
    }
  }
}
```

## Implementation Checklist

When building a fault-tolerant system:

1. **Idempotency** - Can every operation be safely retried?
2. **Checkpoints** - Are progress checkpoints saved at meaningful intervals?
3. **WAL** - Are critical operations logged before execution?
4. **State Machine** - Are task states explicit with valid transitions?
5. **Crash Recovery** - Is there a startup recovery process?
6. **Safe Files** - Are file operations atomic with verification?

## Example: Tina Design Platform Fault Tolerance

- **Idempotency**: File uploads deduplicated by SHA-256 checksum
- **Checkpoints**: Task progress saved at milestones
- **WAL**: Critical operations logged before execution
- **State Machine**: Tasks with PENDING→RUNNING→COMPLETED/FAILED flow
- **Recovery**: Startup recovery for interrupted tasks and pending WAL
- **Safe Files**: tmp→rename pattern with checksum verification
