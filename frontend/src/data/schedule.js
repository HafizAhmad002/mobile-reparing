// Working schedule for the ONE technician. The client can change these values.
//
// How a booking blocks time: the technician leaves from BASE at the start of the day (or from the
// previous customer), drives to the customer (travel time), then repairs for SERVICE_MIN minutes.
// The next customer can only book a time after that, including the drive from the last customer.

export const SCHEDULE = {
  dayStart: '08:00', // leaves BASE at this time
  dayEnd: '17:00', // the last repair must be finished by this time
  serviceMin: 60, // time spent on each repair
  stepMin: 30, // spacing of the arrival times offered to customers
  leadMin: 45, // for today: the earliest time offered is at least this far from now
  workDays: [0, 1, 2, 3, 4, 5, 6], // days we work: 0 = Sunday, 1 = Monday … 6 = Saturday
  timeOff: [], // holidays / blocked days: [{ id, start: 'YYYY-MM-DD', end: 'YYYY-MM-DD', reason }]
  // Where the technician starts the day. [Set this to your own postcode area.]
  BASE: { lat: 53.4808, lon: -2.2426, label: 'Manchester city centre' },
}

// Driving time estimate (no paid map service needed):
// road distance ≈ straight line × roadFactor, at an average city speed, plus time to park.
export const TRAVEL = { roadFactor: 1.35, speedKmh: 25, parkMin: 10 }
