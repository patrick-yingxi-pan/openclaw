---
name: feishu-channel
description: |
  Complete Feishu channel management including user preferences, session startup, and delayed reporting. Activate when user mentions Feishu, user preferences, session startup, onboarding, or delayed reporting.
version: 1.0
lastUpdated: 2026-03-02
---

# Feishu Channel Skill

Unified skill for Feishu channel management including user preferences, session startup, and delayed reporting.

## Overview

This skill provides complete Feishu channel functionality:

- User preference management and personalization
- Session startup automation
- New user onboarding
- Delayed reporting to specific users

---

## Part 1: Feishu User Management

### Quick Reference

| Task                    | Action                                                                |
| ----------------------- | --------------------------------------------------------------------- |
| **Session Startup**     | Follow the Feishu Session Startup Checklist                           |
| **Identify User**       | Extract user ID from inbound metadata (SenderId, user_id, or chat_id) |
| **New User Onboarding** | Follow the New User Onboarding Flow                                   |
| **Apply Preferences**   | Read and apply user preferences at session start                      |
| **Update Preferences**  | Edit the corresponding Feishu*USER*&lt;user-id&gt;.md file            |
| **Fix Format Issues**   | Refer to the User File Format Specification                           |

### Quick Start

1. At Feishu session start: Read SOUL.md → USER.md → today/yesterday memory → MEMORY.md (if MAIN SESSION)
2. Extract Feishu user ID from inbound metadata
3. Check if user file exists:
   - If YES: Read and apply preferences
   - If NO: Start new user onboarding flow
4. Greet user and ask what they want to do

### Feishu Session Startup Checklist

**Follow this checklist at the start of EVERY Feishu session:**

#### 1. Read Base Files

- [ ] Read SOUL.md
- [ ] Read USER.md
- [ ] Read memory/YYYY-MM-DD.md (today + yesterday)
- [ ] If in MAIN SESSION: Read MEMORY.md

#### 2. Identify Feishu User

- [ ] Extract Feishu user ID from inbound metadata (try in this order):
  1. `SenderId` field (preferred)
  2. `user_id` field
  3. `chat_id` field (format: `user:ou_xxxxxxxxxx`, extract `ou_xxxxxxxxxx` part)
- [ ] Verify user ID format is `ou_xxxxxxxxxx`

#### 3. Handle User File

- [ ] Check if user file exists: `Feishu_USER_&lt;user-id&gt;.md`
- [ ] If file exists:
  - [ ] Read and parse the user file
  - [ ] Apply user preferences (see "User Preferences Application" section)
- [ ] If file does NOT exist:
  - [ ] Start the New User Onboarding Flow (see below)

#### 4. Complete Startup

- [ ] Greet the user using their preferred name
- [ ] Ask what they want to do

### User Identification and Error Handling

#### Extracting Feishu User ID

**Priority order for extracting user ID:**

1. **`SenderId` field** (recommended) - Direct sender open ID
2. **`user_id` field** - Alternative user ID field
3. **`chat_id` field** - Format: `user:ou_xxxxxxxxxx`, extract the `ou_xxxxxxxxxx` part

**Example inbound metadata:**

```json
{
  "chat_id": "user:ou_6eae500b759305b553934324445f8895",
  "channel": "feishu",
  "provider": "feishu",
  "surface": "feishu",
  "chat_type": "direct"
}
```

#### Error Handling

##### Case 1: Cannot Extract User ID

**What to do:**

1. Check if inbound metadata contains any of the expected fields
2. Verify field formats are correct
3. If it appears to be a permission issue:
   - Inform the user: "I'm having trouble identifying your Feishu user ID. This may be a permission issue."
   - Instruct: "Please go to the Feishu Open API platform and configure the `contact:user.base` permission for the Feishu channel."
4. If it's another issue:
   - Record the error details
   - Use default configuration
   - Inform the user you're using default settings

##### Case 2: User File Exists But Format Is Wrong

**What to do:**

1. Inform the user: "I found your user file, but it seems to have a format issue."
2. Provide a link to the "User File Format Specification" section
3. Offer to help fix the format
4. Temporarily use default configuration while the issue is resolved

#### Fallback Strategy

If user identification fails completely:

- Use default configuration from `agents.defaults`
- Record the situation for later debugging
- Inform the user you're using default settings
- Try to resolve the issue in the background

### New User Onboarding Flow

**Use this flow when a new Feishu user is detected (no user file exists):**

#### 1. Greet and Introduce

- [ ] Greet the user warmly
- [ ] Briefly explain what this skill does: "I help personalize your experience by remembering your preferences."
- [ ] Explain the benefits: "This lets me use your preferred name, remember your timezone, and apply your favorite settings automatically."

#### 2. Collect Basic Information

**Ask ONE question at a time, wait for answer before next question:**

- [ ] **Name:** "What's your name? (Chinese or English is fine)"
- [ ] **Nickname:** "What would you like me to call you?"
- [ ] **Timezone:** "My default timezone is GMT+8. Would you like to use a different timezone?" (If yes, ask what timezone)
- [ ] **Notes:** "Is there anything else you'd like me to remember about you?" (optional)

