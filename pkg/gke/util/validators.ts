/**
 * NODE POOLS
 * x initialNodeCount >=1
 * x minNodeCount >= 1
 * x maxNodeCount >=1
 * x maxNodeCount >= minNodeCount
 * x diskSizeGb >=10
 * x ssdCount >=0
 * x name required
 * x name must be unique within the cluster
 *
 *
 *
 * CONFIG
 * x on edit, logging and monitoring both need to be enabled or both disabled
 * x if enablePrivateNodes is true, masterIpv4CidrBlock is required
 * x if useIpAliases is NOT true, subnetwork is required
 * minimal cidr validation
 */
