import { MintNftCard } from '@/components/mint-nft-card';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 overflow-hidden bg-background">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
      </div>
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-5xl sm:text-6xl font-extrabold text-foreground tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70 pb-2">
            MintLockr
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
            Create, own, and trade unique digital assets on the blockchain with ease.
          </p>
        </header>
        <MintNftCard />
      </div>
    </main>
  );
}
