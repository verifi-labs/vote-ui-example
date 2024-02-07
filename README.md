This is an alpha, work-in-progress Next.js example to implement with the [Verifi][https://verifi.network] protocol using the [verifi.js][https://github.com/verifi-labs/verifi.js] sdk.

Before you begin, be sure follow the [docs][https://docs.verifi.network/] to setup a space and a proposal.

Currently the only supported voting method is an eth tx. To implement a signature method, you will need to implement your own relayer (we are working on a relayer service to make this easier).

verifi.js uses [viem][https://viem.sh] and this example uses [wagmi][https://wagmi.sh] to handle block times and a couple other methods but feel free to replace.


## Usage
```
  <VerifiModal spaceId="0xc9b27cd8390b363263fc7b05c382831ebc532215" networkId="eth" />
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```
