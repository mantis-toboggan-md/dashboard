import { initialExtensionEnabled, resolveExtensionEnabled } from '@shell/core/plugin-helpers';

describe('fx: initialExtensionEnabled', () => {
  it('should be visible when no enabled field is set', () => {
    expect(initialExtensionEnabled({ name: 'a' })).toBe(true);
  });

  it('should be visible when enabled is true', () => {
    expect(initialExtensionEnabled({ name: 'a', enabled: true })).toBe(true);
  });

  it('should be hidden when enabled is false', () => {
    expect(initialExtensionEnabled({ name: 'a', enabled: false })).toBe(false);
  });

  it('should be hidden while an async predicate is still pending', () => {
    expect(initialExtensionEnabled({ name: 'a', enabled: () => true })).toBe(false);
  });

  it('should coerce a truthy non-boolean to visible', () => {
    expect(initialExtensionEnabled({ name: 'a', enabled: 'yes' })).toBe(true);
  });

  it('should tolerate a nullish item', () => {
    expect(initialExtensionEnabled(undefined)).toBe(true);
  });
});

describe('fx: resolveExtensionEnabled', () => {
  const ctx = { resource: { id: 'foo' } };

  it('should be visible when no enabled field is set', async() => {
    await expect(resolveExtensionEnabled({ name: 'a' }, ctx)).resolves.toBe(true);
  });

  it('should pass through a boolean enabled', async() => {
    await expect(resolveExtensionEnabled({ name: 'a', enabled: true }, ctx)).resolves.toBe(true);
    await expect(resolveExtensionEnabled({ name: 'a', enabled: false }, ctx)).resolves.toBe(false);
  });

  it('should resolve a sync predicate', async() => {
    await expect(resolveExtensionEnabled({ name: 'a', enabled: () => true }, ctx)).resolves.toBe(true);
    await expect(resolveExtensionEnabled({ name: 'a', enabled: () => false }, ctx)).resolves.toBe(false);
  });

  it('should resolve an async predicate', async() => {
    const enabled = () => Promise.resolve(true);

    await expect(resolveExtensionEnabled({ name: 'a', enabled }, ctx)).resolves.toBe(true);
  });

  it('should pass the context to the predicate', async() => {
    const enabled = jest.fn().mockReturnValue(true);

    await resolveExtensionEnabled({ name: 'a', enabled }, ctx);

    expect(enabled).toHaveBeenCalledTimes(1);
    expect(enabled).toHaveBeenCalledWith(ctx);
  });

  it('should coerce a truthy non-boolean return to visible', async() => {
    await expect(resolveExtensionEnabled({ name: 'a', enabled: () => 'yes' }, ctx)).resolves.toBe(true);
  });

  it('should hide, not throw, when a predicate throws synchronously', async() => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const enabled = () => {
      throw new Error('nope');
    };

    await expect(resolveExtensionEnabled({ name: 'a', enabled }, ctx)).resolves.toBe(false);
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });

  it('should hide, not throw, when a predicate rejects', async() => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const enabled = () => Promise.reject(new Error('nope'));

    await expect(resolveExtensionEnabled({ name: 'a', enabled }, ctx)).resolves.toBe(false);
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });
});
