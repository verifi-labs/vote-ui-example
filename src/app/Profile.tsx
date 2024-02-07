"use client"

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { InjectedConnector } from "wagmi/connectors/injected";

const Profile = () => {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  })
  const { disconnect } = useDisconnect()
  return (
    <>
      {isConnected ? (
        <div className="w-full justify-between">
          <div className=" uppercase text-[10px] tracking-[.9]">Connected to {address}</div>
          <button onClick={() => disconnect()}>Disconnect</button>
        </div>) :
        (
          <div><button onClick={() => connect()}>Connect Wallet</button></div>
        )
      }
    </>
  )

}

export default Profile