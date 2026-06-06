export class FixedTimestep {
  accumulator = 0
  lastTimestamp = -1
  alpha = 0
  constructor({ dt = 1 / 60, maxSteps = 3 } = {}) {
    this.dt = dt
    this.maxSteps = maxSteps
  }

  // Call once per frame with a timestamp (ms).
  // Returns number of fixed steps to run. 
  update(timestamp) {
    if (this.lastTimestamp < 0) this.lastTimestamp = timestamp
    const frameDt = Math.min((timestamp - this.lastTimestamp) / 1000, this.maxSteps * this.dt)
    this.lastTimestamp = timestamp

    this.accumulator += frameDt
    let steps = 0
    while (this.accumulator >= this.dt && steps < this.maxSteps) { // cap physics steps per frame to prevent spiral of death
      this.accumulator -= this.dt
      steps++
    }
    // Remove excess accumulator if we couldn't catch up within maxSteps
    this.accumulator = this.accumulator % this.dt
    this.alpha = this.accumulator / this.dt
    return steps
  }
}
