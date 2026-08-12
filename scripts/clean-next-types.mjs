import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

// Next.js keeps development-only route types under .next/dev. Those files can
// outlive a dev server and conflict with the production route types generated
// by `next build`. They are disposable build artifacts, so remove only that
// narrow directory before standalone type checks and production builds.
const generatedDevTypes = resolve('.next', 'dev', 'types');

await rm(generatedDevTypes, { recursive: true, force: true });
