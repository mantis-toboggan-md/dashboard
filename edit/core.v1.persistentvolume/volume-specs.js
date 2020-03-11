const readOnly = {
  _type:   'Checkbox',
  default: 'false',
  label:   'Read Only'
};

const fsType = {
  _type:    'LabeledInput',
  default: 'ext4',
  label:   'Filesystem Type'
};

export default {
  GCEPersistentDisk: {},

  awsElasticBlockStore: {
    _label:    'AWS Elastic Block Store',
    fsType,
    partition: {
      _type: 'LabeledInput',
      label: 'Partition'
    },
    readOnly,
    volumeID: {
      _type: 'LabeledInput',
      label: 'AWS Volume ID'
    },
  },

  azureFile:            {
    _label:     'Azure File',
    readOnly,
    secretName: {
      _type:           'resource',
      _filterBy:       secret => secret._type === 'kubernetes.io/azure-file',
      _set:       (param, vm) => {
        const { name = '', namespace = '' } = param.metadata;

        vm.$set(vm.params, 'secretName', name );
        vm.$set(vm.params, 'secretNamespace', namespace );
      }
    },
    shareName: {
      _type: 'LabeledInput',
      label: 'Share Name'
    }
  },

  azureDisk:            {
    _label:      'Azure Disk',

    fsType,

    cachingMode: {
      _type:   'LabeledSelect',
      label:   'Caching Mode',
      options: ['None', 'Read Only', 'Read Write']
    },

    diskName: {
      _type: 'LabeledInput',
      label: 'Disk Name'
    },

    diskURI: {
      _type: 'LabeledInput',
      label: 'Disk URI'
    },

    kind: {
      _type:   'LabeledSelect',
      options: ['Shared', 'Dedicated', 'Managed'],
      labels:  ['Shared: multiple blob disks per storage account', ' Dedicated: single blob disk per storage account', 'Managed: azure managed data disk'],
      default: 'Shared'
    },

    readOnly
  },

  CSI:                  {},
  FC:                   {},
  FlexVolume:           {},
  Flocker:              {},
  NFS:                  {},
  iSCSI:                {},
  RBD:                  {},
  cephfs:               {
    _label:   'Ceph Fs',
    monitors: {
      _type: 'LabeledInput',
      label: 'Monitors'
    },
    path: {
      _type:   'LabeledInput',
      label:   'Mount Path',
      default: '/'
    },
    readOnly,
    secretFile: {
      _type:   'LabeledInput',
      label:   'Path to Secret File',
      default: '/etc/ceph/user.secret'
    },
    secretRef: {
      _type: 'resource',
      _kind: SECRET,
      _set:       (param, vm) => {
        const { name = '', namespace = '' } = param.metadata;

        vm.$set(vm.spec, 'secretRef', { secretName: name, secretNamespace: namespace } );
      }
    },
    user: {
      _type:   'LabeledInput',
      label:   'RADOS User',
      default: 'admin'
    }
  },
  Cinder:               {},
  Glusterfs:            {},
  VsphereVolume:        {},
  'Quobyte Volumes':      {},
  HostPath:             {},
  'Portworx Volumes':     {},
  'ScaleIO Volumes':      {},
  StorageOS:            {}
};
