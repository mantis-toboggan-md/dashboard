<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { RouteLocationRaw, useRouter } from 'vue-router';
import { Banner } from '@components/Banner';
import { RcButton } from '@components/RcButton';
import { useI18n } from '@shell/composables/useI18n';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor.vue';
import ResourceGraph from '@shell/components/ResourceYaml/ResourceGraph.vue';
import { ResourceGraphNode } from '@shell/components/ResourceYaml/types';
import { useResourceYamlFolding } from '@shell/composables/useResourceYamlFolding';
import { useSplitResize } from '@shell/composables/useSplitResize';
import { keyForResource } from '@shell/utils/resource-key';
import { fromEditorYaml, toEditorYaml } from '@shell/utils/related-resources/yaml';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { saveWithConflictRetry } from '@shell/plugins/dashboard-store/normalize';
import {
  RelatedResource,
  RelatedResourceBanner,
  RelatedResourceContext,
  RelatedResourcesEditorState,
  ResourceModel,
} from '@shell/core/types';

// parent layout classes (e.g. cru-resource's .resource-container) would override the root grid
defineOptions({ inheritAttrs: false });

const props = defineProps<{
  value: ResourceModel,

  /** edited alongside `value`, each carrying its own save hooks, banner and groupKey */
  relatedResources: RelatedResource[],

  /** where to go once every resource is saved: a route name for `value`'s type, or a route */
  doneRoute?: string | RouteLocationRaw | null,

  /** called, or navigated to, in place of `doneRoute` */
  doneOverride?:(() => void) | RouteLocationRaw | null,
}>();

const emit = defineEmits<{ error: [errors: any[]] }>();

const store = useStore();
const router = useRouter();
const i18n = useI18n(store);

// as SingleResourceYaml's `done`
const done = () => {
  if (props.doneOverride) {
    return typeof props.doneOverride === 'function' ? props.doneOverride() : router.replace(props.doneOverride);
  }

  if (!props.doneRoute) {
    return;
  }

  router.replace(typeof props.doneRoute === 'object' ? props.doneRoute : { name: props.doneRoute, params: { resource: props.value.type } });
};

// handed to the related resources' compute functions and save hooks
// tracks which resource is currently shown in the yaml editor, as well as yaml editor state for each resource
const editorState = reactive<RelatedResourcesEditorState>({
  yaml:     {},
  selected: keyForResource(props.value) || null,
});

const primaryId = computed(() => keyForResource(props.value) || 'primary');

// `nodeId` is set when the tree was flattened; the fallbacks let a plain list work unflattened
const nodeIdFor = (entry: RelatedResource, i: number): string => entry.nodeId || keyForResource(entry.resource) || String(i);

// the node id of each entry of `relatedResources`, in the same order
const relatedIds = computed(() => props.relatedResources.map(nodeIdFor));

// -1 for the primary resource, which has no entry in `relatedResources`
const relatedIndexOf = (nodeId: string | null): number => (nodeId ? relatedIds.value.indexOf(nodeId) : -1);

// the store's copy of the primary resource once saved
// `value` is a clone for editing, which the save does not update
const savedPrimary = ref<ResourceModel | null>(null);

const primaryResource = computed<ResourceModel>(() => savedPrimary.value || props.value);

// resources a save created in place of the one loaded, for example a replacement for an immutable resource, keyed by node id
// the node keeps its id, so its selection and children stay attached to it
const replacedResources = reactive<{ [nodeId: string]: ResourceModel }>({});

watch(() => props.value, (neu) => {
  editorState.selected = keyForResource(neu) || null;
  savedPrimary.value = null;
});

watch(() => props.relatedResources, () => {
  Object.keys(replacedResources).forEach((id) => delete replacedResources[id]);
});

// the resource of the entry at index `i` of `relatedResources`
const resourceAt = (i: number): ResourceModel => replacedResources[relatedIds.value[i]] || props.relatedResources[i].resource;

const resourceLabel = (resource: ResourceModel): string => resource?.nameDisplay || resource?.metadata?.name || resource?.id || '';

// the yaml of each resource as loaded, keyed by node id
// the store updates it in the background, e.g. status after a save
const initialYamlById = computed<{ [nodeId: string]: string }>(() => ({
  [primaryId.value]: toEditorYaml(primaryResource.value),
  ...Object.fromEntries(relatedIds.value.map((id, i) => [id, toEditorYaml(resourceAt(i))])),
}));

