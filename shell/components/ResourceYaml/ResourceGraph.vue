<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import ResourceGraphGroups from '@shell/components/ResourceYaml/ResourceGraphGroups.vue';
import ResourceGraphSection from '@shell/components/ResourceYaml/ResourceGraphSection.vue';
import { RcCounterBadge } from '@components/Pill';
import { ResourceGraphGroup, ResourceGraphNode, ResourceGraphTreeNode } from '@shell/components/ResourceYaml/types';

const props = withDefaults(defineProps<{
  /** The resources shown in the graph, in the order they should appear */
  nodes: ResourceGraphNode[],

  /** The id of the node currently shown in the editor */
  selected?: string | null,

  /** A save is in progress, so no other save can be started */
  saving?: boolean,
}>(), {
  selected: null,
  saving:   false,
});

const emit = defineEmits<{
  /** The user picked a resource to show in the editor */
  select: [id: string],

  /** The user asked to save one resource */
  save: [id: string],
}>();

const store = useStore();
const i18n = useI18n(store);

/** The nodes of the graph by id, keeping the first of any that share an id */
const nodesById = computed(() => props.nodes.reduce((acc, node) => {
  if (!acc.has(node.id)) {
    acc.set(node.id, node);
  }

  return acc;
}, new Map<string, ResourceGraphNode>()));

/**
 * The id of the node this one should be shown below, or `undefined` to show it at the top level
 *
 * A node pointing at a parent that isn't in the graph is shown at the top level rather than
 * dropped, as is one whose parents lead back around to it, so a bad `parentId` can't hide a
 * resource from the user
 */
const parentIdOf = (node: ResourceGraphNode): string | undefined => {
  const seen = new Set([node.id]);
  let parent = node.parentId ? nodesById.value.get(node.parentId) : undefined;

  const first = parent;

  while (parent) {
    if (seen.has(parent.id)) {
      return undefined;
    }

    seen.add(parent.id);
    parent = parent.parentId ? nodesById.value.get(parent.parentId) : undefined;
  }

  return first?.id;
};

/** The nodes below each parent id, the `undefined` key holding those at the top level */
const nodesByParentId = computed(() => {
  const byParentId = new Map<string | undefined, ResourceGraphNode[]>();
  const seen = new Set<string>();

  props.nodes.forEach((node) => {
    // Only the first of any nodes sharing an id, so that a duplicate can't be nested below itself
    if (seen.has(node.id)) {
      return;
    }

    seen.add(node.id);

    const parentId = parentIdOf(node);
    const siblings = byParentId.get(parentId) || [];

    siblings.push(node);
    byParentId.set(parentId, siblings);
  });

  return byParentId;
});

/** `nodes` with the read-only nodes moved after the others, each part keeping its order */
const orderedSiblings = (nodes: ResourceGraphNode[]): ResourceGraphNode[] => [
  ...nodes.filter((node) => !node.readOnly),
  ...nodes.filter((node) => node.readOnly),
];

/**
 * The groups of nodes shown below the node with this id, or at the top level for `undefined`
 *
 * Nodes sharing a group are grouped together under a single heading, in the order they first
 * appear, and those without a group come first, under no heading, so that the primary resource can
 * be shown above the groups of resources that relate to it. Read-only nodes are ordered after the
 * others, so their groups are shown last. The groups of read-only nodes whose parent is not
 * read-only are marked `readOnly`, and are never shared with nodes that are not read-only. Each
 * node in turn carries the groups of the nodes found below it, which the graph shows nested within
 * its group
 */
const groupsBelow = (parentId: string | undefined): ResourceGraphGroup[] => {
  // below a read-only node the groups are not marked, so the referenced heading is shown once per read-only branch
  const belowReadOnly = !!(parentId && nodesById.value.get(parentId)?.readOnly);

  return orderedSiblings(nodesByParentId.value.get(parentId) || []).reduce((acc, node) => {
    const referenced = !!node.readOnly && !belowReadOnly;
    const label = node.group || '';
    const group = acc.find((g) => g.label === label && !!g.readOnly === referenced);
    const treeNode: ResourceGraphTreeNode = { ...node, groups: groupsBelow(node.id) };

    if (group) {
      group.nodes.push(treeNode);
    } else {
      acc.push({
        label, nodes: [treeNode], ...(referenced ? { readOnly: true } : {})
      });
    }

    return acc;
  }, [] as ResourceGraphGroup[]);
};

/** The top level of the graph, each node carrying the groups of nodes found below it */
const groups = computed<ResourceGraphGroup[]>(() => groupsBelow(undefined));

/** The top-level nodes alone, as the groups below them are shown in the sections that follow */
const topGroups = computed<ResourceGraphGroup[]>(() => groups.value.map((group) => ({
  ...group,
  nodes: group.nodes.map((node) => ({ ...node, groups: [] })),
})));

const groupsBelowTop = computed<ResourceGraphGroup[]>(() => groups.value.flatMap((group) => group.nodes.flatMap((node) => node.groups)));

const relatedGroups = computed(() => groupsBelowTop.value.filter((group) => !group.readOnly));

const referencedGroups = computed(() => groupsBelowTop.value.filter((group) => group.readOnly));

const relatedExpanded = ref(true);

const referencedExpanded = ref(false);
</script>

<template>
  <nav
    class="resource-graph"
    :aria-label="i18n.t('resourceYaml.resourceGraph.title')"
  >
    <div class="resource-graph-header">
      <h3 class="resource-graph-title mb-0">
        {{ i18n.t('resourceYaml.resourceGraph.title') }}
      </h3>
      <RcCounterBadge
        :count="props.nodes.length"
        type="inactive"
        data-testid="resource-graph-count"
      />
    </div>

    <div class="resource-graph-body">
      <ResourceGraphGroups
        :groups="topGroups"
        :selected="props.selected"
        :saving="props.saving"
        @select="emit('select', $event)"
        @save="emit('save', $event)"
      />

      <ResourceGraphSection
        v-if="relatedGroups.length"
        v-model:expanded="relatedExpanded"
        :title="i18n.t('resourceYaml.resourceGraph.related')"
        data-testid="resource-graph-related"
      >
        <ResourceGraphGroups
          :groups="relatedGroups"
          :selected="props.selected"
          :saving="props.saving"
          @select="emit('select', $event)"
          @save="emit('save', $event)"
        />
      </ResourceGraphSection>

      <ResourceGraphSection
        v-if="referencedGroups.length"
        v-model:expanded="referencedExpanded"
        :title="i18n.t('resourceYaml.resourceGraph.referenced')"
        data-testid="resource-graph-referenced"
      >
        <ResourceGraphGroups
          :groups="referencedGroups"
          :selected="props.selected"
          :saving="props.saving"
          @select="emit('select', $event)"
          @save="emit('save', $event)"
        />
      </ResourceGraphSection>
    </div>
  </nav>
</template>

<style lang="scss" scoped>
.resource-graph {
  // inherited by ResourceGraphGroups and ResourceGraphSection, which indent from it
  --resource-graph-indent: 20px;

  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.resource-graph-header {
  flex-shrink: 0;
  padding: 12px 14px;
  display: flex;
  justify-content: flex-start;
  gap: 12px;
  align-items: center;
  background-color: var(--tabbed-sidebar-bg);
  border-bottom: 1px solid var(--border);
}

// fills remaining height and scrolls; header stays fixed
.resource-graph-body {
  flex: 1 1 0;
  min-height: 0;
  overflow: auto;
}
</style>
