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
 * Issue a credential - saves to database and IPFS
 * Blockchain transaction handling is done in components
 */
export async function issueCredential(
    data: CredentialData,
    account: any
): Promise<{
    credentialId?: string;
    ipfsUri: string;
    metadataHash: string;
}> {
    try {
        // Step 1: Upload credential file to IPFS
        console.log('📤 Uploading credential file to IPFS...');
        const fileCID = await uploadToIPFS(data.file);
        const fileUrl = getIPFSUrl(fileCID);
        console.log('✅ File uploaded:', fileUrl);

        // Step 2: Generate and upload metadata to IPFS
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

        console.log('📤 Uploading metadata to IPFS...');
        const metadataPath = await uploadJSONToIPFS(metadata);
        const metadataUrl = `ipfs://${metadataPath}`;
        console.log('✅ Metadata uploaded:', metadataUrl);

        // Step 3: Save to Supabase database
        console.log('💾 Saving to database...');
        const credentialHash = generateCredentialHash(metadata);

        const { data: dbRecord, error: dbError } = await supabase
            .from('credentials')
            .insert([{
                institution_id: data.institutionId,
                student_wallet_address: data.studentWallet,
                issuer_wallet_address: data.institutionWallet,
                ipfs_hash: metadataPath,
                metadata: metadata,
                issued_at: new Date().toISOString(),
                revoked: false,
            }])
            .select();

        if (dbError) {
            console.error('Database save error:', dbError);
            throw new Error('Failed to save credential to database');
        }

        console.log('✅ Credential saved to database');

        return {
            credentialId: dbRecord?.[0]?.id,
            ipfsUri: metadataUrl,
            metadataHash: metadataPath,
        };
    } catch (error) {
        console.error('❌ Error issuing credential:', error);
        throw error;
    }
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
