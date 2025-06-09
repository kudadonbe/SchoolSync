// src/services/api/firebase/index.ts

// === Import all domain modules ===
import { attendance } from './attendance'
// import { staff } from './staff'
// import { auth } from './auth'
// import { dutyRoster } from './dutyRoster'
// import { reviews } from './review'
// import { config } from './config'
// import { users } from './user'

// === Grouped Firebase API ===
// Each group is expected to implement its full domain interface (defined in types/api.ts)

const firebaseApi = {
  attendance,
  // staff,
  // auth,
  // dutyRoster,
  // reviews,
  // config,
  // users,
}

export default firebaseApi
