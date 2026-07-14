import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RedirectService } from '../services/redirect.service';
import { RedirectStatus } from '../models/redirect.domain';
import { LinkRepository } from '../../links/repositories/link.repository';

vi.mock('../../links/repositories/link.repository');
vi.mock('../../redirect/services/redis-cache.service', () => ({
  RedisCacheService: {
    formatLinkKey: vi.fn(),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('RedirectService', () => {
  let service: RedirectService;
  let mockRepo: any;

  const mockLink = (overrides = {}) => ({
    id: 'link-1',
    userId: 'user-1',
    destinationUrl: 'https://example.com',
    alias: 'test123',
    passwordHash: null,
    startsAt: null,
    expiresAt: null,
    fallbackUrl: null,
    status: 'ACTIVE',
    trafficVariants: null,
    rules: [],
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RedirectService();
    mockRepo = vi.mocked(LinkRepository.prototype);
  });

  it('should return SUCCESS for an active link', async () => {
    mockRepo.findByAlias.mockResolvedValue(mockLink());
    const result = await service.resolveAlias('test123', '127.0.0.1', 'test-agent');
    expect(result.status).toBe(RedirectStatus.SUCCESS);
    expect(result.destinationUrl).toBe('https://example.com');
  });

  it('should return NOT_FOUND when link does not exist', async () => {
    mockRepo.findByAlias.mockResolvedValue(null);
    const result = await service.resolveAlias('nonexistent', '127.0.0.1', 'test-agent');
    expect(result.status).toBe(RedirectStatus.NOT_FOUND);
  });

  it('should return INACTIVE when link is disabled', async () => {
    mockRepo.findByAlias.mockResolvedValue(mockLink({ status: 'DISABLED' }));
    const result = await service.resolveAlias('test123', '127.0.0.1', 'test-agent');
    expect(result.status).toBe(RedirectStatus.INACTIVE);
  });

  it('should return INACTIVE when link is archived', async () => {
    mockRepo.findByAlias.mockResolvedValue(mockLink({ status: 'ARCHIVED' }));
    const result = await service.resolveAlias('test123', '127.0.0.1', 'test-agent');
    expect(result.status).toBe(RedirectStatus.INACTIVE);
  });

  it('should return INACTIVE when link is deleted', async () => {
    mockRepo.findByAlias.mockResolvedValue(mockLink({ status: 'DELETED' }));
    const result = await service.resolveAlias('test123', '127.0.0.1', 'test-agent');
    expect(result.status).toBe(RedirectStatus.INACTIVE);
  });

  it('should return INACTIVE when link has not started yet', async () => {
    mockRepo.findByAlias.mockResolvedValue(mockLink({
      startsAt: new Date(Date.now() + 86400000),
    }));
    const result = await service.resolveAlias('test123', '127.0.0.1', 'test-agent');
    expect(result.status).toBe(RedirectStatus.INACTIVE);
  });

  it('should return EXPIRED when link has expired', async () => {
    mockRepo.findByAlias.mockResolvedValue(mockLink({
      expiresAt: new Date(Date.now() - 86400000),
    }));
    const result = await service.resolveAlias('test123', '127.0.0.1', 'test-agent');
    expect(result.status).toBe(RedirectStatus.EXPIRED);
  });

  it('should return PASSWORD_REQUIRED when link is password protected', async () => {
    mockRepo.findByAlias.mockResolvedValue(mockLink({
      passwordHash: '$2b$10$somehash',
    }));
    const result = await service.resolveAlias('test123', '127.0.0.1', 'test-agent');
    expect(result.status).toBe(RedirectStatus.PASSWORD_REQUIRED);
  });

  it('should use fallbackUrl when INACTIVE link has one', async () => {
    mockRepo.findByAlias.mockResolvedValue(mockLink({
      status: 'DISABLED',
      fallbackUrl: 'https://fallback.com',
    }));
    const result = await service.resolveAlias('test123', '127.0.0.1', 'test-agent');
    expect(result.status).toBe(RedirectStatus.INACTIVE);
    expect(result.fallbackUrl).toBe('https://fallback.com');
  });

  it('should normalize URLs without protocol', async () => {
    mockRepo.findByAlias.mockResolvedValue(mockLink({
      destinationUrl: 'example.com',
    }));
    const result = await service.resolveAlias('test123', '127.0.0.1', 'test-agent');
    expect(result.destinationUrl).toBe('https://example.com');
  });

  it('should preserve URLs with https protocol', async () => {
    mockRepo.findByAlias.mockResolvedValue(mockLink({
      destinationUrl: 'https://example.com/path?q=1',
    }));
    const result = await service.resolveAlias('test123', '127.0.0.1', 'test-agent');
    expect(result.destinationUrl).toBe('https://example.com/path?q=1');
  });

  it('should include link metadata on success', async () => {
    mockRepo.findByAlias.mockResolvedValue(mockLink());
    const result = await service.resolveAlias('test123', '127.0.0.1', 'test-agent');
    expect(result.linkId).toBe('link-1');
    expect(result.alias).toBe('test123');
    expect(result.ownerId).toBe('user-1');
  });
});