// the yaml each entry of `editorState.yaml` started from, keyed by node id
// fixed when the entry is added, so a background update to `initialYamlById` does not mark the resource modified
const seededYaml = reactive<{ [nodeId: string]: string }>({});

// what the yaml in the editor is compared with, for the diff view and to find the modified resources
const baselineYamlById = computed<{ [nodeId: string]: string }>(() => ({ ...initialYamlById.value, ...seededYaml }));

// a save function can write the yaml of a resource that was never shown in the editor
const seedUnseededYaml = () => {
  Object.keys(editorState.yaml).forEach((id) => {
    if (!(id in seededYaml) && id in initialYamlById.value) {
      seededYaml[id] = initialYamlById.value[id];
    }
  });
};

// ids of resources whose editor content differs from what it started from
// a resource never opened in the editor has no entry in `editorState.yaml`, so is not modified
const modifiedIds = computed(() => new Set(
  Object.keys(editorState.yaml).filter((id) => id in baselineYamlById.value && editorState.yaml[id] !== baselineYamlById.value[id])
));

const contextFor = (i: number): RelatedResourceContext => ({
  resource:         resourceAt(i),
  relatedResources: props.relatedResources,
  primaryResource:  primaryResource.value,
  editorState,
  nodeId:           relatedIds.value[i],
  primaryNodeId:    primaryId.value,
  // a getter, so a banner reading nothing from it does not re-evaluate when any resource changes
  get initialYaml() {
    return baselineYamlById.value;
  },
  saveResource: (nodeId: string) => saveNode(nodeId),
});

// one `computed` per related resource, in the same order as `relatedResources`
// so a banner re-evaluates only when the state it read changes
// extensions define a plain function, the `computed` is created here
const bannerRefs = computed(() => props.relatedResources.map((entry, i) => computed<RelatedResourceBanner | null>(() => {
  if (typeof entry.banner !== 'function') {
    return null;
  }

  try {
    return entry.banner(contextFor(i)) || null;
  } catch (e) {
    // TODO nb localize? Growl?
    console.warn('Failed to resolve banner for related resource', entry.resource?.id, e); // eslint-disable-line no-console

    return null;
  }
})));

// the primary resource is the root of the graph
// a related resource without `parentId` is shown below it, one with `parentId` below the resource that contributed it
const graphNodes = computed<ResourceGraphNode[]>(() => [
  {
    id:       primaryId.value,
    label:    resourceLabel(props.value),
    group:    props.value?.typeDisplay || props.value?.type || undefined,
    modified: modifiedIds.value.has(primaryId.value),
  },
  ...props.relatedResources.map((entry, i) => ({
    id:       relatedIds.value[i],
    parentId: entry.parentId || primaryId.value,
    label:    resourceLabel(resourceAt(i)),
    group:    entry.group || (entry.groupKey ? i18n.t(entry.groupKey) : undefined),
    modified: modifiedIds.value.has(relatedIds.value[i]),
    ...(entry.readOnly ? { readOnly: true } : {}),
  })),
]);

// -1 while the primary resource is selected
const selectedIndex = computed(() => relatedIndexOf(editorState.selected));

const selectedEntry = computed<RelatedResource | undefined>(() => props.relatedResources[selectedIndex.value]);

const selectedResource = computed<ResourceModel>(() => (selectedEntry.value ? resourceAt(selectedIndex.value) : primaryResource.value));

const selectedReadOnly = computed(() => !!selectedEntry.value?.readOnly);

const selectedBanner = computed(() => bannerRefs.value[selectedIndex.value]?.value || null);

const selectedModified = computed(() => !!editorState.selected && modifiedIds.value.has(editorState.selected));

// what the diff view compares the editor with
const selectedBaseline = computed(() => (editorState.selected && baselineYamlById.value[editorState.selected]) ?? toEditorYaml(selectedResource.value));

// what is currently displayed in the yaml editor
// a resource is seeded from the yaml it was loaded with the first time it is shown, and again after it is saved
const currentYaml = computed({
  get(): string {
    const id = editorState.selected;

    if (!id) {
      return '';
    }

    if (!(id in editorState.yaml)) {
      const initial = initialYamlById.value[id] ?? toEditorYaml(selectedResource.value);

      seededYaml[id] = initial;
      editorState.yaml[id] = initial;
    }

    return editorState.yaml[id];
  },

  set(value: string) {
    if (editorState.selected) {
      editorState.yaml[editorState.selected] = value;
    }
  },
});

