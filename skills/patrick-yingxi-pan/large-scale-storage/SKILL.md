---
name: large-scale-storage
description: Managing large-scale file storage with hash-based bucketing, tiered storage, and file integrity verification. Use when storing many files (10k+), optimizing storage costs, or ensuring data integrity.
---

# Large-Scale Storage

Patterns for managing file storage at scale with integrity, performance, and cost efficiency.

## Core Principles

### Flat Namespace via Hashing

Avoid directory hierarchy limits by using content hashes for file naming.

### Deduplication First

Store identical content only once, reference it multiple times.

### Integrity > Speed

Verify checksums on write and read to prevent silent data corruption.

### Tier for Cost/Performance

Match storage tier to access frequency: hot (fast/expensive) → warm (slower/cheaper) → cold (slowest/cheapest).

## Storage Patterns

### 1. Hash-Based Bucketing

Distribute files across directories to avoid filesystem limits.

**How it works:**

1. Compute content hash (SHA-256, MD5)
2. Split hash into 2-character segments
3. Create directory structure from segments
4. Store file with full hash as filename

**Example - Bucket Path Generation:**

```typescript
function getBucketPath(checksum: string, depth: number = 4): string {
  const buckets: string[] = [];
  for (let i = 0; i < depth; i++) {
    buckets.push(checksum.slice(i * 2, i * 2 + 2));
  }
  return buckets.join(path.sep);
}

// Example: SHA-256 "a1b2c3d4e5f6..." → "a1/b2/c3/d4/a1b2c3d4e5f6..."
```

**Why this works:**

- Even distribution across buckets
- Prevents single directories with millions of files
- Works with any filesystem
- Predictable path from content hash

**Recommended Parameters:**

- **Hash algorithm**: SHA-256 (collision-resistant)
- **Bucket depth**: 4 (balances depth vs. directory count)
- **Bucket size**: 2 characters (16²=256 per level)

### 2. Content-Addressable Storage (CAS)

Store files by their content hash, enabling automatic deduplication.

**CAS Workflow:**

1. Compute hash of incoming file
2. Check if hash already exists in database
3. If exists: return existing file reference (skip upload)
4. If not exists: store file and create database record

**Example - Deduplicated Upload:**

```typescript
async uploadFile(caseId: string, filePath: string, fileType: MediaFileType) {
  // 1. Calculate checksum
  const checksum = await calculateChecksum(filePath);

  // 2. Check for existing file
  const existingFile = await prisma.mediaFile.findFirst({ where: { checksum } });
  if (existingFile) {
    return { existing: true, file: existingFile }; // Deduplicated!
  }

  // 3. Store new file
  const bucketPath = getBucketPath(checksum);
  const fileName = `${checksum}${path.extname(filePath)}`;
  const hotDir = path.join(HOT_STORAGE_PATH, bucketPath);
  fs.mkdirSync(hotDir, { recursive: true });

  // ... store file ...

  return { existing: false, file: mediaFile };
}
```

**Benefits:**

- No duplicate storage
- Instant duplicate detection
- Immutable files (content hash = identity)

### 3. Tiered Storage

Move data between storage tiers based on access frequency.

**Typical Tiers:**

| Tier     | Speed  | Cost   | Use Case                           |
| -------- | ------ | ------ | ---------------------------------- |
| **Hot**  | Fast   | High   | Frequently accessed (last 30 days) |
| **Warm** | Medium | Medium | Occasional access (30-90 days)     |
| **Cold** | Slow   | Low    | Archive (>90 days)                 |

**Tiered Storage Operations:**

**Archive to Warm Storage:**

```typescript
async moveToWarmStorage(mediaFileId: string): Promise<void> {
  const mediaFile = await prisma.mediaFile.findUniqueOrThrow({ where: { id: mediaFileId } });
  const hotPath = path.join(HOT_STORAGE_PATH, mediaFile.filePath);
  const warmPath = path.join(WARM_STORAGE_PATH, mediaFile.filePath);

  if (!fs.existsSync(hotPath)) return;

  const warmDir = path.dirname(warmPath);
  if (!fs.existsSync(warmDir)) fs.mkdirSync(warmDir, { recursive: true });

  fs.renameSync(hotPath, warmPath);

  await prisma.mediaFile.update({
    where: { id: mediaFileId },
    data: { status: MediaFileStatus.ARCHIVED }
  });
}
```

