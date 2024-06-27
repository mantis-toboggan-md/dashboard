import { stringFor } from '@shell/plugins/i18n';
import { useStore } from '@shell/composables/useStore';

/**
 * Allows for consuming i18n strings with the Vue composition API.
 * @param key - The key for the i18n string to translate.
 * @param args - An object or array containing arguments for the translation function.
 * @param raw - A boolean determining if the string returned is a raw representation.
 * @returns A translated string or the raw value if the raw parameter is set to true.
 */
export const t = (key: string, args?: unknown, raw?: boolean): unknown => {
  const store = useStore();

  return stringFor(store, key, args, raw);
};