#### 3. Set Preferences (Optional)

**Ask about preferences, offer default options:**

- [ ] **Usage Footer:** "Would you like to see usage statistics in responses? Options: off (default) | tokens | full | cost"
- [ ] **Thinking Level:** "What thinking level would you prefer? Options: off | minimal | low | medium | high (default) | xhigh"
- [ ] **Reasoning Mode:** "What reasoning mode would you prefer? Options: on | off (default) | stream"
- [ ] **Custom Preferences:** "Is there anything else you'd like to set as a preference?" (optional)

#### 4. Create User File

- [ ] Create the user file: `Feishu_USER_&lt;user-id&gt;.md`
- [ ] Use the standard format (see "User File Format Specification")
- [ ] Fill in all the information collected
- [ ] Save to the workspace directory

#### 5. Confirm and Preview

- [ ] Show the user the file content you created
- [ ] Ask: "Does this look right? Would you like to change anything?"
- [ ] If changes needed: Go back to the relevant step and re-collect information
- [ ] If everything looks good: Continue

#### 6. Complete Onboarding

- [ ] Confirm: "Great! Your user file has been created."
- [ ] Explain: "Next time we chat, I'll automatically load your preferences."
- [ ] Ask: "What would you like to do now?"

### User Preferences Application

**Apply user preferences at session start (only once per session):**

#### 1. Read and Parse User File

- [ ] Read the `Feishu_USER_&lt;user-id&gt;.md` file
- [ ] Parse the content to extract preferences
- [ ] Verify the file format is correct

#### 2. Apply System-Level Preferences

##### Thinking Level

- [ ] Look for: `**Thinking Level:** &lt;value&gt;`
- [ ] Valid values: off | minimal | low | medium | high | xhigh
- [ ] Apply to current session
- [ ] Default: Use `agents.defaults.thinkingDefault` if not specified

##### Reasoning Mode

- [ ] Look for: `**Reasoning Mode:** &lt;value&gt;`
- [ ] Valid values: on | off | stream
- [ ] Apply to current session
- [ ] Default: off if not specified

##### Usage Footer

- [ ] Look for: `**Usage Footer:** &lt;value&gt;`
- [ ] Valid values: off | tokens | full | cost
- [ ] Apply to current session
- [ ] Default: off if not specified

#### 3. Personalize the Experience

- [ ] Note the user's name and preferred nickname
- [ ] Use their preferred nickname in the conversation
- [ ] Consider their timezone when discussing time-related topics
- [ ] Remember any other personal notes they provided

#### 4. Verify and Document

- [ ] Confirm preferences have been applied correctly
- [ ] If any preference fails to apply, provide a clear error message
- [ ] Record all preference applications for debugging purposes
- [ ] Note any issues to address later

#### Important Notes

- Preferences are only applied **once at session start**
- If the user modifies preferences during the session, changes won't take effect until next session
- If user file format is invalid, use default configuration
- Always log preference applications for debugging

### User File Format Specification

#### File Naming

- **Format:** `Feishu_USER_&lt;feishu-user-id&gt;.md`
- **Example:** `Feishu_USER_ou_6eae500b759305b553934324445f8895.md`
- **Location:** Workspace directory

#### File Structure

```markdown
# Feishu User: &lt;Name&gt;

## IMPORTANT

**THIS FILE IS FOR FEISHU USER: &lt;Name&gt;** (Feishu User ID: &lt;user-id&gt;)

## User

- **Name:** &lt;Name&gt;
- **Chinese Name:** &lt;Chinese Name&gt; (optional)
- **English Name:** &lt;English Name&gt; (optional)
- **What to call them:** &lt;Name&gt; / &lt;Nickname&gt;
- **Pronouns:** _(optional)_
- **Timezone:** GMT+8
- **Notes:** &lt;any notes&gt;

## Preferences

- **Usage Footer:** off|tokens|full|cost
- **Thinking Level:** off|minimal|low|medium|high|xhigh
- **Reasoning Mode:** on|off|stream
- **&lt;Custom Preference&gt;:** &lt;Value&gt;
```

#### Complete Example

```markdown
# Feishu User: Patrick (夕夕)

## IMPORTANT

**THIS FILE IS FOR FEISHU USER: Patrick (夕夕)** (Feishu User ID: ou_6eae500b759305b553934324445f8895)

## User

- **Name:** Patrick
- **Chinese Name:** 夕夕
- **What to call them:** Patrick / 夕夕
- **Pronouns:** _(optional)_
- **Timezone:** GMT+8
- **Notes:** Primary user. Set me up with the name Alice.

## Preferences

- **Usage Footer:** tokens
- **Thinking Level:** high
- **Reasoning Mode:** stream
```

#### Field Descriptions

##### User Section

