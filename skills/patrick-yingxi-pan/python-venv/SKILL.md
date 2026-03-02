---
name: python-venv
description: Python virtual environment management for skills and tools. Create, activate, and manage Python venvs to handle dependencies cleanly without system-wide conflicts. Use when working with Python scripts that require external packages, or when dealing with externally managed Python environments.
---

# Python Virtual Environment Skill

Manage Python virtual environments for skills and tools to avoid dependency conflicts.

## Quick Start

### Check if venv exists

```bash
ls -la /path/to/skill/venv/
```

### Create a new venv

```bash
cd /path/to/skill
python3 -m venv venv
```

### Activate and install dependencies

```bash
cd /path/to/skill
source venv/bin/activate
pip install <package-name>
```

### Run a script with venv

```bash
cd /path/to/skill
source venv/bin/activate
python3 script.py
```

---

## Core Principles

### Why Use Virtual Environments?

1. **Dependency isolation** - Each project has its own dependencies
2. **Avoid system conflicts** - No need for `--break-system-packages`
3. **Reproducibility** - Easy to share and recreate environments
4. **Clean management** - Delete the `venv/` folder to clean up

### When to Use This Skill

- When a Python script requires external packages (like `pyyaml`, `requests`, etc.)
- When you see `ModuleNotFoundError` for a package that should be installed
- When dealing with externally managed Python environments (Ubuntu/Debian, Linuxbrew, etc.)
- When working with skills that have Python dependencies

---

## Common Scenarios

### Scenario 1: Externally Managed Environment

**Problem:**

```
error: externally-managed-environment
× This environment is externally managed
╰─> To install Python packages system-wide, try apt install
    python3-xyz, where xyz is the package you are trying to
    install.
```

**Solution:** Use a virtual environment

```bash
# 1. Create venv
cd /path/to/project
python3 -m venv venv

# 2. Activate
source venv/bin/activate

# 3. Install packages
pip install pyyaml requests

# 4. Run your script
python3 your_script.py
```

### Scenario 2: ModuleNotFoundError

**Problem:**

```
Traceback (most recent call last):
  File "script.py", line 5, in <module>
    import yaml
ModuleNotFoundError: No module named 'yaml'
```

**Solution:** Check if venv exists and use it

```bash
# Check if venv already exists
ls -la /path/to/skill/venv/

# If venv exists, use it
cd /path/to/skill
source venv/bin/activate
pip install pyyaml  # if not already installed
python3 script.py

# If no venv, create one
cd /path/to/skill
python3 -m venv venv
source venv/bin/activate
pip install pyyaml
python3 script.py
```

### Scenario 3: Multiple Python Versions

**Problem:** System Python vs Linuxbrew Python vs pyenv Python

**Solution:** Always use `python3 -m venv` to create venv with the same Python version

```bash
# Check which Python you're using
which python3
python3 --version

# Create venv with that specific Python
python3 -m venv venv

# Verify venv uses the same Python
source venv/bin/activate
which python
python --version
```

---

## Step-by-Step Workflows

### Workflow A: Setting Up a New Skill with Dependencies

1. **Check if venv already exists**

   ```bash
   cd /path/to/skill
   ls -la venv/
   ```

2. **If no venv, create one**

   ```bash
   python3 -m venv venv
   ```

3. **Activate the venv**

   ```bash
   source venv/bin/activate
   ```

4. **Install required packages**

   ```bash
   pip install pyyaml  # or whatever packages are needed
   ```

5. **Verify installation**

   ```bash
   python3 -c "import yaml; print('OK')"
   ```

6. **Run your script**
   ```bash
   python3 scripts/your_script.py
   ```

### Workflow B: Using an Existing Venv

1. **Activate the venv**

   ```bash
   cd /path/to/skill
   source venv/bin/activate
   ```

2. **Check installed packages** (optional)

   ```bash
   pip list
   ```

3. **Run your script**

   ```bash
   python3 scripts/your_script.py
   ```

4. **Deactivate when done** (optional)
   ```bash
   deactivate
   ```

### Workflow C: Resetting a Corrupted Venv

1. **Delete the old venv**

   ```bash
   cd /path/to/skill
   rm -rf venv/
   ```

2. **Create a fresh venv**

   ```bash
   python3 -m venv venv
   ```

3. **Reinstall dependencies**
   ```bash
   source venv/bin/activate
   pip install pyyaml requests  # etc.
   ```

---

## Best Practices

### Do's

✅ **Always use venvs** for Python skills with dependencies  
✅ **Keep venv inside the skill directory** (named `venv/`)  
✅ **Document dependencies** in SKILL.md or a requirements.txt  
✅ **Activate venv before running scripts**  
✅ **Test after installation** to verify it works

### Don'ts

❌ **Don't use `--break-system-packages`** - it can break your system  
❌ **Don't commit venv/ to git** - it's machine-specific  
❌ **Don't manually edit files inside venv/** - let pip manage it  
❌ **Don't mix venvs from different Python versions**

### Git Ignore

Always add `venv/` to your `.gitignore`:

```
# Python virtual environment
venv/
__pycache__/
*.pyc
```

---

## Troubleshooting

### Issue: `source: not found`

**Problem:** Using `source` in a script that doesn't use bash

**Solution:** Use `.` instead of `source`, or run in bash

```bash
# Alternative 1: Use . (works in all POSIX shells)
. venv/bin/activate

# Alternative 2: Explicitly use bash
bash -c "source venv/bin/activate && python3 script.py"
```

### Issue: Venv uses wrong Python version

**Problem:** Venv was created with a different Python than expected

**Solution:** Recreate venv with the correct Python

```bash
# Check available Pythons
which -a python3

# Use the specific one you want
/usr/bin/python3 -m venv venv
# OR
/home/linuxbrew/.linuxbrew/bin/python3 -m venv venv
```

### Issue: Packages not found after activation

**Problem:** Packages are installed but not found

**Solution:** Verify activation and reinstall

```bash
# Check if actually activated
echo $VIRTUAL_ENV  # should show the venv path

# If not activated, activate again
source venv/bin/activate

# Reinstall packages
pip install pyyaml
```

### Issue: Permission denied on activate

**Problem:** `venv/bin/activate` has wrong permissions

**Solution:** Fix permissions or recreate venv

```bash
# Fix permissions
chmod +x venv/bin/activate

# Or recreate
rm -rf venv/
python3 -m venv venv
```

---

## Quick Reference

| Task               | Command                               |
| ------------------ | ------------------------------------- |
| Create venv        | `python3 -m venv venv`                |
| Activate venv      | `source venv/bin/activate`            |
| Deactivate venv    | `deactivate`                          |
| Install package    | `pip install <package>`               |
| List packages      | `pip list`                            |
| Delete venv        | `rm -rf venv/`                        |
| Check Python       | `which python3` & `python3 --version` |
| Check if activated | `echo $VIRTUAL_ENV`                   |

---

## Example: Complete Workflow with skill-evaluator

```bash
# 1. Go to the skill directory
cd ~/.openclaw/workspace/skills/skill-evaluator

# 2. Check if venv exists
ls -la venv/

# 3. Create venv if needed (already existed in our case)
# python3 -m venv venv

# 4. Activate
source venv/bin/activate

# 5. Install dependencies
pip install pyyaml

# 6. Run the evaluation
python3 scripts/eval-skill.py ~/.openclaw/workspace/skills/skill-creator

# 7. Deactivate when done
deactivate
```
