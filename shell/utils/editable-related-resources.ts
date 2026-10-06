import {
  CONFIG_MAP, PVC, SECRET, SERVICE_ACCOUNT, WORKLOAD_TYPES
} from '@shell/config/types';
import {
  EditableRelatedResource, EditableRelatedResourceCompute, EditableRelatedResourceBanner, EditableRelatedResourcesFetchOptions, EditableResource
} from '@shell/core/types';
import { clone } from '@shell/utils/object';
import { convert, matches } from '@shell/utils/selector';

/**
 * Helpers for models gathering their editable related resources
 *
 * The functions fetching resources take a model to fetch through: any model in the store the
 * related resources are in, usually the one gathering them
 */

/** What the primary resource of the multi-resource YAML editor is asked for */
export const ALL_RELATED_RESOURCES: EditableRelatedResourcesFetchOptions = { dependencies: true, dependents: true };

type LabelSelector = { matchLabels?: { [key: string]: string }, matchExpressions?: any[] };

/**
 * An editable related resource shown under the heading of its type
 *
 * `group` is the one the steve model gives the resources it owns, so the two share a heading
 *
 * @param resource the related resource
 * @param options.dependent `resource` uses the resource it was gathered for. Left out of the entry when false
 * @param options.banner shown above `resource` in the editor. Left out of the entry when not given
 * @returns the entry, grouped under the `typeDisplay` of `resource`
 */
export function relatedEntry(
  resource: EditableResource,
  { dependent = false, banner }: { dependent?: boolean, banner?: EditableRelatedResourceCompute<EditableRelatedResourceBanner | null | undefined> } = {}
): EditableRelatedResource {
  return {
    resource,
    group: resource.typeDisplay,
    ...(dependent ? { dependent } : {}),
    ...(banner ? { banner } : {}),
  };
}

/**
 * The resource, or null where it does not exist or the user can not fetch the type
 *
 * A spec can name a resource that does not exist, for example an optional ConfigMap, so a 404 is not
 * reported
 *
 * @param model a model in the store of the resource, to fetch through
 * @param type the steve type of the resource
 * @param id the steve id of the resource, `namespace/name` for a namespaced type
 * @returns the store's copy where there is one, otherwise the fetched resource, or null. Never rejects
 */
export async function findIfExists(model: EditableResource, type: string, id: string): Promise<EditableResource | null> {
  if (!type || !id || !model.$getters['schemaFor'](type)) {
    return null;
  }

  return model.$getters['byId'](type, id) || model.$dispatch('find', { type, id }).catch((e: any) => {
    if (e?._status !== 404) {
      console.warn(`Failed to fetch ${ type } ${ id }`, e); // eslint-disable-line no-console
    }

    return null;
  });
}

/**
 * Every resource of `type`, in `namespace` when one is given, or none where the user can not list
 * the type
 *
 * @param model a model in the store of the resources, to fetch through
 * @param type the steve type of the resources
 * @param namespace limits the result to this namespace. Every namespace when not given
 * @returns the resources, or none where the request fails. Never rejects
 */
export async function findAllOf(model: EditableResource, type: string, namespace?: string): Promise<EditableResource[]> {
  if (!model.$getters['schemaFor'](type)) {
    return [];
  }

  try {
    const all = await model.$dispatch('findAll', { type, opt: namespace ? { namespaced: namespace } : {} });

    return (all || []).filter((resource: EditableResource) => !namespace || resource.metadata?.namespace === namespace);
  } catch (e) {
    console.warn(`Failed to fetch ${ type }${ namespace ? ` in namespace ${ namespace }` : '' }`, e); // eslint-disable-line no-console

    return [];
  }
}

/**
 * The workloads in `namespace` that no other workload owns
 *
 * A ReplicaSet owned by a Deployment, or a Job owned by a CronJob, shares its pod template, so only
 * the owner is returned
 *
 * @param model a model in the store of the workloads, to fetch through
 * @param namespace the namespace of the workloads
 * @returns the workloads of every type in `WORKLOAD_TYPES` the user can list
 */
export async function workloadsInNamespace(model: EditableResource, namespace: string): Promise<EditableResource[]> {
  const byType = await Promise.all(Object.values(WORKLOAD_TYPES).map((type) => findAllOf(model, type, namespace)));

  return byType.flat().filter((workload) => !workload.ownedByWorkload);
}

/**
 * The api group of an `apiVersion`, empty for the core group
 *
 * @param apiVersion `group/version`, or `version` alone for the core group
 * @returns the part before the `/`, or `''`
 */
export function apiGroupOf(apiVersion = ''): string {
  return apiVersion.includes('/') ? apiVersion.split('/')[0] : '';
}

/**
 * The Secret holding the bootstrap data of a cluster api machine spec, where it names no bootstrap
 * config, or null
 *
 * `bootstrap.dataSecretName` is a plain string, so unlike `bootstrap.configRef` and
 * `infrastructureRef` it is not found from the schema, see `fetchReferencedEditableRelatedResources`
 *
 * @param model a model in the store of the Secret, to fetch through
 * @param machineSpec the spec of a Machine, or of the machine template of a MachineDeployment or MachinePool
 * @param namespace the namespace of the resource holding `machineSpec`
 * @returns the Secret, or null
 */
