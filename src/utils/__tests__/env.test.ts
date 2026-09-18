/**
 * @jest-environment jsdom
 */
import { isLocalhostHost } from '../env';

describe('isLocalhostHost', () => {
  const originalLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true });
  });

  function setHostname(hostname: string) {
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, hostname },
      writable: true,
    });
  }

  it('should return true for localhost', () => {
    setHostname('localhost');
    expect(isLocalhostHost()).toBe(true);
  });

  it('should return true for 127.0.0.1', () => {
    setHostname('127.0.0.1');
    expect(isLocalhostHost()).toBe(true);
  });

  it('should return false for a production hostname', () => {
    setHostname('ascend.asix.live');
    expect(isLocalhostHost()).toBe(false);
  });
});
