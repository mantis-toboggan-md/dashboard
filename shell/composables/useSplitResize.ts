import { nextTick, Ref, ref } from 'vue';

/**
 * Pointer and keyboard handlers for a separator between two columns of a container.
 *
 * `percent` is the width of the first column, as a percentage of the container width,
 * so the split keeps its ratio when the window resizes.
 * Limits on the width belong in the css that uses `percent`, e.g. clamp() in grid-template-columns.
 * After each drag or key press `percent` is re-read from the separator position, so it matches the limited width.
 */
export const useSplitResize = (container: Ref<HTMLElement | null | undefined>, { initial = 25, step = 2 } = {}) => {
  const percent = ref(initial);
  const resizing = ref(false);

  // distance from the left edge of the separator to the pointer, kept constant while dragging
  let grabOffset = 0;

  const toPercent = (x: number) => {
    const rect = container.value?.getBoundingClientRect();

    if (!rect?.width) {
      return percent.value;
    }

    return (x - rect.left) / rect.width * 100;
  };

  // the left edge of the separator is the right edge of the first column
  const settle = async(handle: HTMLElement) => {
    await nextTick();
    percent.value = toPercent(handle.getBoundingClientRect().left);
  };

  const onPointerdown = (event: PointerEvent) => {
    const handle = event.currentTarget as HTMLElement;

    grabOffset = event.clientX - handle.getBoundingClientRect().left;
    // pointermove and pointerup go to the separator while the pointer is outside it
    // the capture is released by the browser after pointerup or pointercancel
    handle.setPointerCapture(event.pointerId);
    resizing.value = true;
  };

  const onPointermove = (event: PointerEvent) => {
    if (resizing.value) {
      percent.value = toPercent(event.clientX - grabOffset);
    }
  };

  const onPointerup = (event: PointerEvent) => {
    if (!resizing.value) {
      return;
    }

    resizing.value = false;
    settle(event.currentTarget as HTMLElement);
  };

  const onKeydown = (event: KeyboardEvent) => {
    const direction = ({ ArrowLeft: -1, ArrowRight: 1 } as Record<string, number>)[event.key];

    if (!direction) {
      return;
    }

    event.preventDefault();

    const handle = event.currentTarget as HTMLElement;

    percent.value = toPercent(handle.getBoundingClientRect().left) + direction * step;
    settle(handle);
  };

  return {
    percent, resizing, onPointerdown, onPointermove, onPointerup, onKeydown
  };
};