// runs on every mount of the editor: selecting a resource, leaving diff view and saving each remount it
// `status` is folded only while editable, as in SingleResourceYaml
const { foldYaml } = useResourceYamlFolding(selectedResource, () => !selectedReadOnly.value);

const showDiff = ref(false);

// a diff with no changes is empty, so leave diff view once there is nothing to compare
// switching resource also leaves it, so the next resource opens ready to edit
watch([selectedModified, () => editorState.selected], ([modified], [, prevSelected]) => {
  if (!modified || editorState.selected !== prevSelected) {
    showDiff.value = false;
  }
});

const editorMode = computed(() => {
  if (showDiff.value) {
    return EDITOR_MODES.DIFF_CODE;
  }

  return selectedReadOnly.value ? EDITOR_MODES.VIEW_CODE : EDITOR_MODES.EDIT_CODE;
});

const DIFF_MODES = ['unified', 'split'] as const;

// YamlEditor shows a unified diff for any `diffMode` other than split
const isDiffMode = (diffMode: string, mode: typeof DIFF_MODES[number]) => (diffMode === 'split') === (mode === 'split');

const container = ref<HTMLElement>();
const split = reactive(useSplitResize(container));

const saving = ref(false);

// YamlEditor reads `value` only in data(), so a saved resource needs a remount to show its new yaml
const editorRevision = ref(0);

// the primary resource, and a related resource that defines no `save`, are saved by their own model's `save`
// the yaml is classified in the resource's own store for that, with the steve fields the yaml leaves out
// a resource that was never opened is saved from its baseline yaml
// a 409 from a change made in the background, e.g. to status, is resolved against the baseline, the yaml the edits were made to
const saveClassified = async(resource: ResourceModel, nodeId: string): Promise<ResourceModel> => {
  const baseline = baselineYamlById.value[nodeId];
  const classified = await resource.$dispatch('create', fromEditorYaml(resource, editorState.yaml[nodeId] ?? baseline));

  await saveWithConflictRetry(classified, fromEditorYaml(resource, baseline));

  // the save updates the store's copy, not `classified`
  return classified.$getters['byId'](classified.type, classified.id) || classified;
};

// the saved resource is the new initial state, so the editor is seeded from it again
const resetEditorState = (nodeId: string) => {
  delete editorState.yaml[nodeId];
  delete seededYaml[nodeId];
  editorRevision.value++;
};

// saves one resource without setting `saving`, so a save hook can save another one through `saveResource`
// resolves to null when the `beforeSaveHook` cancelled the save
const saveNode = async(nodeId: string): Promise<ResourceModel | null> => {
  if (nodeId === primaryId.value) {
    savedPrimary.value = await saveClassified(primaryResource.value, nodeId);
    resetEditorState(nodeId);

    return savedPrimary.value;
  }

  const i = relatedIndexOf(nodeId);

  if (i < 0) {
    throw new Error(`No resource in the editor has the node id ${ nodeId }`);
  }

  const entry = props.relatedResources[i];
  const ctx = contextFor(i);

  if (await entry.beforeSaveHook?.(ctx) === false) {
    return null;
  }

  let saved: ResourceModel;

  try {
    saved = typeof entry.save === 'function' ? await entry.save(ctx) : await saveClassified(ctx.resource, nodeId);
  } finally {
    // the save can write the yaml of other resources, e.g. the primary resource's
    seedUnseededYaml();
  }

  const savedKey = keyForResource(saved);

  if (savedKey && savedKey !== keyForResource(ctx.resource)) {
    replacedResources[nodeId] = saved;
  }

  resetEditorState(nodeId);

  // a new context, so `resource` is the replacement where the save replaced the resource
  await entry.afterSaveHook?.(contextFor(i));

  return saved || resourceAt(i);
};

// the running save, kept so cancel can wait for it
// resolves to true when the save left the editor, as save all does once every resource is saved
let pendingSave: Promise<boolean> | null = null;

