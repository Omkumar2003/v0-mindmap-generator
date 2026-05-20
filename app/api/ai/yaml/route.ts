// app/api/ai/yaml/route.ts

import { createClient } from '@/lib/supabase/server'
import { Groq } from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { action, yamlContext, topic } =
      await request.json()

    let systemPrompt = `
You are an expert AI assistant specializing in:

- Mind maps
- Memory compression
- Sequential recall systems
- Mnemonics
- Story chaining
- English memory techniques
- Exam retention systems

Your goal is MEMORY RETENTION.
NOT beauty.
NOT formal writing.
NOT educational essays.
`

    let userPrompt = ''

    // =====================================================
    // GENERATE
    // =====================================================

    if (action === 'generate') {
      userPrompt = `
Topic:
${topic || 'Expand current structure'}

Current YAML:
${yamlContext || 'None'}

TASK:
Create a detailed mind map structure in YAML format.

RULES:
1. Use ONLY YAML
2. Use ONLY:
   - Label Name
3. Use 2-space indentation
4. No markdown
5. No explanations
6. No prose
7. Return ONLY YAML
`
    }

    // =====================================================
    // SUMMARIZE
    // =====================================================

    else if (action === 'summarize') {
      userPrompt = `
Explain this mind map simply.

YAML:
${yamlContext}

Provide:
1. Short summary
2. Important concepts
3. Learning order
4. Key insights

Keep concise.
`
    }

    // =====================================================
    // TRICKS
    // =====================================================

    else if (action === 'tricks') {
      userPrompt = `You are using a custom MEMORY COMPRESSION + CHRONOLOGICAL RECALL SYSTEM.

This is NOT a normal mnemonic generator.

This system is specifically designed for:
- exam preparation
- massive information compression
- sequential recall
- fast revision
- reconstructing large text from tiny memory anchors

The user naturally remembers information through:
1. compressed pronounceable chunks
2. absurd visual imagination
3. chronological action-reaction chains
4. cinematic mental scenes
5. causal reconstruction

Your job is to optimize MEMORY RETENTION, not educational beauty.

==================================================
PRIMARY GOAL
==================================================

Convert large/random information into:

1. compressed memory chunks
2. pronounceable fake words
3. weird English sound patterns
4. absurd chronological stories
5. sequential reconstruction chains

The final result should feel:
- visual
- cursed
- absurd
- meme-like
- cinematic
- highly reconstructable
- impossible to forget

The story should FORCE the brain to remember sequence automatically.

==================================================
STEP 1 — EXTRACT IMPORTANT WORDS
==================================================

Extract ONLY important recall words.

Ignore:
- filler text
- articles
- unnecessary connectors
- helper words

Focus on:
- nouns
- concepts
- formulas
- terminology
- actions
- hierarchy nodes
- keywords

Example:
bat, bed, zoo, table, keyboard, apple

==================================================
STEP 2 — REAL COMPRESSION LOGIC
==================================================

This system does NOT create one giant unreadable chunk.

The REAL goal is:

Convert RANDOM HARD-TO-REMEMBER INFORMATION
into
SMALLER PRONOUNCEABLE SOUND CHUNKS.

The brain remembers:
- sounds
- rhythm
- pronunciation flow
- meme-like phrases
- familiar sound patterns

MUCH BETTER than:
random isolated characters.

==================================================
WHY VOWELS MATTER
==================================================

Pure consonants create noise.

BAD:
BBZTKA

The brain struggles to hold it.

Vowels reduce randomness.

They convert noise into:
- rhythm
- pronunciation
- flow
- sound patterns

==================================================
IMPORTANT COMPRESSION RULE
==================================================

DO NOT merge everything into one giant fake word.

BAD:
Babezutakisa

This becomes too dense and difficult to decode.

Instead:
create SMALLER SOUND CHUNKS.

GOOD:
Babez Takis

This works because:
- "Babez" becomes one memory sound object
- "Takis" sounds familiar and rhythmic
- the brain stores them like song lyrics/slang

The compression should feel:
- speakable
- rhythmic
- catchy
- meme-like
- easy to repeat quickly

==================================================
HOW CHUNKING WORKS
==================================================

Example:

Bat
Bed
Zoo
Table
Keyboard
Apple

↓

Ba
Be
Z
T
K
S

Apple becomes:
Seb

because vowel-starting words are weak anchors.

So:

Apple
↓
Seb
↓
S

Now create pronounceable chunks:

Ba + Be + Z
↓

Babez

T + K + S
↓

Takis

Final Compression:

Babez Takis

NOT:
Babezutakisa

==================================================
WHY "TAKIS" WORKS
==================================================

The system should prefer:
- familiar sound patterns
- song-like rhythm
- meme-like pronunciation
- culturally sticky sounds

Example:
"Takis" sounds memorable because:
- resembles existing sound patterns
- resembles songs/slang
- easy to pronounce rapidly
- low mental friction

The AI should intelligently create:
MEMORABLE SOUND GROUPS.

NOT:
perfectly logical strings.

==================================================
HOW TO HANDLE DUPLICATES
==================================================

If multiple words start with same consonant:

Bat
Bed

DO NOT keep:
B B

Instead:
slightly alter vowel sounds.

Bat → Ba
Bed → Be

The goal:
distinct pronunciation patterns.

==================================================
HOW TO HANDLE VOWEL WORDS
==================================================

Words starting with:
A E I O U

are weak memory anchors.

BAD:
Apple → A

Pure vowels are difficult to retain because the brain remembers consonant shapes better.

==================================================
VOWEL CONVERSION RULE
==================================================

For vowel-starting words:

Convert them into:
- English substitute
- synonym
- visual replacement
- alternate language equivalent

Then compress THAT word.

Example:

Apple
↓

Seb

↓

S

Now memory becomes:

S → Seb → Apple

This creates:
- stronger consonant anchors
- better sound flow
- stronger reconstruction
- dual-language memory linking

==================================================
English MEMORY ADVANTAGE
==================================================

The user's exams are usually in English.

But English creates:
DOUBLE MEMORY PATHS.

Example:

Apple
↓
Seb
↓
S

The brain reconstructs:
S → Seb → Apple

This is MUCH STRONGER than:
A → Apple

==================================================
MEMORY CHAIN PRINCIPLE
==================================================

The brain remembers:
sound groups
better than
abstract symbols.

BAD:
BBZTKA

GOOD:
Babez Takis

Now the compression itself becomes:
- memorable
- visual
- emotionally sticky

It feels like:
- song lyric
- meme phrase
- fake anime attack
- cursed slang

This dramatically improves recall.

==================================================
COMPRESSION PRIORITIES
==================================================

Priority order:

1. Recoverability
2. Pronounceability
3. Rhythm
4. Familiar sound patterns
5. Weirdness
6. Compactness

NOT:
perfect initials accuracy.

==================================================
ADVANCED CHUNKING RULE
==================================================

If information becomes large:

Create MULTIPLE compression chunks.

Example:

Babez
Takis
Nebura
Kazemo

Then:
connect those chunks through story chains.

DO NOT force everything into one mega-word.

==================================================
STEP 3 — DECIDE STRATEGY
==================================================

AI MUST intelligently decide:

IF information count is SMALL:
→ directly create recall story

IF information count is MEDIUM:
→ create small compression chunks
→ then create story

IF information count is HUGE:
→ create multiple chunk groups
→ separate story chains
→ connect chains chronologically

==================================================
STEP 4 — STORY CREATION
==================================================

This is the MOST IMPORTANT PART.

The story MUST:
- be absurd
- be visual
- be cinematic
- be easy to imagine
- feel like meme logic
- force chronological recall
- follow action → reaction structure

==================================================
CRITICAL STORY RULE
==================================================

EVERY EVENT MUST CAUSE THE NEXT EVENT.

The next scene should feel impossible without the previous scene.

BAD:
A and B and C and D

GOOD:
A exploded → caused B → launched C → crashed into D

The brain remembers causality better than random association.

==================================================
STORY STYLE RULES
==================================================

Rules:
- English preferred
- English allowed
- no formal tone
- no educational tone
- no boring explanations
- no filler words
- no unnecessary conjunction chains
- no giant paragraphs
- one event per line
- maximum visual density
- meme energy GOOD
- cursed imagery GOOD
- impossible physics GOOD
- anime logic GOOD
- Newton/apple absurdity GOOD
- overdramatic reactions GOOD
- use ultra-short casual texting language
- use "u" instead of "you"
- use "ur" instead of "your"
- use "bcoz" instead of "because"
- use short meme-like phrasing
- avoid long grammatical sentences
- keep each scene under 8-12 words ideally
- compress obvious words aggressively
- remove unnecessary helper verbs
- prioritize speed-reading
- story should feel instantly decodable
- use shorthand humans naturally understand
- avoid overly descriptive narration
- maximize compactness
==================================================
SEQUENTIAL MEMORY OPTIMIZATION
==================================================

The story should allow:

If user remembers:
line 4

They should naturally reconstruct:
line 3 → line 2 → line 1

AND ALSO:
line 5 → line 6

The chain should feel mechanically connected.

==================================================
VISUAL IMAGINATION RULES
==================================================

Prefer:
- explosions
- transformations
- oversized objects
- cosmic nonsense
- portals
- impossible physics
- objects colliding
- illegal animal behavior
- dimensional jumps
- dramatic reactions

The goal:
HIGH VISUAL STICKINESS.

==================================================
HIERARCHY COMPRESSION
==================================================

If input contains hierarchy/tree structures:

Compress:
- parent nodes separately
- child nodes separately

Then:
create story chains preserving hierarchy order.

The user should reconstruct:
TOPIC → SUBTOPIC → DETAIL

==================================================
OUTPUT FORMAT
==================================================

IMPORTANT:
RETURN PLAIN TEXT ONLY.

DO NOT RETURN JSON.
DO NOT RETURN MARKDOWN CODEBLOCKS.

USE THIS EXACT STRUCTURE:

## Compression Map

Bat → Ba
Bed → Be
Zoo → Z
Table → T
Keyboard → K
Apple → Seb → S

## Compression Chunks

Babez
Takis

## Why This Works

Explain:
- vowel usage
- pronunciation flow
- reduced randomness
- English advantage
- sound-group memory
- why chunking improves recall

## English Recall Story

IMPORTANT:
This section must contain ONLY cinematic story text.

STRICT RULES:
- NO arrows
- NO symbol mappings
- NO decoding
- NO "X → Y"
- NO explanations
- NO reconstruction pairs
- NO labels
- NO keyword lists
- NO mnemonic decoding

The story must feel like:
- one flowing cinematic scene
- absurd dream logic
- visual chain reactions
- cursed movie physics
- meme-like action flow

The mnemonic words should appear NATURALLY inside the story.

GOOD:

Nash threw burning salt at Fur and the entire fort exploded into blue smoke.

Fork rolled downhill and crashed into Jag riding a giant buffalo.

Jag screamed so loudly that Sam fell into Champ's indigo farm.

BAD:

Nash → Nationalism
Fur → First World War
Fork → Forced Recruitment

The story must NEVER explain the mnemonic.
Only USE the mnemonic naturally inside scenes.


## Recall Reconstruction

Ba → Bat
Be → Bed
Z → Zoo
T → Table
K → Keyboard
S → Seb → Apple

==================================================
INPUT
==================================================

${yamlContext}

==================================================
FINAL IMPORTANT RULES
==================================================

Optimize for:
- exam recall
- compression efficiency
- chronological reconstruction
- visual retention
- fast revision
- sequential memory
- long-term retention
- low cognitive load

Avoid:
- giant unreadable compression words
- generic study advice
- formal educational tone
- boring explanations
- disconnected stories
- weak associations
- filler-heavy narratives

The final output should feel like:
"a compressed cursed memory movie."
`
    }

    // =====================================================
    // INVALID ACTION
    // =====================================================

    else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    // =====================================================
    // AI CALL
    // =====================================================

    const completion =
      await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',

        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],

        temperature: 0.9,
        max_tokens: 4096,
      })

    const result =
      completion.choices?.[0]?.message?.content || ''

    return NextResponse.json({
      result,
    })
  } catch (error: any) {
    console.error('Groq API Error:', error)

    return NextResponse.json(
      {
        error:
          error?.message || 'Something went wrong',
      },
      {
        status: 500,
      }
    )
  }
}