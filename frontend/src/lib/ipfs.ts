/**
 * Upload file to IPFS using our API route
 * This handles IPFS uploads server-side to avoid CORS and authentication issues
 */
export async function uploadToIPFS(file: File): Promise<string> {
    try {
        console.log('📤 Uploading file to IPFS via API route...');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('isJSON', 'false');

        const response = await fetch('/api/ipfs/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Upload failed');
        }

        console.log('✅ Uploaded to IPFS:', result.cid);

        // Return CID
        return result.cid;
    } catch (error) {
        console.error('Error uploading to IPFS:', error);
        throw error;
    }
}

export async function uploadJSONToIPFS(data: any): Promise<string> {
    try {
        console.log('📤 Uploading JSON to IPFS via API route...');

        // Convert JSON to file
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const file = new File([blob], 'metadata.json', { type: 'application/json' });

        return await uploadToIPFS(file);
    } catch (error) {
        console.error('Error uploading JSON to IPFS:', error);
        throw error;
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
