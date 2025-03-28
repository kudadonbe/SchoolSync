import firestoreService from './firestoreService'
import type { AttendanceService } from './types'

// You can switch drivers later using env like VITE_DB_DRIVER
const driver = import.meta.env.VITE_DB_DRIVER || 'firestore'

let service: AttendanceService

switch (driver) {
  case 'firestore':
    service = firestoreService
    break

  // case 'mysql':
  //   service = mysqlService
  //   break

  default:
    throw new Error(`Unsupported DB driver: ${driver}`)
}

export default service
