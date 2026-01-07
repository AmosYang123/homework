
import { StyleTemplate, AppSettings } from './types';

export const INITIAL_TEMPLATES: StyleTemplate[] = [
  {
    id: 't1',
    name: 'HistoryNotes',
    description: 'Transform textbook pages into structured study notes',
    icon: 'fa-book',
    type: 'standard',
    inputExample: 'The French Revolution began in 1789 when King Louis XVI faced a financial crisis. The Third Estate, representing commoners, demanded representation. On July 14, the Bastille was stormed, marking the beginning of revolutionary violence...',
    outputExample: 'DATE: French Rev - 1789\n- Trigger: Louis XVI $ crisis\n- Key: Third Estate wanted voice\n- Bastille Day (July 14) = start of violence\n- Why important: showed people power > monarchy',
    createdAt: Date.now(),
    useCount: 12,
  },
  {
    id: 't2',
    name: 'CodeExplainer',
    description: 'Convert complex code into plain English explanations',
    icon: 'fa-code',
    type: 'standard',
    inputExample: 'function quicksort(arr) {\n  if (arr.length <= 1) return arr;\n  const pivot = arr[arr.length - 1];\n  const left = [];\n  const right = [];\n  for (let i = 0; i < arr.length - 1; i++) {\n    if (arr[i] < pivot) left.push(arr[i]);\n    else right.push(arr[i]);\n  }\n  return [...quicksort(left), pivot, ...quicksort(right)];\n}',
    outputExample: 'CONCEPT: Quicksort Algorithm\n- Concept: Divide and conquer using a pivot.\n- Process: Splits array into smaller (left) and larger (right) elements compared to the pivot.\n- Base Case: Return array if length is 0 or 1.\n- Time Complexity: O(n log n) average.',
    createdAt: Date.now(),
    useCount: 5,
  },
  {
    id: 't3',
    name: 'ProEmail',
    description: 'Turn casual messages into professional corporate emails',
    icon: 'fa-envelope',
    type: 'standard',
    inputExample: "Hey Sarah, can we move the meeting to Tuesday? Monday is super busy for me and I won't have the slides ready by then. Let me know if that works for you.",
    outputExample: 'Subject: Rescheduling Meeting - [Project Name]\n\nDear Sarah,\n\nI hope you are having a productive week.\n\nCould we please reschedule our upcoming meeting to Tuesday? My schedule is currently at capacity for Monday, and I want to ensure I have the presentation materials finalized for our discussion.\n\nPlease let me know if this time works for you.\n\nBest regards,\n[My Name]',
    createdAt: Date.now(),
    useCount: 8,
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  chatMode: 'normal',
  showCopy: true,
  showEdit: true,
  showRegenerate: true,
  autoSave: true,
  templateSuggestions: true,
  autoComplete: true,
  stickyMode: true,
  maxFileSize: 10,
};

export const SYSTEM_INSTRUCTION = `You are a high-precision AI specialized in "Style Templates".
Your core logic is: f(input) = output, where "f" is a style pattern defined by the user.

RULES:
1. When a user @mentions a template, you MUST extract the transformation logic from the provided Input/Output examples.
2. Analyze: 
   - Structure (Prose -> Bullets, Table -> List, etc.)
   - Tone (Formal, Academic, Slang, dense formatting)
   - Compression (Keep all facts vs. Summary)
   - Formatting (Bold keys, specific symbols)
3. Apply that EXACT transformation to the new input.
4. If NO template is used, act as a helpful, world-class assistant with clear, markdown-formatted responses.
5. Do not talk about the process. Just provide the transformed output unless the user asks a clarifying question.
6. DO NOT USE EMOJIS UNDER ANY CIRCUMSTANCES.
7. CRITICAL: Do not hallucinate data. If you cannot find the answer in the provided context (e.g. YouTube transcript), explicitly state: "I cannot find that information in the provided context." DO NOT make up facts.`;
