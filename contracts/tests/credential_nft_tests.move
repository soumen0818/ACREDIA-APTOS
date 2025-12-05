#[test_only]
module acredia::credential_nft_tests {
    use std::string;
    use std::signer;
    use std::vector;
    use acredia::credential_nft;

    const ADMIN: address = @0x123;
    const ISSUER: address = @0x456;
    const STUDENT: address = @0x789;

    #[test(admin = @0x123)]
    public fun test_initialize(admin: &signer) {
        // Initialize the credential store
        credential_nft::initialize(admin);
        
        // Store should be created at admin address
        let admin_addr = signer::address_of(admin);
        assert!(
            credential_nft::total_credentials(admin_addr) == 0,
            0
        );
    }

    #[test(admin = @0x123, issuer = @0x456)]
    public fun test_authorize_issuer(admin: &signer, issuer: &signer) {
        credential_nft::initialize(admin);
        let admin_addr = signer::address_of(admin);
        let issuer_addr = signer::address_of(issuer);

        // Authorize issuer
        credential_nft::authorize_issuer(admin, issuer_addr);

        // Check issuer is authorized
        assert!(
            credential_nft::is_issuer_authorized(issuer_addr, admin_addr),
            0
        );
    }

    #[test(admin = @0x123, issuer = @0x456, student = @0x789)]
    public fun test_issue_credential(
        admin: &signer,
        issuer: &signer,
        student: &signer
    ) {
        credential_nft::initialize(admin);
        let admin_addr = signer::address_of(admin);
        let issuer_addr = signer::address_of(issuer);
        let student_addr = signer::address_of(student);

        // Authorize issuer
        credential_nft::authorize_issuer(admin, issuer_addr);

        // Issue credential
        let cred_hash = string::utf8(b"hash123");
        let ipfs_uri = string::utf8(b"ipfs://QmXXX");

        credential_nft::issue_credential(
            issuer,
            student_addr,
            cred_hash,
            ipfs_uri,
            admin_addr,
        );

        // Check credential was issued
        assert!(
            credential_nft::total_credentials(admin_addr) == 1,
            0
        );

        // Check credential is valid
        assert!(
            credential_nft::is_credential_valid(1, admin_addr),
            0
        );
    }

    #[test(admin = @0x123, issuer = @0x456, student = @0x789)]
    public fun test_revoke_credential(
        admin: &signer,
        issuer: &signer,
        student: &signer
    ) {
        credential_nft::initialize(admin);
        let admin_addr = signer::address_of(admin);
        let issuer_addr = signer::address_of(issuer);
        let student_addr = signer::address_of(student);

        // Authorize issuer
        credential_nft::authorize_issuer(admin, issuer_addr);

        // Issue credential
        let cred_hash = string::utf8(b"hash123");
        let ipfs_uri = string::utf8(b"ipfs://QmXXX");

        credential_nft::issue_credential(
            issuer,
            student_addr,
            cred_hash,
            ipfs_uri,
            admin_addr,
        );

        // Revoke credential
        credential_nft::revoke_credential(issuer, 1, admin_addr);

        // Check credential is revoked
        assert!(
            !credential_nft::is_credential_valid(1, admin_addr),
            0
        );
    }
}
