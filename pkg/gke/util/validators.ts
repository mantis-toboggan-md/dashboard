/**
 * NODE POOLS
 * x initialNodeCount >=1
 * x minNodeCount >= 1
 * x maxNodeCount >=1
 * x maxNodeCount >= minNodeCount
 * x diskSizeGb >=10
 * x ssdCount >=0
 * name required
 * x name must be unique within the cluster
 *
 *
 *
 * CONFIG
 * on edit, logging and monitoring both need to be enabled or both disabled
 * if enablePrivateNodes is true, masterIpv4CidrBlock is required
 * if useIpAliases is NOT true, subnetwork is required
 * if local type is zonal region should be null; if location type is regional zone should be null
 * minimal cidr validation
 */
