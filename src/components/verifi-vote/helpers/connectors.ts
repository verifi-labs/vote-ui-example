export function mapConnectorId(sourceName: string) {
  if(!sourceName) return '';
  if (sourceName.toLowerCase() === 'metamask') return 'injected';
  if (sourceName.toLowerCase() === 'coinbase') return 'walletlink';

  return sourceName;
}