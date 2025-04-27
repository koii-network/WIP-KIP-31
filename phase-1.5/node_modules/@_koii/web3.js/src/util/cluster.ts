const endpoint = {
  http: {
    devnet: 'http://testnet.koii.live',
    testnet: 'http://testnet.koii.network',
    'mainnet-beta': 'http://mainnet.koii.network',
  },
  https: {
    devnet: 'https://testnet.koii.live',
    testnet: 'https://testnet.koii.network',
    'mainnet-beta': 'https://mainnet.koii.network',
  },
};

export type Cluster = 'devnet' | 'testnet' | 'mainnet-beta';

/**
 * Retrieves the RPC API URL for the specified cluster
 */
export function clusterApiUrl(cluster?: Cluster, tls?: boolean): string {
  const key = tls === false ? 'http' : 'https';

  if (!cluster) {
    return endpoint[key]['devnet'];
  }

  const url = endpoint[key][cluster];
  if (!url) {
    throw new Error(`Unknown ${key} cluster: ${cluster}`);
  }
  return url;
}
