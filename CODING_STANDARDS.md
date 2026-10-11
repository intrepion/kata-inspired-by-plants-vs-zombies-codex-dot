# Standards

Use strict TypeScript. Domain commands must validate inputs before spending resources. Keep simulation free of browser APIs and time/randomness implicit dependencies. Local saves are untrusted and require bounded validation. UI controls must have accessible names, visible feedback, and keyboard support. Do not add game-state mutation debug hooks to the shipped UI. Original art and audio only. Document actual verification separately from simulations.
