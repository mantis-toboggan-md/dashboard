import { CAPA } from './labels-annotations';
import * as AWS from '@shell/types/aws-sdk';

export function removeEmptyFields(input: any): any {
  if (Array.isArray(input)) {
    const cleanedArray = input
      .map((item) => removeEmptyFields(item))
      .filter((item) => item !== undefined);

    return cleanedArray.length ? cleanedArray : undefined;
  }

  if (input && typeof input === 'object') {
    const cleanedObject = Object.entries(input).reduce((acc: Record<string, any>, [key, val]) => {
      const cleanedValue = removeEmptyFields(val);

      if (cleanedValue !== undefined) {
        acc[key] = cleanedValue;
      }

      return acc;
    }, {});

    return Object.keys(cleanedObject).length ? cleanedObject : undefined;
  }

  if (input === undefined || input === null || input === '') {
    return undefined;
  }

  return input;
}

export function isCapaManagedVpcId(vpcId = '', vpcs = [] as AWS.VPC[]) {
  const vpc = vpcs.find((v) => v?.VpcId === vpcId);

  return !(vpc?.Tags || [])?.some((tag) => (tag.Key || '').startsWith(CAPA.CAPA_CLUSTER_PREFIX));
}