// one save at a time, started from a save button
const runSave = (save: () => Promise<boolean | void>): Promise<boolean> => {
  pendingSave = (async() => {
    saving.value = true;

    try {
      return !!await save();
    } catch (err) {
      emit('error', exceptionToErrorsArray(err));

      return false;
    } finally {
      seedUnseededYaml();
      saving.value = false;
    }
  })();

  return pendingSave;
};

// resolves to nothing, as saving one resource stays in the editor
const saveOne = (nodeId: string) => runSave(async() => {
  await saveNode(nodeId);
});

// dependencies deepest first, then the primary resource, then the resources that use it
// read-only resources are shown in view mode, so are never modified
const saveOrder = computed<string[]>(() => {
  const editable = props.relatedResources
    .map((entry, i) => ({ entry, id: relatedIds.value[i] }))
    .filter(({ entry }) => !entry.readOnly);
  const dependencies = editable
    .filter(({ entry }) => !entry.dependent)
    .sort((a, b) => (b.entry.depth || 1) - (a.entry.depth || 1));
  const dependents = editable.filter(({ entry }) => entry.dependent);

  return [...dependencies, { id: primaryId.value }, ...dependents].map(({ id }) => id);
});

const canSaveAll = computed(() => !saving.value && saveOrder.value.some((id) => modifiedIds.value.has(id)));

const saveAll = () => runSave(async() => {
  for (const nodeId of saveOrder.value) {
    // checked for each resource, as a save can save or change another one, e.g. the primary resource
    if (modifiedIds.value.has(nodeId) && !await saveNode(nodeId)) {
      return;
    }
  }

  done();

  return true;
});

// a running save finishes first, its after save hooks included, as `saveNode` awaits them
const cancel = async() => {
  if (!await pendingSave) {
    done();
  }
};

// the save path and the parent both read the editor's unsaved state
defineExpose({ editorState });
</script>

<template>
  <div
    ref="container"
    class="multi-yaml-container"
    :class="{ 'multi-yaml-container--resizing': split.resizing }"
    :style="{ '--graph-width': `${ split.percent }%` }"
  >
    <ResourceGraph
      class="multi-yaml-resource-graph"
      :nodes="graphNodes"
      :selected="editorState.selected"
      :saving="saving"
      @select="editorState.selected = $event"
      @save="saveOne"
    />
    <div
      class="multi-yaml-resize"
      role="separator"
      tabindex="0"
      aria-orientation="vertical"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="Math.round(split.percent)"
      :aria-label="i18n.t('resourceYaml.resourceGraph.resize')"
      data-testid="multi-yaml-resize"
      @pointerdown="split.onPointerdown"
      @pointermove="split.onPointermove"
      @pointerup="split.onPointerup"
      @pointercancel="split.onPointerup"
      @keydown="split.onKeydown"
    >
      <i
        class="icon icon-lg icon-actions"
        aria-hidden="true"
      />
    </div>
    <div class="multi-yaml-editor-container">
      <Transition
        name="yaml-fade"
        mode="out-in"
      >
        <div
          v-if="editorState.selected"
          :key="`${editorState.selected}-${editorRevision}`"
          class="multi-yaml-editor"
          :class="{ 'multi-yaml-editor--diff': showDiff }"
        >
          <Banner
            v-if="selectedBanner"
            :color="selectedBanner.color || 'info'"
            :label="selectedBanner.label"
            :label-key="selectedBanner.labelKey"
            :icon="selectedBanner.icon"
          />
          <div class="multi-yaml-code">
            <!-- YamlEditor remounts when mode changes, the diff toggle stays mounted so it keeps focus -->
            <Transition
              name="yaml-fade"
              mode="out-in"
            >
              <YamlEditor
                :key="String(showDiff)"
                v-model:value="currentYaml"
                :initial-yaml-values="selectedBaseline"
                :editor-mode="editorMode"
                :diff-context="Number.MAX_SAFE_INTEGER"
                @onReady="foldYaml"
              >
                <template #preview-buttons="{ diffMode, setDiffMode }">
                  <div
                    class="multi-yaml-diff-mode"
                    data-testid="multi-yaml-diff-mode"
                  >
                    <RcButton
                      v-for="mode in DIFF_MODES"
                      :key="mode"
                      size="small"
                      :variant="isDiffMode(diffMode, mode) ? 'tertiary' : 'secondary'"
                      :aria-pressed="isDiffMode(diffMode, mode)"
                      @click="setDiffMode(mode)"
                    >
                      {{ i18n.t(`generic.${ mode }`) }}
                    </RcButton>
                  </div>
                </template>
              </YamlEditor>
            </Transition>
            <RcButton
              v-if="selectedModified"
              variant="tertiary"
              size="small"
              class="multi-yaml-diff-toggle"
              :aria-pressed="showDiff"
              data-testid="multi-yaml-diff-toggle"
              @click="showDiff = !showDiff"
            >
              {{ i18n.t(showDiff ? 'resourceYaml.buttons.hideDiff' : 'resourceYaml.buttons.diff') }}
            </RcButton>
          </div>
        </div>
      </Transition>
    </div>
    <div class="multi-yaml-footer">
      <RcButton
        variant="secondary"
        data-testid="multi-yaml-cancel"
        @click="cancel"
      >
        {{ i18n.t('generic.cancel') }}
      </RcButton>
      <RcButton
        variant="primary"
        :disabled="!canSaveAll"
        data-testid="multi-yaml-save"
        @click="saveAll"
      >
        {{ i18n.t('resourceYaml.buttons.saveAll') }}
      </RcButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.multi-yaml-container {
  display: grid;
  // --graph-width is set from useSplitResize, the limits of the graph width are the clamp() bounds
  grid-template-columns: clamp(200px, var(--graph-width), 60%) 16px 1fr;
  grid-template-rows: 1fr auto;
  grid-template-areas:
    "graph resize editor"
    "footer footer footer";
  row-gap: 16px;

  // fill vertical space below the masthead - graph and editor scroll independently
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;

  // the pointer can leave the separator while dragging, so the cursor is set on the whole container
  // user-select stops the drag from selecting text in the graph and editor
  &--resizing {
    cursor: col-resize;
    user-select: none;
  }

  @media (max-width: map-get($breakpoints, '--viewport-7')) {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 2fr auto;
    grid-template-areas:
      "graph"
      "editor"
      "footer";
  }
}

