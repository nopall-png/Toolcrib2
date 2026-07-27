# Project AGENTS Rulebook - Toolcrib Management

All coding assistants working on this workspace must strictly adhere to the guidelines set in `prd.md`:

1. **Design System & Aesthetics**:
   - Primary Color: Blue (`blue-600`, `blue-700`).
   - Neutral Colors: Slate (`slate-50` to `slate-900`).
   - Semantic Colors: Emerald (Success), Red (Danger/Low Stock), Amber (Warning/Pending).
   - Strict Prohibition of "AI Slop" UI (No generic neon purple/pink gradients, no random glowing blur dots, no fake superficial MVP placeholders).
   
2. **Code Architecture**:
   - Maintain strict Role-based component separation under `src/components/user/` and `src/components/staff/`.
   - Keep files modular (max ~300 lines of code per file). Break large components into Wrapper and Panel sub-components.
   - Use Zustand (`src/lib/store.tsx`) for global state management.

3. **Reference**:
   - Always refer to `prd.md` for full Product Requirements and System Workflows.