export async function capiBootstrapDataSecret(model: EditableResource, machineSpec: any, namespace: string): Promise<EditableResource | null> {
  const bootstrap = machineSpec?.bootstrap;

  if (bootstrap?.configRef || !bootstrap?.dataSecretName) {
    return null;
  }

  return findIfExists(model, SECRET, `${ namespace }/${ bootstrap.dataSecretName }`);
}

/**
 * Does a kube label selector select a resource with `labels`?
 *
 * An empty selector selects nothing here. Kubernetes treats it as every pod in the namespace, which
 * is not specific to any one workload
 *
 * @param labelSelector `matchLabels` and `matchExpressions`, as in a NetworkPolicy's `podSelector`
 * @param labels the labels of the resource, for example of a workload's pod template
 * @returns true when every label and expression of the selector matches
 */
export function selectsLabels(labelSelector: LabelSelector | undefined, labels: { [key: string]: string } = {}): boolean {
  const matchLabels = labelSelector?.matchLabels || {};
  const matchExpressions = labelSelector?.matchExpressions || [];

  if (!Object.keys(matchLabels).length && !matchExpressions.length) {
    return false;
  }

  // `convert` adds to the array it is given, which would change the resource
  return matches({ metadata: { labels } }, convert(matchLabels, clone(matchExpressions)));
}

/**
 * The names of the resources a pod spec refers to, by type
 *
 * See https://kubernetes.io/docs/concepts/storage/volumes/ for the volume references
 *
 * @param podSpec the spec of a pod, or of a workload's pod template
 * @returns `names`, a set of names for each of ConfigMap, Secret, PersistentVolumeClaim and ServiceAccount
 */
export function podSpecReferences(podSpec: any = {}): { names: { [type: string]: Set<string> } } {
  const names: { [type: string]: Set<string> } = {
    [CONFIG_MAP]:      new Set(),
    [SECRET]:          new Set(),
    [PVC]:             new Set(),
    [SERVICE_ACCOUNT]: new Set(),
  };

  const add = (type: string, name: string | undefined) => {
    if (name) {
      names[type].add(name);
    }
  };

  (podSpec?.volumes || []).forEach((volume: any) => {
    add(CONFIG_MAP, volume?.configMap?.name);
    add(SECRET, volume?.secret?.secretName);
    add(SECRET, volume?.csi?.nodePublishSecretRef?.name);
    add(PVC, volume?.persistentVolumeClaim?.claimName);

    (volume?.projected?.sources || []).forEach((source: any) => {
      add(CONFIG_MAP, source?.configMap?.name);
      add(SECRET, source?.secret?.name);
    });
  });

  [...podSpec?.initContainers || [], ...podSpec?.containers || []].forEach((container: any) => {
    (container?.env || []).forEach((env: any) => {
      add(CONFIG_MAP, env?.valueFrom?.configMapKeyRef?.name);
      add(SECRET, env?.valueFrom?.secretKeyRef?.name);
    });

    (container?.envFrom || []).forEach((source: any) => {
      add(CONFIG_MAP, source?.configMapRef?.name);
      add(SECRET, source?.secretRef?.name);
    });
  });

  (podSpec?.imagePullSecrets || []).forEach((ref: any) => add(SECRET, ref?.name));

  // `serviceAccount` is the deprecated alias of `serviceAccountName`
  // a pod that names neither runs as the namespace's `default` service account, which is not added
  add(SERVICE_ACCOUNT, podSpec?.serviceAccountName || podSpec?.serviceAccount);

  return { names };
}

/**
 * Was the claim created by the StatefulSet `setName` from its volume claim template `templateName`?
 *
 * The StatefulSet controller names these `<template>-<statefulset>-<ordinal>`. The ordinal is not
 * limited to the current replicas, as a claim is kept when its replica is scaled down
 *
 * @param claimName the name of the PersistentVolumeClaim
 * @param templateName the `metadata.name` of the volume claim template
 * @param setName the name of the StatefulSet
 * @returns false when any of the names is missing
 */
export function isClaimFromTemplate(claimName: string | undefined, templateName: string | undefined, setName: string | undefined): boolean {
  if (!claimName || !templateName || !setName) {
    return false;
  }

  const prefix = `${ templateName }-${ setName }-`;

  return claimName.startsWith(prefix) && /^\d+$/.test(claimName.slice(prefix.length));
}

/**
 * The backends of an Ingress: its default backend and the backend of each path
 *
 * @param ingress the Ingress
 * @returns the backends, `service` or `resource`, in the order they appear in the spec
 */
export function ingressBackends(ingress: EditableResource): any[] {
  const pathBackends = (ingress.spec?.rules || []).flatMap((rule: any) => (rule?.http?.paths || []).map((path: any) => path?.backend));

  return [ingress.spec?.defaultBackend, ...pathBackends].filter(Boolean);
}

/**
 * The names of the Services an Ingress routes to
 *
 * @param ingress the Ingress
 * @returns the name of the Service of each backend, in the namespace of the Ingress. A name can repeat
 */
export function ingressServiceNames(ingress: EditableResource): string[] {
  return ingressBackends(ingress).map((backend) => backend?.service?.name).filter(Boolean);
}
