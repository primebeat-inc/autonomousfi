export class AutonomousFiError extends Error {
  constructor(public readonly code: string, message: string) {
    super(`[${code}] ${message}`);
    this.name = 'AutonomousFiError';
  }
}

export const ERR_INSUFFICIENT_BALANCE = 'insufficient balance';
export const ERR_ALREADY_RELEASED = 'escrow already released';
export const ERR_ALREADY_REFUNDED = 'escrow already refunded';
export const ERR_UNKNOWN_TASK = 'unknown task';
export const ERR_QUALITY_BELOW_THRESHOLD = 'quality below threshold';
export const ERR_HOSTAGE_ALREADY_RESOLVED = 'hostage already resolved';
