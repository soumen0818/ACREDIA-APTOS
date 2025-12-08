import { NextRequest, NextResponse } from 'next/server';

// Pinata API configuration (production)
const PINATA_JWT = process.env.PINATA_JWT || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI4NmQ4ZjNhZi0wM2Y2LTRmNzAtOGViMy1kOGJjZDUyNGNkNGMiLCJlbWFpbCI6InNkYXM3MjE0NDRAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6Ijc5M2M1ODVhM2YwMGRiN2Q2ODc2Iiwic2NvcGVkS2V5U2VjcmV0IjoiM2E0NTc4NjIzYWYxM2UwMTdkOWY1ZGZkNWVhMzYxN2RjMmRmNzg1YThiYjk0MTg0ZTE3YmI2YzA4NjgyMWQxZSIsImV4cCI6MTc5Njc1MzA0NX0.CwxEwdXOz36_7KvkuRWGdcIGjOmkmvT0Q-7dA-1TViA';
const PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';

/**
 * Upload file to IPFS via server-side API route
 * This avoids CORS issues and provides better error handling
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const isJSON = formData.get('isJSON') === 'true';

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            );
        }

        console.log('📤 Uploading to IPFS via Pinata:', file.name, 'Type:', file.type);

        // Upload to Pinata with authentication
        const cid = await uploadToPinata(file);

        console.log('✅ Successfully uploaded to IPFS:', cid);

        return NextResponse.json({
            success: true,
            cid,
            url: `https://ipfs.io/ipfs/${cid}`,
            gateway: 'pinata'
        });

    } catch (error) {
        console.error('❌ IPFS upload error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to upload to IPFS',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

/**
 * Upload to Pinata IPFS with authentication (production)
 */
async function uploadToPinata(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(PINATA_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${PINATA_JWT}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pinata upload failed (${response.status}): ${errorText}`);
    }

    const result = await response.json();

    // Pinata returns the CID in IpfsHash field
    const cid = result.IpfsHash;

    if (!cid) {
        throw new Error('No CID returned from Pinata');
    }

    return cid;
}