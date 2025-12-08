import { supabase } from './supabase';
import { uploadToIPFS, uploadJSONToIPFS, getIPFSUrl } from './ipfs';
import {
    MODULE_ADDRESS,
    buildIssueCredentialTx,
    getCredentialsByStudent,
    getCredentialsByIssuer,
} from './aptos';

export interface Subject {
    id: string;
    name: string;
    marks: string;
    maxMarks: string;
    grade?: string;
}

export interface CredentialData {
    // Student info
    studentName: string;
    studentWallet: string;
    studentEmail?: string;

    // Credential details
    credentialType: string;
    degree: string;
    major?: string;
    gpa?: string;
    issueDate: string;
    subjects?: Subject[];

    // Institution info
    institutionId: string;
    institutionName: string;
    institutionWallet: string;

    // File
    file: File;
}

export interface CredentialMetadata {
    name: string;
    description: string;
    image: string;
    attributes: Array<{
        trait_type: string;
        value: string;
    }>;
    credentialData: {
        studentName: string;
        studentWallet: string;
        degree: string;
        major?: string;
        gpa?: string;
        issueDate: string;
        institutionName: string;
        credentialType: string;
        subjects?: Subject[];
    };
}

// Helper function to generate credential hash
function generateCredentialHash(data: any): string {
    return `0x${Math.random().toString(16).substring(2, 66)}`;
}

/**
 * Prepare credential metadata and upload to IPFS
 * Returns metadata ready for blockchain transaction
 */
export async function prepareCredentialMetadata(
    data: CredentialData
): Promise<{
    metadata: CredentialMetadata;
    ipfsUri: string;
    metadataHash: string;
}> {
    try {
        // Step 1: Upload credential file to IPFS
        console.log('📤 Uploading credential file to IPFS...');
        const fileCID = await uploadToIPFS(data.file);
        const fileUrl = getIPFSUrl(fileCID);
        console.log('✅ File uploaded to IPFS:', fileUrl);

        // Step 2: Generate metadata
        console.log('📝 Generating metadata...');
        const metadata: CredentialMetadata = {
            name: `${data.credentialType} - ${data.studentName}`,
            description: `Academic credential issued by ${data.institutionName} to ${data.studentName}`,
            image: fileUrl,
            attributes: [
                { trait_type: 'Credential Type', value: data.credentialType },
                { trait_type: 'Degree', value: data.degree },
                { trait_type: 'Institution', value: data.institutionName },
                { trait_type: 'Issue Date', value: data.issueDate },
                ...(data.major ? [{ trait_type: 'Major', value: data.major }] : []),
                ...(data.gpa ? [{ trait_type: 'GPA', value: data.gpa }] : []),
                ...(data.subjects && data.subjects.length > 0
                    ? [{ trait_type: 'Total Subjects', value: data.subjects.length.toString() }]
                    : []),
            ],
            credentialData: {
                studentName: data.studentName,
                studentWallet: data.studentWallet,
                degree: data.degree,
                major: data.major,
                gpa: data.gpa,
                issueDate: data.issueDate,
                institutionName: data.institutionName,
                credentialType: data.credentialType,
                subjects: data.subjects,
            },
        };

        // Step 3: Upload metadata to IPFS
        console.log('📤 Uploading metadata to IPFS...');
        const metadataCID = await uploadJSONToIPFS(metadata);
        const ipfsUri = `ipfs://${metadataCID}`;
        console.log('✅ Metadata uploaded to IPFS:', ipfsUri);

        return {
            metadata,
            ipfsUri,
            metadataHash: metadataCID,
        };
    } catch (error) {
        console.error('❌ Error preparing credential metadata:', error);
        throw error;
    }
}

/**
 * Save credential to database after successful blockchain transaction
 * This is for indexing only - blockchain is the source of truth
 */
export async function saveCredentialToDatabase(
    data: CredentialData,
    tokenId: string,
    blockchainHash: string,
    metadata: CredentialMetadata,
    ipfsHash: string
): Promise<string> {
    try {
        console.log('💾 Saving credential to database for indexing...');
        console.log('Token ID from blockchain:', tokenId);
        console.log('Blockchain transaction:', blockchainHash);

        const { data: dbRecord, error: dbError } = await supabase
            .from('credentials')
            .insert([{
                institution_id: data.institutionId,
                student_wallet_address: data.studentWallet,
                issuer_wallet_address: data.institutionWallet,
                token_id: tokenId,
                ipfs_hash: ipfsHash,
                blockchain_hash: blockchainHash,
                metadata: metadata,
                issued_at: new Date().toISOString(),
                revoked: false,
            }])
            .select('id')
            .single();

        if (dbError) {
            console.error('Database save error:', dbError);
            // Don't throw - blockchain transaction succeeded, database is just for indexing
            console.warn('⚠️ Blockchain transaction successful but database indexing failed');
            return '';
        }

        console.log('✅ Credential indexed in database');
        return dbRecord?.id || '';
    } catch (error) {
        console.error('❌ Error saving to database:', error);
        // Don't throw - blockchain is source of truth
        return '';
    }
}

/**
 * @deprecated Use prepareCredentialMetadata and saveCredentialToDatabase separately
 * This function is kept for backward compatibility but should not be used
 */
/**
 * @deprecated Use prepareCredentialMetadata and saveCredentialToDatabase separately
 * This function is kept for backward compatibility but should not be used
 */
export async function issueCredential(
    data: CredentialData,
    account: any
): Promise<{
    credentialId?: string;
    ipfsUri: string;
    metadataHash: string;
}> {
    // This function should not be used - kept for backward compatibility
    // Use prepareCredentialMetadata first, then blockchain, then saveCredentialToDatabase
    const result = await prepareCredentialMetadata(data);
    return {
        credentialId: undefined,
        ipfsUri: result.ipfsUri,
        metadataHash: result.metadataHash,
    };
}

/**
 * Get all credentials issued by an institution
 */
export async function getInstitutionCredentials(institutionId: string) {
    try {
        const { data, error } = await supabase
            .from('credentials')
            .select('*')
            .eq('institution_id', institutionId)
            .order('issued_at', { ascending: false });

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('Error fetching institution credentials:', error);
        throw error;
    }
}

/**
 * Get a single credential by ID
 */
export async function getCredentialById(credentialId: string) {
    try {
        const { data, error } = await supabase
            .from('credentials')
            .select('*')
            .eq('id', credentialId)
            .single();

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('Error fetching credential:', error);
        throw error;
    }
}

/**
 * Revoke a credential in the database
 */
export async function revokeCredentialById(
    credentialId: string,
    account?: any
): Promise<void> {
    try {
        // Get credential from database
        const credential = await getCredentialById(credentialId);
        if (!credential) {
            throw new Error('Credential not found');
        }

        if (credential.revoked) {
            throw new Error('Credential is already revoked');
        }

        // Validate wallet authorization if account provided
        if (account) {
            const connectedWallet = account?.address?.toLowerCase();
            const issuerWallet = credential.issuer_wallet_address?.toLowerCase();

            if (connectedWallet && issuerWallet && connectedWallet !== issuerWallet) {
                throw new Error(
                    `Authorization failed: You must use the same wallet that issued this credential.`
                );
            }
        }

        // Update in database
        const { error } = await supabase
            .from('credentials')
            .update({
                revoked: true,
                revoked_at: new Date().toISOString()
            })
            .eq('id', credentialId);

        if (error) throw error;

        console.log('✅ Credential revoked successfully');
    } catch (error) {
        console.error('Error revoking credential:', error);
        throw error;
    }
}
