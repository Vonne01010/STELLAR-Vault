import { StellarToml } from '@stellar/stellar-sdk';

const ANCHOR_HOME_DOMAIN = 'testanchor.stellar.org';

export interface AnchorConfig {
  webAuthEndpoint: string;
  transferServerSep24: string;
  kycServer: string | null;
  signingKey: string;
  currencies: { code: string; issuer?: string }[];
}

export async function discoverAnchor(homeDomain: string = ANCHOR_HOME_DOMAIN): Promise<AnchorConfig> {
  const toml = await StellarToml.Resolver.resolve(homeDomain);
  if (!toml.TRANSFER_SERVER_SEP0024) {
    throw new Error(`${homeDomain} does not support SEP-24`);
  }
  if (!toml.WEB_AUTH_ENDPOINT) {
    throw new Error(`${homeDomain} does not support SEP-10 authentication`);
  }
  if (!toml.SIGNING_KEY) {
    throw new Error(`${homeDomain} does not publish a SIGNING_KEY`);
  }
  return {
    webAuthEndpoint: toml.WEB_AUTH_ENDPOINT,
    transferServerSep24: toml.TRANSFER_SERVER_SEP0024,
    kycServer: toml.KYC_SERVER ?? null,
    signingKey: toml.SIGNING_KEY,
    currencies: (toml.CURRENCIES ?? [])
      .filter((c): c is typeof c & { code: string } => typeof c.code === 'string')
      .map((c) => ({
        code: c.code,
        issuer: c.issuer,
      })),
  };
}