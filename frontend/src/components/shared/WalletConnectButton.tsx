'use client';

import { useWallet } from "@/contexts/WalletContext";
import { useState, useEffect } from "react";
import { formatAddress } from "@/lib/aptos";
import { isPetraInstalled } from "@/lib/petraWallet";
import { Copy, LogOut, Wallet } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function WalletConnectButton() {
    const { account, connect, disconnect, isWalletConnected, isLoading } = useWallet();
    const [copied, setCopied] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Wait for client-side mount to prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    const handleConnect = async () => {
        try {
            console.log('🔌 Connecting to Petra wallet...');
            await connect();
            console.log('✅ Connected successfully!');
        } catch (error) {
            console.error('❌ Connection failed:', error);
            alert('Failed to connect wallet. Please make sure Petra wallet is unlocked and try again.');
        }
    };

    const handleCopy = () => {
        if (account?.address) {
            navigator.clipboard.writeText(account.address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (isWalletConnected && account) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        className="gap-2 bg-green-50 hover:bg-green-100 border-green-300"
                    >
                        <Wallet className="w-4 h-4" />
                        {formatAddress(account.address)}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleCopy}>
                        <Copy className="w-4 h-4 mr-2" />
                        {copied ? "Copied!" : "Copy Address"}
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <a
                            href={`https://explorer.aptoslabs.com/account/${account.address}?network=testnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cursor-pointer"
                        >
                            View on Explorer
                        </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => disconnect()}
                        className="text-red-600 cursor-pointer"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Disconnect
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    if (isLoading) {
        return (
            <Button disabled>
                <Wallet className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
            </Button>
        );
    }

    // Show loading state during SSR to prevent hydration mismatch
    if (!mounted) {
        return (
            <Button className="gap-2" disabled>
                <Wallet className="w-4 h-4" />
                Connect Wallet
            </Button>
        );
    }

    const petraInstalled = isPetraInstalled();

    return (
        <Button
            className="gap-2"
            onClick={handleConnect}
            disabled={!petraInstalled}
        >
            <Wallet className="w-4 h-4" />
            {petraInstalled ? 'Connect Petra Wallet' : 'Install Petra Wallet'}
        </Button>
    );
}
