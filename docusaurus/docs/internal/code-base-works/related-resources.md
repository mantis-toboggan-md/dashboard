# Related Resources in the YAML Editor

When a resource is edited as YAML (`?mode=edit&as=yaml`) and it has related resources, the multi-resource YAML editor is shown in place of the single-resource editor. The resource graph on the left lists the resource being edited, the resources related to it, and read-only resources it refers to. Selecting a resource shows its YAML. Each resource has its own save button, and "Save All Resources" saves every edited resource.

This page covers how to get a resource shown in the editor for a type. For the extension point, and the full list of fields an entry can have, see [Related Resources in the YAML Editor](/extensions/next/api/related-resources) in the extension docs.

## Where related resources come from

| Source | Covers | What to change |
|---|---|---|
| Schema references | Fields of the resource that name another resource, for example a ConfigMap volume or the `scaleTargetRef` of a HorizontalPodAutoscaler | Usually nothing. For a built-in Kubernetes field that is not found, add it to the tables in `shell/utils/schema-references.ts` |
| The type's model | Anything the schema can not show: resources that use this one, resources matched by label selector, names in plain string fields of custom resources | Override `fetchModelRelatedResources` in the model in `shell/models` |
| Owned resources | Core API group resources listing this one in their `ownerReferences` | Nothing. Can be turned off per type |
| Extensions | Anything an extension adds or removes | See the extension docs |

## Dependencies and dependents

Each related resource is one of:

- a **dependency**: used by the resource it was found for, for example the Secret a Deployment mounts
- a **dependent**: uses the resource it was found for, for example the Deployments mounting a ConfigMap. Its entry has `dependent: true`

Dependencies are followed through the graph: a Deployment shows its ConfigMap, and the ConfigMap's own dependencies are shown below it. Dependents are only shown for the resource being edited, otherwise a shared ConfigMap would bring in every workload using it.

Save All saves dependencies first, then the resource being edited, then dependents.


## References found from the schema

Steve describes every type with schema definitions (`/v1/schemaDefinitions/<type>`). The editor reads these to find fields of a resource that name another resource. No code is needed for a type whose references are found this way.

### Custom resources

An object field in a custom resource is found when its definition has both a `kind` and a `name` field. The API group is read from `apiGroup`, `group` or `apiVersion`, and the namespace from `namespace` when there is one. Examples that are found:

- Cluster API `Machine.spec.infrastructureRef`
- Gateway API `HTTPRoute.spec.rules[].backendRefs[]`
- Provisioning `Cluster.spec.rkeConfig.machinePools[].machineConfigRef`

These are not found, and need a model override:

| Case | Example | Model doing this |
|---|---|---|
| A string field holding only a name | Cluster API `bootstrap.dataSecretName` | `cluster.x-k8s.io.machinedeployment.js`, `cluster.x-k8s.io.machinepool.js` |
| An object with no `kind` field | Cluster API `spec.topology.classRef` | `cluster.x-k8s.io.cluster.js` |
| A resource that uses this one | Workloads mounting a ConfigMap, HTTPRoutes attached to a Gateway | `configmap.js`, `gateway.networking.k8s.io.gateway.js` |
| A label selector | Services and PodDisruptionBudgets selecting a workload's pods | `workload.service.js` |

### Built-in Kubernetes types

Built-in types are found from tables in `shell/utils/schema-references.ts`, listed by definition name. To add a field that is not found:

1. Find the definition name. Fetch `/v1/schemaDefinitions/<type>` for a type containing the field, and find the object or field in `definitions`. Built-in names start with `io.k8s.api.`, for example `io.k8s.api.core.v1.SecretKeySelector`
2. Add it to the table that fits:

| Table | For | Example entry |
|---|---|---|
| `REFERENCE_DEFINITIONS` | An object type that names a resource. Use `withKind(kind, nameField, namespaceField)` when the type always refers to one kind | `` [`${ CORE }ConfigMapKeySelector`]: withKind('ConfigMap') `` |
| `NAME_FIELDS` | A string field holding a name, keyed `<definition>.<field>` | `` [`${ CORE }PodSpec.serviceAccountName`]: { kind: 'ServiceAccount', group: '' } `` |
| `BACK_REFERENCE_FIELDS` | A field naming a resource that uses this one, so it is shown as a dependent. Only `PersistentVolumeSpec.claimRef`: a volume names its claim, but the claim uses the volume | |
| `SKIPPED_FIELDS` | A field not to search, for example a template a controller creates resources from | |

3. Add a test case to `shell/utils/__tests__/schema-references.test.ts`. The `BUILT_IN` fixture holds the definitions the tests use; add the definition there if it is missing

