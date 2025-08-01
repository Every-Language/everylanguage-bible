import { logger } from '../../../utils/logger';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number; // milliseconds
  expectedResponseTime: number; // milliseconds
  monitorInterval: number; // milliseconds
}

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  totalRequests: number;
  totalFailures: number;
}

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private lastSuccessTime = 0;
  private totalRequests = 0;
  private totalFailures = 0;
  private nextAttemptTime = 0;

  constructor(
    private readonly name: string,
    private readonly config: CircuitBreakerConfig = {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      expectedResponseTime: 30000, // 30 seconds
      monitorInterval: 10000, // 10 seconds
    }
  ) {
    this.startMonitoring();
  }

  /**
   * Execute an operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>, timeout?: number): Promise<T> {
    this.totalRequests++;

    // Check if circuit is open
    if (this.state === 'open') {
      if (Date.now() < this.nextAttemptTime) {
        throw new CircuitBreakerError(
          `Circuit breaker '${this.name}' is open`,
          'CIRCUIT_OPEN',
          { nextAttemptTime: this.nextAttemptTime }
        );
      }

      // Try to transition to half-open
      this.state = 'half-open';
      logger.info(`Circuit breaker '${this.name}' transitioning to half-open`);
    }

    const operationTimeout = timeout || this.config.expectedResponseTime;

    try {
      // Execute with timeout
      const result = await Promise.race([
        operation(),
        this.createTimeoutPromise(operationTimeout),
      ]);

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * Create a timeout promise
   */
  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          new CircuitBreakerError(
            `Operation timed out after ${timeout}ms`,
            'TIMEOUT',
            { timeout }
          )
        );
      }, timeout);
    });
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.successCount++;
    this.failureCount = 0;
    this.lastSuccessTime = Date.now();

    if (this.state === 'half-open') {
      this.state = 'closed';
      logger.info(
        `Circuit breaker '${this.name}' closed after successful operation`
      );
    }

    logger.debug(`Circuit breaker '${this.name}' success`, {
      successCount: this.successCount,
      failureCount: this.failureCount,
      state: this.state,
    });
  }

  /**
   * Handle failed operation
   */
  private onFailure(error: unknown): void {
    this.failureCount++;
    this.totalFailures++;
    this.lastFailureTime = Date.now();

    logger.warn(`Circuit breaker '${this.name}' failure`, {
      failureCount: this.failureCount,
      threshold: this.config.failureThreshold,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Check if we should open the circuit
    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'open';
      this.nextAttemptTime = Date.now() + this.config.recoveryTimeout;

      logger.error(`Circuit breaker '${this.name}' opened`, {
        failureCount: this.failureCount,
        recoveryTimeout: this.config.recoveryTimeout,
        nextAttemptTime: this.nextAttemptTime,
      });
    }
  }

  /**
   * Start monitoring circuit health
   */
  private startMonitoring(): void {
    setInterval(() => {
      this.monitorHealth();
    }, this.config.monitorInterval);
  }

  /**
   * Monitor circuit health and log statistics
   */
  private monitorHealth(): void {
    const stats = this.getStats();

    // Log health metrics
    if (this.totalRequests > 0) {
      const failureRate = (this.totalFailures / this.totalRequests) * 100;

      logger.debug(`Circuit breaker '${this.name}' health check`, {
        state: stats.state,
        failureRate: `${failureRate.toFixed(2)}%`,
        totalRequests: stats.totalRequests,
        totalFailures: stats.totalFailures,
        lastFailureTime: stats.lastFailureTime,
        lastSuccessTime: stats.lastSuccessTime,
      });
    }
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
    };
  }

  /**
   * Reset circuit breaker to closed state
   */
  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.lastSuccessTime = 0;
    this.nextAttemptTime = 0;

    logger.info(`Circuit breaker '${this.name}' reset`);
  }

  /**
   * Force circuit to open state
   */
  forceOpen(): void {
    this.state = 'open';
    this.nextAttemptTime = Date.now() + this.config.recoveryTimeout;

    logger.warn(`Circuit breaker '${this.name}' forced open`);
  }

  /**
   * Check if circuit is open
   */
  isOpen(): boolean {
    return this.state === 'open';
  }

  /**
   * Check if circuit is closed
   */
  isClosed(): boolean {
    return this.state === 'closed';
  }

  /**
   * Check if circuit is half-open
   */
  isHalfOpen(): boolean {
    return this.state === 'half-open';
  }

  /**
   * Get time until next attempt
   */
  getTimeUntilNextAttempt(): number {
    if (this.state !== 'open') {
      return 0;
    }

    const timeRemaining = this.nextAttemptTime - Date.now();
    return Math.max(0, timeRemaining);
  }
}

export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

/**
 * Circuit breaker manager for managing multiple circuit breakers
 */
export class CircuitBreakerManager {
  private static instance: CircuitBreakerManager;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  private constructor() {}

  static getInstance(): CircuitBreakerManager {
    if (!CircuitBreakerManager.instance) {
      CircuitBreakerManager.instance = new CircuitBreakerManager();
    }
    return CircuitBreakerManager.instance;
  }

  /**
   * Get or create a circuit breaker
   */
  getCircuitBreaker(
    name: string,
    config?: CircuitBreakerConfig
  ): CircuitBreaker {
    if (!this.circuitBreakers.has(name)) {
      this.circuitBreakers.set(name, new CircuitBreaker(name, config));
    }

    return this.circuitBreakers.get(name)!;
  }

  /**
   * Get all circuit breaker statistics
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};

    for (const [name, circuitBreaker] of this.circuitBreakers.entries()) {
      stats[name] = circuitBreaker.getStats();
    }

    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const circuitBreaker of this.circuitBreakers.values()) {
      circuitBreaker.reset();
    }

    logger.info('All circuit breakers reset');
  }

  /**
   * Get circuit breaker names
   */
  getCircuitBreakerNames(): string[] {
    return Array.from(this.circuitBreakers.keys());
  }
}