| Field             | Required | Description                      |
| ----------------- | -------- | -------------------------------- |
| Name              | Yes      | User's full name                 |
| Chinese Name      | No       | Chinese name (if applicable)     |
| English Name      | No       | English name (if applicable)     |
| What to call them | Yes      | Preferred nickname(s)            |
| Pronouns          | No       | Preferred pronouns               |
| Timezone          | Yes      | User's timezone (default: GMT+8) |
| Notes             | No       | Any additional notes             |

##### Preferences Section

| Preference     | Values                                           | Default                         |
| -------------- | ------------------------------------------------ | ------------------------------- |
| Usage Footer   | off \| tokens \| full \| cost                    | off                             |
| Thinking Level | off \| minimal \| low \| medium \| high \| xhigh | agents.defaults.thinkingDefault |
| Reasoning Mode | on \| off \| stream                              | off                             |

#### Custom Preferences

You can add any custom preferences by following the same format:

```markdown
- **&lt;Preference Name&gt;:** &lt;Preference Value&gt;
```

Example custom preferences:

```markdown
- **Style preferences:** 现代简约，美式复古，侘寂风
- **Weekly schedule:** Monday: 10 design cases, Friday: 10 product cases
```

---

## Part 2: Feishu User Report

### Core Principle

When a Feishu user says something like:

- "Report back to me later"
- "Let me know when you have the results"
- "Come back to me when this is done"
- "I'll check back later, just let me know"

**Always**:

1. Capture and store the user's Feishu user ID (not just their name)
2. When results are ready, send the report directly to that specific user ID
3. Do NOT just send to the channel generally - direct message the user

### How to Identify the User

From Feishu channel messages, you will have access to the sender's user ID. Always:

- Store this ID alongside any pending task
- Use this exact ID when sending the delayed report
- Never rely solely on user names (they can change or be duplicated)

### Example Workflow

1. User (Feishu ID: `ou_123456789`) says: "Find that document and report back to me later"
2. You store: `{ task: "find document", userId: "ou_123456789" }`
3. Later, when you find the document:
4. Use the message tool with the specific user ID to deliver the result directly

### Important Reminder

Feishu has both group channels and direct messages. When a user asks to "report back later" from a group channel, you still need to send the result to that specific user (via direct message or @mention with user ID), not just post it in the group where it might be missed.

---

## FAQ and Troubleshooting

### Common Issues

#### Q: I can't extract the Feishu user ID

**A:**

1. Check if inbound metadata contains `SenderId`, `user_id`, or `chat_id` fields
2. If it seems like a permission issue, ask the user to configure `contact:user.base` permission in Feishu Open API platform
3. Use default configuration as fallback

#### Q: User file exists but format is wrong

**A:**

1. Inform the user about the format issue
2. Refer them to the "User File Format Specification" section
3. Offer to help fix the format
4. Use default configuration temporarily

#### Q: Preferences aren't being applied

**A:**

1. Verify the user file exists and is readable
2. Check the preference values are valid (see valid values in "User Preferences Application")
3. Confirm preferences are being applied at session start (not during session)
4. Check the logs for any error messages

#### Q: How do I manually trigger new user onboarding?

**A:**

1. Delete or rename the existing user file
2. Start a new Feishu session
3. The onboarding flow will start automatically

#### Q: Can I change preferences during a session?

**A:**

1. Yes, you can edit the user file
2. But changes won't take effect until the next session
3. Preferences are only applied once at session start

### Debugging Tips

1. **Check the logs:** Look for any error messages related to user identification or preference application
2. **Verify file permissions:** Ensure user files are readable and writable
3. **Test with a known good file:** Use the example file from the specification to test
4. **Start fresh:** If all else fails, delete the user file and go through onboarding again

---

## Best Practices

### File Management

1. **Backup regularly:** Make regular backups of all Feishu user files
2. **Keep history:** Maintain historical versions for recovery
3. **Organize neatly:** Keep all user files in the workspace directory
4. **Secure access:** Protect user files from unauthorized access

### File Editing

1. **Follow the format:** Always use the standard format when editing user files
2. **Avoid manual edits:** Prefer the onboarding flow for creating/updating files
3. **Validate changes:** Check the file format after making changes
4. **Test:** Verify preferences work after making changes

### Usage Tips

1. **Document everything:** Keep notes about why preferences were changed
2. **Communicate changes:** Inform users when their preferences are updated
3. **Respect privacy:** Don't store sensitive information in user files
4. **Clean up:** Remove user files for users who are no longer active

### Security and Privacy

1. **Protect privacy:** User files contain personal information - keep them secure
2. **No secrets:** Don't store passwords, API keys, or other secrets in user files
3. **Limit access:** Only give access to user files to those who need it
4. **Regular audit:** Periodically review user files for sensitive information

### Performance

1. **Keep files small:** User files should be concise and focused
2. **Avoid bloat:** Don't store unnecessary information
3. **Quick access:** Keep files in an easily accessible location
4. **Cache wisely:** Consider caching user data for better performance

---

## Known Feishu Users

| User ID | Name | File |
| ------- | ---- | ---- |

| ou_6eae500b759305b5