`group` is `''` for the core API group.

## Adding related resources in a model

Override `fetchModelRelatedResources` in the type's model. It is given `{ dependencies, dependents }`, saying which kinds are wanted, and returns a list of entries.

`shell/models/configmap.js` shows the workloads using a ConfigMap:

```js
import { relatedEntry, workloadsInNamespace } from '@shell/utils/related-resources';

async fetchModelRelatedResources({ dependents = true } = {}) {
  // a resource being created has no related resources
  if (!this.metadata?.uid || !dependents) {
    return [];
  }

  const workloads = await workloadsInNamespace(this, this.metadata.namespace);

  return workloads
    .filter((workload) => workload.usesResource(CONFIG_MAP, this.metadata.name))
    .map((workload) => relatedEntry(workload, { dependent: true }));
}
```

Guidelines:

- return `[]` when `this.metadata?.uid` is unset
- check `dependencies` and `dependents` before fetching, so no requests are made for a kind that is not wanted
- return only resources directly related to this one. Resources further away are found from the models of the resources in between
- set `dependent: true` on resources that use this one
- do not override `fetchRelatedResources`: it adds the schema references and owned resources to the model's list
- a resource the model returns replaces the same resource found from the schema, so a model can return a resource only to add a banner or a save hook to it

### Helpers

From `shell/utils/related-resources/index.ts`:

| Helper | Use |
|---|---|
| `relatedEntry(resource, { dependent, banner })` | Builds an entry shown under the resource's type name |
| `findIfExists(model, type, id)` | Fetches one resource. Null when it does not exist or the user can not get it |
| `findAllOf(model, type, namespace?)` | Fetches every resource of a type. Empty when the user can not list it |
| `workloadsInNamespace(model, namespace)` | Fetches the workloads in a namespace, leaving out those owned by another workload |
| `podSpecReferences(podSpec)` | The ConfigMap, Secret, PersistentVolumeClaim and ServiceAccount names a pod spec uses |
| `selectsLabels(labelSelector, labels)` | Whether a label selector selects a set of labels |
| `capiBootstrapDataSecret(model, machineSpec, namespace)` | The Cluster API bootstrap data Secret of a machine spec |

### Banners

A banner is shown above a resource's YAML while it is selected, to explain why the resource is shown or to warn about editing it. `shell/models/workload.service.js` shows one for a claim created from a StatefulSet's volume claim template:

```js
relatedEntry(claim, { banner: () => ({ label: this.t('resourceYaml.resourceGraph.banners.claimFromTemplate', { workload, template }) }) });
```

Add banner text under `resourceYaml.resourceGraph.banners` in `shell/assets/translations/en-us.yaml`.

### Headings

`relatedEntry` shows a resource under its type name. To use another heading, set `groupKey` to a translation key under `resourceYaml.resourceGraph.groups`.

### Read-only resources

Set `readOnly: true` for a resource that helps to understand the one being edited but should not be edited from it. `fetchReadOnlyClusterRelatedResources` in `shell/models/provisioning.cattle.io.cluster.js` shows the Cluster API, management and fleet clusters this way.

### Custom save

Set `save` on an entry when the resource has to be saved some other way than its model's `save`. `fetchMachineConfigRelatedResources` in `shell/models/provisioning.cattle.io.cluster.js` saves machine configs with the same steps as the cluster form.

A resource is saved from the YAML in the editor, not from the resource object. A save hook that changes what is saved has to change the YAML in `editorState.yaml`, as `shell/utils/machine-pools.ts` does.

The YAML in the editor has no `id`, `type` or `links`, as in the single resource editor. A `save` that makes a model from the YAML puts them back with `fromEditorYaml` from `shell/utils/related-resources/yaml.ts`.

### Turning off sources for a type

| Getter | Set to `false` to |
|---|---|
| `includeSchemaRelatedResources` | not show schema references, for example `catalog.cattle.io.app.js`, whose `spec.resources` lists every resource of the helm release |
| `includeOwnedRelatedResources` | not show owned resources |

## Tests

| File | Covers |
|---|---|
| `shell/utils/__tests__/schema-references.test.ts` | References found from schema definitions |
| `shell/utils/related-resources/__tests__/index.test.ts` | The model helpers |
| `shell/utils/related-resources/__tests__/yaml.test.ts` | The YAML shown in the editor, and the resource saved from it |
| `shell/components/ResourceYaml/__tests__/` | The editor, graph and saving |
| `cypress/e2e/tests/pages/explorer2/multi-resource-yaml.spec.ts` | End to end, with page objects in `cypress/e2e/po/components/multi-resource-yaml.po.ts` and `resource-graph.po.ts` |
