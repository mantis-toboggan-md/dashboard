import { SECRET } from '@/config/types';
/*
    map of storage class provisioners and their available parameter fields per https://kubernetes.io/docs/concepts/storage/storage-classes/#parameters
    underscored keys are presentational properties handled by Parameters.vue; other keys are passed into input components
    _allowdTopologies, _allowVolumeExpansion, and _waitForFirstConsumer track whether or not these fields can be set for a given provisioner
    _type: input component to be used
    _isAvailable: function returns true if field should be rendered, called with SC's 'parameters' as only argument
    _isDisabled: function returns true if field should be disabled, called with SC's 'parameters' as only argument
    _filterBy: function used to filter items in select dropdown
    _set: overwrite the default updating logic to e.g. set multiple parameters based off one input field
*/

/* eslint-disable object-curly-newline */
export default {
  'kubernetes.io/aws-ebs':         {
    params:               {
      fsType: {
        _type:    'LabeledInput',
        default: 'ext4',
        label:   'Filesystem Type'
      },
      type:               {
        _type:    'LabeledSelect',
        options:  [
          { label: 'Provisioned IOPS SSD', value: 'io1' },
          { label: 'General Purpose SSD', value: 'gp2' },
          { label: 'Throughput Optimized HDD', value: 'st1' },
          { label: 'Cold HDD', value: 'sc1' }],
        default: 'gp2',
        label:   'Type'
      },
      encrypted: {
        _type:    'RadioGroup',
        options: [true, false],
        labels:  ['Encrypted', 'Unencrypted']
      },
      iopsPerGB: {
        _type:        'UnitInput',
        _isAvailable: params => params.type === 'io1',
        label:        'Provisioned IOPS',
        suffix:       '(IO/s)/GiB'
      },
      kmsKeyId: {
        _type:        'LabeledInput',
        _isAvailable: params => params.encrypted || params.encrypted === 'true',
        label:        'AWS Customer Master Key (optional)',
      }
    },
    _allowedTopologies:     true,
    _allowVolumeExpansion:   true,
    _waitForFirstConsumer: true
  },
  'kubernetes.io/azure-file':      {
    params:              {
      skuName: {
        _type:       'LabeledInput',
        _isDisabled: params => !!params.storageAccount,

        default: '',
        label:   'Storage Account Sku tier'
      },
      location: {
        _type:       'LabeledInput',
        _isDisabled: params => !!params.storageAccount,
        default:     '',
        label:       'Storage Account Location'
      },
      storageAccount: {
        _type:       'LabeledInput',
        _isDisabled: params => (!!params?.skuName?.length || !!params?.location?.length),
        label:       'Storage Account Name'
      },
      secretName: {
        _type:           'resource',
        _filterBy:       secret => secret._type === 'kubernetes.io/azure-file',
        _set:       (param, vm) => {
          const { name = '', namespace = '' } = param.metadata;

          vm.$set(vm.params, 'secretName', name );
          vm.$set(vm.params, 'secretNamespace', namespace );
        },
        kind:           SECRET,
        required:       true,
        label:          'Admin Secret Name',
        'option-label': 'id',
      },
      readOnly: {
        _type:    'Checkbox',
        default: 'false',
        label:   'Read Only'

      }
    },
    _allowedTopologies:    true,
    _allowVolumeExpansion: true
  },
  'kubernetes.io/azure-disk':      {
    params:               {
      storageaccounttype: {
        _type:    'LabeledInput',
        default: '',
        label:   'Storage Account Sku tier'
      },
      kind: {
        _type:    'LabeledSelect',
        options: ['shared', 'dedicated', 'managed'],
        default: 'shared',
        label:   'Kind'
      },
      resourceGroup: {
        _type:  'LabeledInput',
        label: 'Resource Group'
      },

    },
    _allowVolumeExpansion:  true,
    _waitForFirstConsumer: true

  },
  'kubernetes.io/cinder':          {
    params:              {
      availability: {
        _type:  'LabeledInput',
        label: 'Availability Zone'
      }
    },
    _allowVolumeExpansion: true
  },
  'kubernetes.io/flocker':         {
    params:              {},
  },
  'kubernetes.io/gce-pd':          {
    params:               {
      type: {
        _type:    'LabeledSelect',
        options: ['pd-standard', 'pd-ssd'],
        label:   'Type',
        default: ''
      },
      'replication-type': {
        _type:    'LabeledSelect',
        options: ['none', 'regional-pd'],
        label:   'Replication Type'
      }
    },
    _allowedTopologies:    true,
    _allowVolumeExpansion:  true,
    _waitForFirstConsumer: true

  },
  'kubernetes.io/glusterfs':       {
    params:              {
      resturl: {
        _type:        'LabeledInput',
        label:       'Gluster REST Service URL',
        placeholder: 'e.g. 127.0.0.1:88'
      },
      restuser: {
        _type:  'LabeledInput',
        label: 'Gluster REST User'
      },
      restuserkey: {
        _type:  'LabeledInput',
        label: 'Gluster REST User Password',
        type:  'password'
      },
      secretName: {
        _type:           'resource',
        _filterBy:       secret => secret._type === 'kubernetes.io/glusterfs',
        _set:           (param, vm) => {
          const { name = '', namespace = '' } = param.metadata;

          vm.$set(vm.params, 'secretName', name );
          vm.$set(vm.params, 'secretNamespace', namespace );
        },
        kind:           SECRET,
        label:          'Secret Name',
        'option-label': 'id',
      },
      clusterid: {
        _type:  'LabeledInput',
        label:  'Cluster ID',
        _group: 'optional'
      },
      gidMin: {
        _type:  'LabeledInput',
        label:  'Minimum GID Value',
        _group: 'optional'
      },
      gidMax: {
        _type:  'LabeledInput',
        label:  'Maximum GID Value',
        _group: 'optional'
      },
      volumetype: {
        _type:  'LabeledInput',
        label:  'Volume Type',
        _group: 'optional'
      }
    },
    _allowVolumeExpansion: true
  },
  'kubernetes.io/quobyte':         {
    params:              {
      quobyteAPIServer: {
        _type:        'LabeledInput',
        label:       'API Server',
        placeholder: 'e.g. http://my-server:7070'
      },
      registry: {
        _type:        'LabeledInput',
        label:       'Registry',
        placeholder: 'e.g. my-host:my-port, our-host:our-port'
      },
      adminSecretName: {
        _type:           'resource',
        kind:           SECRET,
        required:       true,
        _filterBy:       secret => secret._type === 'kubernetes.io/quobyte',
        label:          'Admin Secret Name',
        'option-label': 'id',
        _set:           (param, vm) => {
          const { name = '', namespace = '' } = param.metadata;

          vm.$set(vm.params, 'adminSecretName', name );
          vm.$set(vm.params, 'adminSecretNamespace', namespace );
        },
      },
      user: {
        _type:    'LabeledInput',
        default: 'root',
        label:   'User'
      },
      group: {
        _type:    'LabeledInput',
        default: 'nfsnobody',
        label:   'Group'
      },
      quobyteConfig: {
        _type:    'LabeledInput',
        default: 'BASE',
        label:   'Quobyte Config'
      },
      quobyteTenant: {
        _type:    'LabeledInput',
        default: 'DEFAULT',
        label:   'Quobyte Tennant'
      }
    },
  },
  'kubernetes.io/rbd':             {
    params:              {
      monitors: {
        _type:     'LabeledInput',
        required: true,
        label:    'Ceph Monitors'
      },
      adminId: {
        _type:    'LabeledInput',
        default: 'admin',
        label:   'Ceph Admin ID'
      },
      adminSecretName: {
        _type:           'resource',
        kind:           SECRET,
        required:       true,
        _filterBy:       secret => secret._type === 'kubernetes.io/rbd',
        label:          'Admin Secret Name',
        'option-label': 'id',
        _set:           (param, vm) => {
          const { name = '', namespace = '' } = param.metadata;

          vm.$set(vm.params, 'adminSecretName', name );
          vm.$set(vm.params, 'adminSecretNamespace', namespace );
        },
      },
      pool: {
        _type:    'LabeledInput',
        default: 'rbd',
        label:   'RBD Pool'
      },
      userId: {
        _type:    'LabeledInput',
        default: 'admin',
        label:   'User ID'
      },
      userSecretName: {
        _type:           'resource',
        kind:           SECRET,
        required:       true,
        _filterBy:       secret => secret._type === 'kubernetes.io/rbd',
        label:          'User Secret Name',
        'option-label': 'id',
        _set:           (param, vm) => {
          const { name = '', namespace = '' } = param.metadata;

          vm.$set(vm.params, 'userSecretName', name );
          vm.$set(vm.params, 'userSecretNamespace', namespace );
        },
      },
      fsType: {
        _type:    'LabeledInput',
        default: 'ext4',
        label:   'Filesystem Type'
      },
      imageFormat: {
        _type:    'LabeledSelect',
        options: ['1', '2'],
        default: '2',
        label:   'Image Format'
      },
      imageFeatures: {
        _type:        'checkbox',
        _isAvailable: params => params.imageFormat === '2',
        default:      false,
        options:      ['layering', ''],
        labels:       ['Layering'],
        label:        'Layering',
      }
    },
    _allowVolumeExpansion: true
  },
  'kubernetes.io/vsphere-volume':  {
    vSAN: {
      _isAvailable: params => !params._useExistingSP,
      title:        'vSAN Policy'
    },
    params:              {
      diskformat: {
        _type:    'LabeledSelect',
        options: ['thin', 'zeroedthick', 'eagerzeroedthick'],
        default: 'thin',
        label:   'Disk Format'
      },
      datastore: {
        _type:  'LabeledInput',
        label: 'Datastore'
      },
      cacheReservation: {
        _type:  'UnitInput',
        label:  'Cache Reservation',
        suffix: '%'
      },
      _useExistingSP: {
        _type:   'RadioGroup',
        options: [true, false],
        labels:  ['Use existing storage policy', 'Define new policy']
      },
      storagePolicyName: {
        _type:        'LabeledInput',
        label:        'SBPM Policy',
        _isAvailable: params => params._useExistingSP
      },
      diskStripes: {
        _type:  'LabeledInput',
        label:  'Stripe Width',
        _group: 'vSAN'
      },
      hostFailuresToTolerate: {
        _type:  'LabeledInput',
        label:  'Maximum Host Failures to Tolerate',
        _group: 'vSAN'
      },
      iopsLimit: {
        _type:   'LabeledInput',
        _group: 'vSAN',
        label:  'IOPS Limit',
      },
      objectSpaveReservation: {
        _type:   'UnitInput',
        _group:  'vSAN',
        label:   'Object Reservation',
        suffix:  '%',
        default: '0',
      },
      forceProvisioning: {
        _type:  'Checkbox',
        label:  'Force Provisioning',
        _group: 'vSAN'
      },
    },
  },
  'kubernetes.io/portworx-volume': {
    params:              {
      fs: {
        _type:    'LabeledSelect',
        options: ['ext4', 'xfs', 'none'],
        default: 'ext4',
        label:   'Filesystem Type'
      },
      repl: {
        _type:    'LabeledSelect',
        default: '1',
        options: ['1', '2', '3'],
        label:   'Replication Factor'
      },
      io_priority: {
        _type:    'LabeledSelect',
        options: ['high', 'medium', 'low'],
        default: 'low',
        label:   'IO Priority'
      },
      block_size:  {
        _type:    'UnitInput',
        _short:  true,
        default: '32',
        label:   'Block Size',
        suffix:  'KBytes'
      },
      snap_interval: {
        _type:    'UnitInput',
        _short:  true,
        default: '0',
        label:   'Snapshot Interval',
        suffix:  'Minutes'
      },
      aggregation_level: {
        _type:    'UnitInput',
        _short:  true,
        default: '0',
        label:   'Aggregation Level',
        suffix:  'Chunks'
      },
      ephemeral: {
        _type:    'Checkbox',
        default: 'false',
        label:   'Ephemeral',
        _short:  true,
      }
    },
    _allowVolumeExpansion: true
  },
  'kubernetes.io/scaleio':         {
    params:              {
      gateway: {
        _type:     'LabeledInput',
        required: true,
        label:    'API Gateway Address'
      },
      system: {
        _type:     'LabeledInput',
        required: true,
        label:    'ScaleIO System Name'
      },
      protectionDomain: {
        _type:     'LabeledInput',
        required: true,
        label:    'Protection Domain Name'
      },
      storagePool: {
        _type:     'LabeledInput',
        required: true,
        label:    'Volume Sotrage Pool Name'
      },
      storageMode: {
        _type:    'LabeledSelect',
        options: ['ThinProvisioned', 'ThickProvisioned'],
        label:   'Storage Mode'
      },
      secretRef: {
        _type:           'resource',
        kind:           SECRET,
        label:          'Secret Name',
        'option-label': 'id'

      },
      readOnly: {
        _type:    'Checkbox',
        default: 'false',
        label:   'Read Only'
      },
      fsType: {
        _type:    'LabeledInput',
        default: 'ext4',
        label:   'Filesystem Type'

      },
    },
  },
  'kubernetes.io/storageos':       {
    params:              {
      pool: {
        _type:    'LabeledInput',
        label:   'Pool Name',
        default: 'default'
      },
      description: {
        _type:    'LabeledInput',
        default: ' Kubernetes volume',
        label:   'Volume Description'
      },
      fsType: {
        _type:    'LabeledInput',
        default: 'ext4',
        label:   'Filesystem Type'

      },
      adminSecretName: {
        _type:           'resource',
        _filterBy:       secret => secret._type === 'kubernetes.io/storageos',
        _set:           (param, vm) => {
          const { name = '', namespace = '' } = param.metadata;

          vm.$set(vm.params, 'adminSecretName', name );
          vm.$set(vm.params, 'adminSecretNamespace', namespace );
        },
        kind:           SECRET,
        required:       true,
        label:          'Admin Secret Name',
        'option-label': 'id',
      },
    },
  },
  'kubernetes.io/no-provisioner': {
    waitForFirstConsumer: true,
    params:               {}
  }
};
