import { FC, PropsWithChildren } from "react"

const VerifiTooltip: FC<PropsWithChildren & { message: string }> = ({ message, children }) => {
  return (
    <div className="group relative flex">
      {children}
      <span className="absolute top-12 scale-0 transition-all rounded bg-white/10 p-2 py-1 text-[10px] font-mono text-white group-hover:scale-100">{message}</span>
    </div>
  )
}
export default VerifiTooltip