**Promote Back to Hot:**

```typescript
async downloadFile(mediaFileId: string): Promise<{ path: string; fileName: string }> {
  const mediaFile = await prisma.mediaFile.findUniqueOrThrow({ where: { id: mediaFileId } });

  let fullPath = path.join(HOT_STORAGE_PATH, mediaFile.filePath);
  if (!fs.existsSync(fullPath)) {
    fullPath = path.join(WARM_STORAGE_PATH, mediaFile.filePath);
    if (!fs.existsSync(fullPath)) throw new Error('File not found');

    // Optional: Promote back to hot on access
    await this.moveToHotStorage(mediaFile);
  }

  return { path: fullPath, fileName: path.basename(mediaFile.filePath) };
}
```

**Automated Tier Management:**

```typescript
async runTieredStorageCleanup(): Promise<{ moved: number }> {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const oldFiles = await prisma.mediaFile.findMany({
    where: { status: MediaFileStatus.ACTIVE, createdAt: { lt: oneMonthAgo } }
  });

  let movedCount = 0;
  for (const file of oldFiles) {
    await this.moveToWarmStorage(file.id);
    movedCount++;
  }

  return { moved: movedCount };
}
```

### 4. File Integrity Verification

Verify data hasn't been corrupted or tampered with.

**Checksum Calculation:**

```typescript
async calculateFileChecksum(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('error', reject);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}
```

**Verification on Read:**

```typescript
async validateFile(filePath: string, expectedChecksum: string): Promise<FileValidationResult> {
  const actualChecksum = await this.calculateFileChecksum(filePath);
  const stats = await fs.promises.stat(filePath);

  return {
    valid: actualChecksum === expectedChecksum,
    actualChecksum,
    expectedChecksum,
    fileSize: stats.size
  };
}
```

### 5. Thumbnail & Derivative Storage

Store processed derivatives alongside originals.

**Pattern:**

- Original files: `hot/a1/b2/c3/d4/a1b2c3d4...webp`
- Thumbnails: `thumbnails/a1/b2/c3/d4/a1b2c3d4..._thumb.webp`
- Other derivatives: Same bucket structure, different prefix

**Example - Thumbnail Generation:**

```typescript
async generateThumbnail(imagePath: string, checksum: string): Promise<string> {
  const bucketPath = getBucketPath(checksum);
  const thumbnailDir = path.join(THUMBNAIL_STORAGE_PATH, bucketPath);

  if (!fs.existsSync(thumbnailDir)) {
    fs.mkdirSync(thumbnailDir, { recursive: true });
  }

  const thumbnailFileName = `${checksum}_thumb.webp`;
  const thumbnailPath = path.join(thumbnailDir, thumbnailFileName);

  await sharp(imagePath)
    .resize(300, 200, { fit: 'cover' })
    .webp({ quality: 70 })
    .toFile(thumbnailPath);

  return path.join(bucketPath, thumbnailFileName);
}
```

## Storage Layout

```
storage/
├── hot/              # Frequently accessed files
│   ├── a1/
│   │   ├── b2/
│   │   │   ├── c3/
│   │   │   │   └── d4/
│   │   │   │       └── a1b2c3d4...webp
│   └── ...
├── warm/             # Archived files (same structure)
│   └── ...
├── thumbnails/       # Image thumbnails (same structure)
│   └── ...
└── temp/             # Temporary files during processing
    └── ...
```

## Implementation Checklist

For large-scale storage systems:

1. **Hash Bucketing** - Are files distributed via content hashes?
2. **Deduplication** - Are duplicates detected before storage?
3. **Tiered Storage** - Is there a hot/warm/cold strategy?
4. **Integrity** - Are checksums verified on read/write?
5. **Derivatives** - Are thumbnails/processed versions stored separately?
6. **Atomic Writes** - Are files written with tmp→rename pattern?

## Example: Tina Design Platform Storage

- **Hash Bucketing**: SHA-256 with 4-level buckets (a1/b2/c3/d4/)
- **Deduplication**: Automatic via SHA-256 checksum comparison
- **Tiered Storage**: Hot (active) → Warm (archived after 30 days)
- **Integrity**: SHA-256 verification on all operations
- **Derivatives**: Separate thumbnail storage with same bucketing
- **Atomic Writes**: tmp→rename with checksum verification
