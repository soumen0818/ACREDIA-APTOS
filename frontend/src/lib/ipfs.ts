/**
 * Upload file to IPFS using NFT.Storage (free service)
 * Works with any blockchain including Aptos
 */
export async function uploadToIPFS(file: File): Promise<string> {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('https://api.nft.storage/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_NFT_STORAGE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDhEODc4NDMzODlCNjE0NjhFNjgxRjI2ODBCNjY4RTQ2RTQwRTQwNkIiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTYzMjE1NTQzMjQ4NCwibmFtZSI6ImRlbW8ifQ.fEcSw_MQjKiUDGhKYqweHqgfY3VfFCXZRQcJoFtYA5U'}`,
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`NFT.Storage upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Uploaded to IPFS:', result.value.cid);
        return result.value.cid;
    } catch (error) {
        console.error('Error uploading to IPFS:', error);
        throw new Error('Failed to upload to IPFS');
    }
}

export async function uploadJSONToIPFS(data: any): Promise<string> {
    try {
        // Convert JSON to file
        const jsonString = JSON.stringify(data);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const file = new File([blob], 'metadata.json', { type: 'application/json' });

        return await uploadToIPFS(file);
    } catch (error) {
        console.error('Error uploading JSON to IPFS:', error);
        throw new Error('Failed to upload JSON to IPFS');
    }
}

export function getIPFSUrl(cidOrUri: string): string {
    // Handle undefined, null, or empty string
    if (!cidOrUri || cidOrUri.trim() === '') {
        return '#'; // Return placeholder to avoid broken links
    }

    // Remove ipfs:// prefix if present
    let fullPath = cidOrUri.replace('ipfs://', '');

    // Split CID and path (e.g., "QmXXX/metadata.json" -> ["QmXXX", "/metadata.json"])
    const parts = fullPath.split('/');
    const cid = parts[0];
    const path = parts.length > 1 ? '/' + parts.slice(1).join('/') : '';

    // Validate CID is not empty
    if (!cid || cid === 'undefined' || cid === 'null') {
        return '#';
    }

    /**
     * IPFS Gateway Selection:
     * 
     * Thirdweb's subdomain gateway (*.ipfscdn.io) only works with CIDv1 (starts with 'bafy')
     * CIDv0 (starts with 'Qm') doesn't work with subdomain gateways due to case-sensitivity
     * 
     * Solution: Use path-based gateway format which works with both CIDv0 and CIDv1
     */

    // Use ipfs.io public gateway with path format (works with all CID versions)
    return `https://ipfs.io/ipfs/${cid}${path}`;

    // Alternative reliable gateways (all use path format):
    // return `https://gateway.pinata.cloud/ipfs/${cid}${path}`;
    // return `https://cloudflare-ipfs.com/ipfs/${cid}${path}`;
    // return `https://dweb.link/ipfs/${cid}${path}`;

    // Thirdweb's gateway with path format (works but may have rate limits):
    // return `https://ipfs.thirdwebcdn.com/ipfs/${cid}${path}`;
} export async function fetchFromIPFS(cid: string): Promise<any> {
    try {
        const url = getIPFSUrl(cid);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching from IPFS:', error);
        throw new Error('Failed to fetch from IPFS');
    }
}
