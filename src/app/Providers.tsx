"use client"
import { WagmiConfig, createConfig, mainnet } from 'wagmi'
import { createPublicClient, http } from 'viem'
import { FC, PropsWithChildren } from 'react'

const config = createConfig({
  autoConnect: true,
  publicClient: createPublicClient({
    chain: mainnet,
    transport: http()
  }),
})


const Providers: FC<PropsWithChildren> = ({ children }) => {
  return (
    <WagmiConfig config={config}>
      {children}
    </WagmiConfig>
  )
}

export default Providers