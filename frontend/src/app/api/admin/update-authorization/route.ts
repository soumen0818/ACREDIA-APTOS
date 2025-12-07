import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const { walletAddress, transactionHash } = await request.json();

        if (!walletAddress) {
            return NextResponse.json(
                { success: false, error: 'Wallet address is required' },
                { status: 400 }
            );
        }

        // Find institution by wallet address
        const { data: institution, error: findError } = await supabase
            .from('institutions')
            .select('*')
            .eq('wallet_address', walletAddress)
            .single();

        if (findError && findError.code !== 'PGRST116') {
            console.error('Error finding institution:', findError);
            return NextResponse.json(
                { success: false, error: 'Failed to find institution' },
                { status: 500 }
            );
        }

        if (institution) {
            // Update institution - mark as verified and store transaction hash
            const { error: updateError } = await supabase
                .from('institutions')
                .update({
                    verified: true,
                    authorization_tx_hash: transactionHash
                })
                .eq('id', institution.id);

            if (updateError) {
                console.error('Error updating institution:', updateError);
                return NextResponse.json(
                    { success: false, error: 'Failed to update institution' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'Institution authorized and verified successfully',
                institution,
                transactionHash,
            });
        }

        // If no institution found with this wallet, return success anyway
        // The dashboard will check blockchain directly
        return NextResponse.json({
            success: true,
            message: 'Wallet authorized on blockchain. Institution will be verified when they connect.',
            wallet: walletAddress,
            transactionHash,
        });
    } catch (error) {
        console.error('Error in update-authorization:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to update authorization',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
