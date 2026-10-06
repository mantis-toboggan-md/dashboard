<script setup lang="ts">
import {
  computed, reactive, ref, watch, ComputedRef
} from 'vue';
import { useStore } from 'vuex';
import { RouteLocationRaw, useRouter } from 'vue-router';
import { Banner } from '@components/Banner';
import { RcButton } from '@components/RcButton';
import { useI18n } from '@shell/composables/useI18n';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor.vue';
import ResourceGraph from '@shell/components/ResourceYaml/ResourceGraph.vue';
import { ResourceGraphNode } from '@shell/components/ResourceYaml/types';
import { useResourceYamlFolding } from '@shell/composables/useResourceYamlFolding';
import { keyForResource } from '@shell/utils/resource-key';
import jsyaml from 'js-yaml';
import { saferDump } from '@shell/utils/create-yaml';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { saveWithConflictRetry } from '@shell/plugins/dashboard-store/normalize';
import {
  EditableRelatedResource,
  EditableRelatedResourceBanner,
  EditableRelatedResourceContext,
  EditableRelatedResourcesEditorState,
  EditableResource,
} from '@shell/core/types';

// parent layout classes (e.g. cru-resource's .resource-container) would override the root grid
defineOptions({ inheritAttrs: false });

const props = defineProps<{
  value: EditableResource,

  /** edited alongside `value`, each carrying its own save hooks, banner and groupKey */
  relatedResources: EditableRelatedResource[],

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
const editorState = reactive<EditableRelatedResourcesEditorState>({
  yaml:     {},
  selected: keyForResource(props.value) || null,
});

// the store's copy of the primary resource once saved
// `value` is a clone for editing, which the save does not update
const savedPrimary = ref<EditableResource | null>(null);

const primaryResource = computed<EditableResource>(() => savedPrimary.value || props.value);

watch(() => props.value, (neu) => {
  editorState.selected = keyForResource(neu) || null;
  savedPrimary.value = null;
});

const contextFor = (entry: EditableRelatedResource, i: number): EditableRelatedResourceContext => ({
  resource:         resourceFor(entry, i),
  relatedResources: props.relatedResources,
  primaryResource:  primaryResource.value,
  editorState,
  nodeId:           nodeIdFor(entry, i),
  primaryNodeId:    primaryId.value,
  // a getter, so a banner reading nothing from it does not re-evaluate when any resource changes
  get initialYaml() {
    return baselineYamlById.value;
  },
  saveResource: (nodeId: string) => saveNode(nodeId),
});

// one `computed` per related resource, in the same order as `relatedResources`
// per-banner `computed` limits re-evaluation to the state each banner actually read
// computed props are initialized here for better extension compatibility (ext only need to define plain functions)
const bannerRefs = computed<ComputedRef<EditableRelatedResourceBanner | null>[]>(() => props.relatedResources.map((entry, i) => computed(() => {
  if (typeof entry.banner !== 'function') {
    return null;
  }

  try {
    return entry.banner(contextFor(entry, i)) || null;
  } catch (e) {
    // TODO nb localize? Growl?
    console.warn('Failed to resolve banner for editable related resource', entry.resource?.id, e); // eslint-disable-line no-console

    return null;
  }
})));

const bannerFor = (index: number): EditableRelatedResourceBanner | null => bannerRefs.value[index]?.value || null;

const resourceLabel = (resource: EditableResource): string => resource?.nameDisplay ||
  resource?.metadata?.name ||
  resource?.id ||
  '';

// `nodeId` is set when the tree was flattened; the fallbacks let a plain list work unflattened
const nodeIdFor = (entry: EditableRelatedResource, i: number): string => entry.nodeId || keyForResource(entry.resource) || String(i);

// resources a save created in place of the one loaded, for example a replacement for an immutable resource, keyed by `nodeId`
// the node keeps its `nodeId`, so its selection and children stay attached to it
const replacedResources = reactive<{ [nodeId: string]: EditableResource }>({});

watch(() => props.relatedResources, () => {
  Object.keys(replacedResources).forEach((id) => delete replacedResources[id]);
});

const resourceFor = (entry: EditableRelatedResource, i: number): EditableResource => replacedResources[nodeIdFor(entry, i)] || entry.resource;

const primaryId = computed(() => keyForResource(props.value) || 'primary');

// initial resource state, used for diff view
const initialYamlFor = (resource: EditableResource): string => {
  if (!resource) {
    return '';
  }

  return saferDump(resource);
};

// map of initial yaml values, used for diff view and to visualize which resources changed in the resource graph
const initialYamlById = computed<{ [nodeId: string]: string }>(() => {
  const out: { [nodeId: string]: string } = { [primaryId.value]: initialYamlFor(primaryResource.value) };

  props.relatedResources.forEach((entry, i) => {
    out[nodeIdFor(entry, i)] = initialYamlFor(resourceFor(entry, i));
  });

  return out;
});

// the yaml each entry of `editorState.yaml` started from, keyed by `nodeId`
// fixed when the entry is added, as the store updates `initialYamlById` in the background (e.g. status after a save)
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

// primary resource first, then each related resource under its translated `groupKey`
// `parentId` nests a resource's group below the resource that contributed it, defaulting to the
// primary resource so that it is the only root and every related resource descends from it
// TODO nb wtf is this comment
const graphNodes = computed<ResourceGraphNode[]>(() => {
  const primary: ResourceGraphNode = {
    id:       primaryId.value,
    label:    resourceLabel(props.value),
    group:    props.value?.typeDisplay || props.value?.type || undefined,
    modified: modifiedIds.value.has(primaryId.value),
  };

  const related: ResourceGraphNode[] = props.relatedResources.map((entry, i) => {
    const id = nodeIdFor(entry, i);

    return {
      id,
      parentId: entry.parentId || primaryId.value,
      label:    resourceLabel(resourceFor(entry, i)),
      group:    entry.group || (entry.groupKey ? i18n.t(entry.groupKey) : undefined),
      modified: modifiedIds.value.has(id),
      ...(entry.readOnly ? { readOnly: true } : {}),
    };
  });

  return [primary, ...related];
});

// the index of the entry in `relatedResources`, or -1 for the primary resource, which has no entry
const relatedIndexOf = (nodeId: string | null): number => props.relatedResources.findIndex((entry, i) => nodeIdFor(entry, i) === nodeId);

// -1 when the primary resource is selected
// TODO nb why negative 1
const selectedRelatedIndex = computed(() => relatedIndexOf(editorState.selected));

const selectedBanner = computed(() => {
  const idx = selectedRelatedIndex.value;

  return idx >= 0 ? bannerFor(idx) : null;
});

const selectedResource = computed<EditableResource>(() => {
  const idx = selectedRelatedIndex.value;

  return idx >= 0 ? resourceFor(props.relatedResources[idx], idx) : primaryResource.value;
});

const selectedReadOnly = computed(() => !!props.relatedResources[selectedRelatedIndex.value]?.readOnly);

// what is currently displayed in the yaml editor
const currentYaml = computed({
  get(): string {
    const id = editorState.selected;

    if (!id) {
      return '';
    }

    if (!(id in editorState.yaml)) {
      const initial = initialYamlById.value[id] ?? initialYamlFor(selectedResource.value);

      seededYaml[id] = initial;
      editorState.yaml[id] = initial;
    }

    return editorState.yaml[id];
  },

  set(value: string) {
    const id = editorState.selected;

    if (id) {
      editorState.yaml[id] = value;
    }
  },
});

// runs on every mount of the editor: selecting a resource, leaving diff view and saving each remount it
// `status` is folded only while editable, as in SingleResourceYaml
const { foldYaml } = useResourceYamlFolding(selectedResource, () => !selectedReadOnly.value);

const selectedModified = computed(() => !!editorState.selected && modifiedIds.value.has(editorState.selected));

const showDiff = ref(false);

// a diff with no changes is empty, so leave diff view once there is nothing to compare
// switching resource also leaves it, so the next resource opens ready to edit
watch([selectedModified, () => editorState.selected], ([modified], [, prevSelected]) => {
  if (!modified || editorState.selected !== prevSelected) {
    showDiff.value = false;
  }
});

const saving = ref(false);

// YamlEditor reads `value` only in data(), so a saved resource needs a remount to show its new yaml
const editorRevision = ref(0);

// the primary resource, and a related resource that defines no `save`, are saved by their own model's `save`
// the edited yaml is classified in the resource's own store for that
// a 409 from a change made in the background, e.g. to status, is resolved against `initialYaml`, the yaml the edits were made to
const saveClassified = async(resource: EditableResource, yaml: string, initialYaml: string): Promise<EditableResource> => {
  const classified = await resource.$dispatch('create', jsyaml.load(yaml));

  await saveWithConflictRetry(classified, jsyaml.load(initialYaml));

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
const saveNode = async(nodeId: string): Promise<EditableResource | null> => {
  if (nodeId === primaryId.value) {
    savedPrimary.value = await saveClassified(primaryResource.value, editorState.yaml[nodeId] ?? initialYamlById.value[nodeId], baselineYamlById.value[nodeId]);
    resetEditorState(nodeId);

    return savedPrimary.value;
  }

  const idx = relatedIndexOf(nodeId);

  if (idx < 0) {
    throw new Error(`No resource in the editor has the node id ${ nodeId }`);
  }

  const entry = props.relatedResources[idx];
  const ctx = contextFor(entry, idx);

  if (await entry.beforeSaveHook?.(ctx) === false) {
    return null;
  }

  let saved: EditableResource;

  try {
    saved = typeof entry.save === 'function' ? await entry.save(ctx) : await saveClassified(ctx.resource, ctx.editorState.yaml[ctx.nodeId] ?? ctx.initialYaml[ctx.nodeId], ctx.initialYaml[ctx.nodeId]);
  } finally {
    // the save can write the yaml of other resources, e.g. the primary resource's
    seedUnseededYaml();
  }

  const savedKey = keyForResource(saved);

  if (savedKey && savedKey !== keyForResource(ctx.resource)) {
    replacedResources[ctx.nodeId] = saved;
  }

  resetEditorState(nodeId);

  // a new context, so `resource` is the replacement where the save replaced the resource
  await entry.afterSaveHook?.(contextFor(entry, idx));

  return saved || resourceFor(entry, idx);
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

const saveOne = (nodeId: string) => runSave(async() => {
  await saveNode(nodeId);
});

// dependencies deepest first, then the primary resource, then the resources that use it
// read-only resources are shown in view mode, so are never modified
const saveOrder = computed<string[]>(() => {
  const editable = props.relatedResources
    .map((entry, i) => ({ entry, id: nodeIdFor(entry, i) }))
    .filter(({ entry }) => !entry.readOnly);
  const dependencies = editable
    .filter(({ entry }) => !entry.dependent)
    .sort((a, b) => (b.entry.depth || 1) - (a.entry.depth || 1));
  const dependents = editable.filter(({ entry }) => entry.dependent);

  return [...dependencies.map(({ id }) => id), primaryId.value, ...dependents.map(({ id }) => id)];
});

const canSaveAll = computed(() => !saving.value && saveOrder.value.some((id) => modifiedIds.value.has(id)));

const saveAll = () => runSave(async() => {
  for (const nodeId of saveOrder.value) {
    // checked for each resource, as a save can save or change another one, e.g. the primary resource
    if (!modifiedIds.value.has(nodeId)) {
      continue;
    }

    if (!await saveNode(nodeId)) {
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
  <div class="multi-yaml-container">
    <ResourceGraph
      class="multi-yaml-resource-graph"
      :nodes="graphNodes"
      :selected="editorState.selected"
      :saving="saving"
      @select="editorState.selected = $event"
      @save="saveOne"
    />
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
                :initial-yaml-values="baselineYamlById[editorState.selected] ?? initialYamlFor(selectedResource)"
                :editor-mode="showDiff ? EDITOR_MODES.DIFF_CODE : (selectedReadOnly ? EDITOR_MODES.VIEW_CODE : EDITOR_MODES.EDIT_CODE)"
                :diff-context="Number.MAX_SAFE_INTEGER"
                @onReady="foldYaml"
              >
                <template #preview-buttons="{ diffMode, setDiffMode }">
                  <div
                    class="multi-yaml-diff-mode"
                    data-testid="multi-yaml-diff-mode"
                  >
                    <RcButton
                      size="small"
                      :variant="diffMode !== 'split' ? 'tertiary' : 'secondary'"
                      :aria-pressed="diffMode !== 'split'"
                      @click="setDiffMode('unified')"
                    >
                      {{ i18n.t('generic.unified') }}
                    </RcButton>
                    <RcButton
                      size="small"
                      :variant="diffMode === 'split' ? 'tertiary' : 'secondary'"
                      :aria-pressed="diffMode === 'split'"
                      @click="setDiffMode('split')"
                    >
                      {{ i18n.t('generic.split') }}
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
  grid-template-columns: 1fr 3fr;
  grid-template-rows: 1fr auto;
  gap: 16px;

  // fill vertical space below the masthead - graph and editor scroll independently
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}

.multi-yaml-resource-graph {
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  grid-row: 1 / span 1;
  overflow: hidden;
}

.multi-yaml-editor-container {
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  grid-row: 1 / span 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  // background-color: var(--yaml-editor-bg);
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
  // border: 1px solid var(--border);
  // border-radius: var(--border-radius);
  grid-row: 2;
  grid-column: 1 / -1;
  padding: 12px var(--gap) 12px var(--gap);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
