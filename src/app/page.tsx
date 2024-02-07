import Profile from "./Profile";
import VerifiModal from "@/components/verifi-vote/VerifiModal";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <Profile />

      <div className="w-full md:w-2/3 bg-white/10 mt-8 p-8 ">

        <VerifiModal spaceId="0xc9b27cd8390b363263fc7b05c382831ebc532215" networkId="eth" />
      </div>
    </main>
  );
}
