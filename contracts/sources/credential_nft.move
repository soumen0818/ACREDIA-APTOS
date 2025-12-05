module acredia::credential_nft {
    use std::signer;
    use std::vector;
    use std::string::String;
    use aptos_framework::event;

    // Error codes
    const ENOT_AUTHORIZED: u64 = 1;
    const EINVALID_STUDENT: u64 = 2;
    const ECREDENTIAL_NOT_FOUND: u64 = 3;
    const EALREADY_REVOKED: u64 = 4;
    const EISSUER_NOT_AUTHORIZED: u64 = 5;
    const ESTORE_NOT_INITIALIZED: u64 = 6;

    // Credential NFT struct
    struct CredentialNFT has store {
        token_id: u64,
        student_address: address,
        credential_hash: String,
        ipfs_uri: String,
        issuer_address: address,
        issued_at: u64,
        is_revoked: bool,
    }

    // Store for all credentials
    struct CredentialStore has key {
        credentials: vector<CredentialNFT>,
        next_token_id: u64,
        authorized_issuers: vector<address>,
        owner: address,
    }

    // Events
    #[event]
    struct CredentialIssuedEvent has drop, store {
        token_id: u64,
        student: address,
        issuer: address,
        credential_hash: String,
        ipfs_uri: String,
    }

    #[event]
    struct CredentialRevokedEvent has drop, store {
        token_id: u64,
        issuer: address,
    }

    #[event]
    struct IssuerAuthorizedEvent has drop, store {
        issuer: address,
    }

    #[event]
    struct IssuerRevokedEvent has drop, store {
        issuer: address,
    }

    // Initialize the credential store (call once by admin)
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        assert!(!exists<CredentialStore>(admin_addr), 1); // Store already exists

        move_to(admin, CredentialStore {
            credentials: vector::empty(),
            next_token_id: 1,
            authorized_issuers: vector::empty(),
            owner: admin_addr,
        });
    }

    // Authorize an issuer (institution)
    public entry fun authorize_issuer(
        admin: &signer,
        issuer: address,
    ) acquires CredentialStore {
        let admin_addr = signer::address_of(admin);
        let store = borrow_global_mut<CredentialStore>(admin_addr);
        
        assert!(store.owner == admin_addr, ENOT_AUTHORIZED);
        assert!(!vector::contains(&store.authorized_issuers, &issuer), 2); // Already authorized
        
        vector::push_back(&mut store.authorized_issuers, issuer);
        event::emit(IssuerAuthorizedEvent { issuer });
    }

    // Revoke an issuer's authorization
    public entry fun revoke_issuer(
        admin: &signer,
        issuer: address,
    ) acquires CredentialStore {
        let admin_addr = signer::address_of(admin);
        let store = borrow_global_mut<CredentialStore>(admin_addr);
        
        assert!(store.owner == admin_addr, ENOT_AUTHORIZED);

        let (found, idx) = vector::index_of(&store.authorized_issuers, &issuer);
        assert!(found, 3); // Issuer not found

        vector::remove(&mut store.authorized_issuers, idx);
        event::emit(IssuerRevokedEvent { issuer });
    }

    // Issue a credential NFT
    public entry fun issue_credential(
        issuer: &signer,
        student_address: address,
        credential_hash: String,
        ipfs_uri: String,
        credential_store_addr: address,
    ) acquires CredentialStore {
        let issuer_addr = signer::address_of(issuer);
        
        assert!(exists<CredentialStore>(credential_store_addr), ESTORE_NOT_INITIALIZED);
        
        let store = borrow_global_mut<CredentialStore>(credential_store_addr);

        // Verify issuer is authorized
        assert!(
            vector::contains(&store.authorized_issuers, &issuer_addr),
            ENOT_AUTHORIZED
        );

        // Verify student address is valid
        assert!(student_address != @0x0, EINVALID_STUDENT);

        // Create credential
        let credential = CredentialNFT {
            token_id: store.next_token_id,
            student_address,
            credential_hash: credential_hash,
            ipfs_uri: ipfs_uri,
            issuer_address: issuer_addr,
            issued_at: 0,
            is_revoked: false,
        };

        let token_id = store.next_token_id;
        
        // Store credential
        vector::push_back(&mut store.credentials, credential);
        store.next_token_id = store.next_token_id + 1;

        // Emit event
        event::emit(CredentialIssuedEvent {
            token_id,
            student: student_address,
            issuer: issuer_addr,
            credential_hash,
            ipfs_uri,
        });
    }

    // Revoke a credential
    public entry fun revoke_credential(
        issuer: &signer,
        token_id: u64,
        credential_store_addr: address,
    ) acquires CredentialStore {
        let issuer_addr = signer::address_of(issuer);
        
        assert!(exists<CredentialStore>(credential_store_addr), ESTORE_NOT_INITIALIZED);
        
        let store = borrow_global_mut<CredentialStore>(credential_store_addr);

        let _i = 0;
        while (_i < vector::length(&store.credentials)) {
            let credential = vector::borrow_mut(&mut store.credentials, _i);
            
            if (credential.token_id == token_id) {
                assert!(
                    credential.issuer_address == issuer_addr || store.owner == issuer_addr,
                    ENOT_AUTHORIZED
                );
                assert!(!credential.is_revoked, EALREADY_REVOKED);
                
                credential.is_revoked = true;
                
                event::emit(CredentialRevokedEvent {
                    token_id,
                    issuer: issuer_addr,
                });
                
                return
            };
            
            let _i = _i + 1;
        };

        abort ECREDENTIAL_NOT_FOUND
    }

    // View function: Get credential details
    #[view]
    public fun get_credential(
        token_id: u64,
        credential_store_addr: address,
    ): (address, String, String, address, u64, bool) acquires CredentialStore {
        assert!(exists<CredentialStore>(credential_store_addr), ESTORE_NOT_INITIALIZED);
        
        let store = borrow_global<CredentialStore>(credential_store_addr);
        
        let _i = 0;
        while (_i < vector::length(&store.credentials)) {
            let credential = vector::borrow(&store.credentials, _i);
            if (credential.token_id == token_id) {
                return (
                    credential.student_address,
                    credential.credential_hash,
                    credential.ipfs_uri,
                    credential.issuer_address,
                    credential.issued_at,
                    credential.is_revoked,
                )
            };
            let _i = _i + 1;
        };

        abort ECREDENTIAL_NOT_FOUND
    }

    // View function: Check if credential is valid
    #[view]
    public fun is_credential_valid(
        token_id: u64,
        credential_store_addr: address,
    ): bool acquires CredentialStore {
        assert!(exists<CredentialStore>(credential_store_addr), ESTORE_NOT_INITIALIZED);
        
        let store = borrow_global<CredentialStore>(credential_store_addr);
        
        let _i = 0;
        while (_i < vector::length(&store.credentials)) {
            let credential = vector::borrow(&store.credentials, _i);
            if (credential.token_id == token_id) {
                return !credential.is_revoked
            };
            let _i = _i + 1;
        };

        false
    }

    // View function: Get credentials by student
    #[view]
    public fun get_credentials_by_student(
        student: address,
        credential_store_addr: address,
    ): vector<u64> acquires CredentialStore {
        assert!(exists<CredentialStore>(credential_store_addr), ESTORE_NOT_INITIALIZED);
        
        let store = borrow_global<CredentialStore>(credential_store_addr);
        let result = vector::empty();
        
        let _i = 0;
        while (_i < vector::length(&store.credentials)) {
            let credential = vector::borrow(&store.credentials, _i);
            if (credential.student_address == student) {
                vector::push_back(&mut result, credential.token_id);
            };
            let _i = _i + 1;
        };

        result
    }

    // View function: Get credentials by issuer
    #[view]
    public fun get_credentials_by_issuer(
        issuer: address,
        credential_store_addr: address,
    ): vector<u64> acquires CredentialStore {
        assert!(exists<CredentialStore>(credential_store_addr), ESTORE_NOT_INITIALIZED);
        
        let store = borrow_global<CredentialStore>(credential_store_addr);
        let result = vector::empty();
        
        let _i = 0;
        while (_i < vector::length(&store.credentials)) {
            let credential = vector::borrow(&store.credentials, _i);
            if (credential.issuer_address == issuer) {
                vector::push_back(&mut result, credential.token_id);
            };
            let _i = _i + 1;
        };

        result
    }

    // View function: Get total credentials
    #[view]
    public fun total_credentials(credential_store_addr: address): u64 acquires CredentialStore {
        assert!(exists<CredentialStore>(credential_store_addr), ESTORE_NOT_INITIALIZED);
        
        let store = borrow_global<CredentialStore>(credential_store_addr);
        vector::length(&store.credentials)
    }

    // View function: Check if issuer is authorized
    #[view]
    public fun is_issuer_authorized(
        issuer: address,
        credential_store_addr: address,
    ): bool acquires CredentialStore {
        assert!(exists<CredentialStore>(credential_store_addr), ESTORE_NOT_INITIALIZED);
        
        let store = borrow_global<CredentialStore>(credential_store_addr);
        vector::contains(&store.authorized_issuers, &issuer)
    }

    // View function: Get the owner of the credential store
    #[view]
    public fun get_owner(credential_store_addr: address): address acquires CredentialStore {
        assert!(exists<CredentialStore>(credential_store_addr), ESTORE_NOT_INITIALIZED);
        
        let store = borrow_global<CredentialStore>(credential_store_addr);
        store.owner
    }

    // View function: Get all authorized issuers
    #[view]
    public fun get_authorized_issuers(credential_store_addr: address): vector<address> acquires CredentialStore {
        assert!(exists<CredentialStore>(credential_store_addr), ESTORE_NOT_INITIALIZED);
        
        let store = borrow_global<CredentialStore>(credential_store_addr);
        store.authorized_issuers
    }
}