.multi-yaml-resource-graph,
.multi-yaml-editor-container {
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.multi-yaml-resource-graph {
  grid-area: graph;
}

// the icon is centred in the 16px column, the whole column receives the pointer
.multi-yaml-resize {
  grid-area: resize;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: col-resize;
  // on touch screens a drag moves the separator instead of scrolling the page
  touch-action: none;
  color: var(--primary);

  &:focus-visible {
    @include focus-outline;
  }

  @media (max-width: map-get($breakpoints, '--viewport-7')) {
    display: none;
  }
}

.multi-yaml-editor-container {
  grid-area: editor;
  display: flex;
  flex-direction: column;
  background-color: var(--rc-cm-bg);
}

.multi-yaml-editor {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;

  & :deep(.banner) {
    flex-shrink: 0;
    margin: 0;
  }

  & :deep(.yaml-editor) {
    flex: 1 1 0;
    min-height: 0;
    overflow: auto;
  }

  // FileDiff scrolls itself: it sets its own height in fit() and has overflow: auto
  &--diff :deep(.yaml-editor) {
    overflow: hidden;
  }
}

// the editor scrolls inside this, so the diff toggle stays in the top-right corner
.multi-yaml-code {
  position: relative;
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

// over the top-left corner of the editor, opposite the diff toggle, in place of YamlEditor's row above the diff
// positioned against .multi-yaml-code, outside the overflow of the diff, so it stays in place as the diff scrolls
.multi-yaml-diff-mode {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 1;
  display: flex;
  gap: 8px;
}

.multi-yaml-diff-toggle {
  position: absolute;
  top: 8px;
  right: 17px;
  z-index: 1;
}

// out-in runs leave then enter, so the total switch time is the sum of both durations
.yaml-fade-leave-active {
  transition: opacity 0.1s;
}

.yaml-fade-leave-to {
  opacity: 0;
}

// mask is used to create a top-down fade-in effect
.yaml-fade-enter-active {
  mask-image: linear-gradient(to bottom, #000 33.3%, transparent 66.6%);
  mask-size: 100% 300%;
  mask-repeat: no-repeat;
  mask-position: 0 0;
  transition: mask-position 0.3s ease-out;
}

.yaml-fade-enter-from {
  mask-position: 0 100%;
}

.multi-yaml-footer {
  grid-area: footer;
  padding: 12px var(--gap);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
