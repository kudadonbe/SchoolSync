// src/services/api/index.ts

// === 1. Import full backend implementations ===
import firebaseApi from './firebase'
// import schoolSyncApi from './myApi'
// import sqliteApi from './sqlite'

// === 2. Choose which backend to activate ===
// You will switch this manually or via an environment variable later
const selectedBackend = 'firebase' as const // 'firebase' | 'schoolSync' | 'sqlite'

// === 3. Define the backend shape (optional for now) ===
// You can create a strict type later from grouped interfaces like:
import type { BackendAPI } from '@/types/api'
// export const api: BackendAPI = ...

// === 4. Bind selected backend ===
// You only load one backend, so this switch keeps everything tree-shakable and modular
export const api: BackendAPI =
  selectedBackend === 'firebase'
    ? firebaseApi
    : selectedBackend === 'schoolSync'
      ? ({} as BackendAPI) // replace with: schoolSyncApi
      : selectedBackend === 'sqlite'
        ? ({} as BackendAPI) // replace with: sqliteApi
        : (() => {
            throw new Error(`Unsupported backend: ${selectedBackend}`)
          })()
