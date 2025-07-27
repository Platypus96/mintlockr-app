"use client";

import { useState, useRef, type ChangeEvent } from 'react';
import Image from 'next/image';
import { ethers } from 'ethers';
import {
  Wallet,
  UploadCloud,
  Loader2,
  CheckCircle,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  FileText
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MINTLOCKR_CONTRACT_ADDRESS, MINTLOCKR_ABI } from '@/lib/contracts';
import { Input } from './ui/input';
import { Label } from './ui/label';

type Status = 'idle' | 'connecting' | 'minting' | 'success';

export function MintNftCard() {
  const [account, setAccount] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [nftName, setNftName] = useState<string>('');
  const [nftDescription, setNftDescription] = useState<string>('');
  const [status, setStatus] = useState<Status>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [nftAddress, setNftAddress] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isWorking = status === 'connecting' || status === 'minting';

  const handleConnectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast({
        variant: 'destructive',
        title: 'MetaMask not found',
        description: 'Please install MetaMask to use this app.',
      });
      return;
    }
    setStatus('connecting');
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      setStatus('idle');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Connection Failed',
        description: 'Could not connect to MetaMask. Please try again.',
      });
      setStatus('idle');
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ variant: 'destructive', title: 'Invalid File', description: 'Please upload an image file.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setStatus('idle');
        setTxHash(null);
        setTokenId(null);
        setNftAddress(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMint = async () => {
    if (!image || !nftName || !nftDescription || !account) {
        toast({
            variant: 'destructive',
            title: 'Missing Information',
            description: 'Please upload an image and provide a name and description.',
        });
        return;
    }
    setStatus('minting');
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();

      // In a real app, you would upload the image and metadata to a decentralized
      // storage service like IPFS and get a metadata URI.
      // For this example, we'll use a placeholder URI.
      // The metadata would include the `description` state.
      const metadataUri = 'ipfs://bafkreiem4qwt4hmv3b2z3t36sdk4xquxv564ygrfy3yvj7i2s72s6q43om';

      const contract = new ethers.Contract(MINTLOCKR_CONTRACT_ADDRESS, MINTLOCKR_ABI, signer);
      
      const tx = await contract.safeMint(account, metadataUri);
      const receipt = await tx.wait();

      let mintedTokenId = null;
      if (receipt.logs) {
        for (const log of receipt.logs) {
            try {
                const parsedLog = contract.interface.parseLog(log);
                if (parsedLog && parsedLog.name === "Transfer") {
                    mintedTokenId = parsedLog.args.tokenId.toString();
                    break;
                }
            } catch (error) {
                // This log might not be from your contract, ignore it
            }
        }
      }

      setTxHash(tx.hash);
      setTokenId(mintedTokenId);
      setNftAddress(MINTLOCKR_CONTRACT_ADDRESS);
      setStatus('success');
      toast({
        title: 'NFT Minted!',
        description: 'Your new digital asset is now on the blockchain.',
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Minting Failed',
        description: error.reason || 'The transaction was cancelled or failed.',
      });
      setStatus('idle');
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
        toast({ title: 'Copied to clipboard!' });
    });
  };

  const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const resetForm = () => {
    setImage(null);
    setNftName('');
    setNftDescription('');
    setStatus('idle');
    setTxHash(null);
    setTokenId(null);
    setNftAddress(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  return (
    <Card className="w-full shadow-2xl shadow-primary/10 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">NFT Minter</span>
          {account ? (
            <div className="text-sm font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              {truncateAddress(account)}
            </div>
          ) : (
            <Button onClick={handleConnectWallet} disabled={isWorking}>
              {status === 'connecting' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
              Connect Wallet
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          {account ? 'Upload an image, describe it, and mint it as a unique NFT.' : 'Connect your wallet to get started.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {account && (
          <>
            {status !== 'success' && (
              <div className="space-y-6">
                <div
                  className="relative border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-all duration-300 group bg-background/50"
                  onClick={() => !isWorking && fileInputRef.current?.click()}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" disabled={isWorking} />
                  {image ? (
                    <Image
                      src={image}
                      alt="NFT Preview"
                      width={400}
                      height={400}
                      className="rounded-md w-full h-auto object-contain max-h-64"
                      data-ai-hint="abstract art"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <UploadCloud className="w-12 h-12 mb-2 transition-transform duration-300 group-hover:scale-110 text-primary" />
                      <span className="font-semibold text-foreground">Click to upload image</span>
                      <p className="text-xs">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  )}
                </div>

                {image && (
                   <div className="space-y-4">
                     <div className="space-y-2">
                       <Label htmlFor="nft-name"><ImageIcon className="inline-block mr-2 -mt-1"/>NFT Name</Label>
                       <Input id="nft-name" placeholder="e.g. 'Cyberpunk Cat'" value={nftName} onChange={(e) => setNftName(e.target.value)} disabled={isWorking} />
                     </div>
                      <div className="space-y-2">
                       <Label htmlFor="nft-description"><FileText className="inline-block mr-2 -mt-1"/>NFT Description</Label>
                       <Input id="nft-description" placeholder="A short story about your NFT" value={nftDescription} onChange={(e) => setNftDescription(e.target.value)} disabled={isWorking} />
                     </div>
                   </div>
                )}
              </div>
            )}
            
            {status === 'success' && txHash && tokenId && nftAddress && (
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20 space-y-4 animate-in fade-in-50 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <CheckCircle className="w-12 h-12 text-green-400" />
                    <div>
                      <h3 className="font-bold text-xl text-foreground">Minting Successful!</h3>
                      <p className="text-sm text-muted-foreground">Your NFT has been created on the Sepolia testnet.</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-left pt-4">
                    <div className="flex justify-between items-center bg-background/50 p-2 rounded-md">
                      <span className="text-muted-foreground">Token ID:</span>
                      <span className="font-mono text-foreground flex items-center gap-2">{tokenId} <Copy className="w-4 h-4 cursor-pointer hover:text-primary" onClick={() => copyToClipboard(tokenId)} /></span>
                    </div>
                    <div className="flex justify-between items-center bg-background/50 p-2 rounded-md">
                      <span className="text-muted-foreground">Contract:</span>
                      <span className="font-mono text-foreground flex items-center gap-2">{truncateAddress(nftAddress)} <Copy className="w-4 h-4 cursor-pointer hover:text-primary" onClick={() => copyToClipboard(nftAddress)} /></span>
                    </div>
                     <div className="flex justify-between items-center bg-background/50 p-2 rounded-md">
                      <span className="text-muted-foreground">Transaction:</span>
                      <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="font-mono text-primary hover:underline flex items-center gap-2">
                        {truncateAddress(txHash)}
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                   <Button onClick={resetForm} className="mt-4">Mint Another NFT</Button>
              </div>
            )}
          </>
        )}
      </CardContent>
      {account && image && status !== 'success' && (
        <CardFooter>
          <Button onClick={handleMint} disabled={isWorking || !nftName || !nftDescription} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6">
            {status === 'minting' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            Mint Your NFT
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
