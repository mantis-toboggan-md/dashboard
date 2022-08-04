import { pciDevice, pciPassthrough } from '~/mock-data/types';
import { randomStr } from '~/shell/utils/string';
import { HCI } from '@shell/config/types';

const NUM_NODES = 3;

const NUM_DEVICES = 12;

const NUM_UNIQUE_DEVICES = 2;

const nodeOpts = [];

for (let i = 0; i <= NUM_NODES; i++) {
  const node = {
    systemUUID: `30363150-3530-584d-5132-303730435${ randomStr(3) }`,
    name:       randomStr(Math.random() * (12 - 5) + 5)
  };

  nodeOpts.push(node);
}

const randomAddress = () => {
  return `${ (Math.floor(Math.random() * 100)).toString(16) }:${ (Math.floor(Math.random() * 100)).toString(16) }.${ (Math.floor(Math.random() * 10)).toString(16) }`;
};

const addressOpts = [];

export const mockPCIDevices = () => {
  const out = [];

  for (let i = 0; i < NUM_DEVICES; i++) {
    const deviceName = randomStr(Math.random() * (12 - 5) + 5);
    const device = {
      apiVersion: 'harvesterhci.io.github.com/v1beta1',
      kind:       'PCIDevice',
      type:       HCI.PCI_DEVICE,
      id:         deviceName,
      metadata:   { name: deviceName },
      status:     {
        address:  randomAddress(),
        vendorId: '8086',
        deviceId: '0d4c'
      },
      node:              nodeOpts[Math.floor(Math.random() * NUM_NODES)],
      description:       'Ethernet controller: Intel Corporation Ethernet Connection (11) I219-LM',
      kernelDriverInUse: 'e1000e',
      kernelModules:     ['e1000e']
    };

    out.push(device);
  }

  return out;
};

export const mockPCIPassthroughs = () => [pciPassthrough];
