import type { IPlatformPublisher } from '../../domain/ports/IPlatformPublisher';
import type { IContentAdapter } from '../../domain/ports/IContentAdapter';
import type { PlatformCode } from '../../shared/constants';

type PublisherFactory = () => IPlatformPublisher;

/**
 * Central registry that maps platform codes to their adapter factories.
 * This is the ONLY place in the codebase that knows about concrete adapter classes.
 *
 * To add a new platform: register its factory here — no other code changes needed.
 */
class PlatformRegistry {
  private readonly publishers = new Map<PlatformCode, PublisherFactory>();

  /** Register a platform adapter factory */
  register(code: PlatformCode, factory: PublisherFactory): void {
    this.publishers.set(code, factory);
  }

  /** Get a publisher for the given platform */
  getPublisher(code: PlatformCode): IPlatformPublisher {
    const factory = this.publishers.get(code);
    if (!factory) throw new Error(`No publisher registered for platform: ${code}`);
    return factory();
  }

  /** Get only the content adapter for a platform (without full publisher) */
  getContentAdapter(code: PlatformCode): IContentAdapter {
    return this.getPublisher(code).getContentAdapter();
  }

  /** List all registered platform codes */
  getRegisteredCodes(): PlatformCode[] {
    return Array.from(this.publishers.keys());
  }

  /** Check if a platform is registered */
  isRegistered(code: PlatformCode): boolean {
    return this.publishers.has(code);
  }

  /** Remove a platform from the registry */
  unregister(code: PlatformCode): void {
    this.publishers.delete(code);
  }
}

/** Global singleton instance */
export const platformRegistry = new PlatformRegistry();
