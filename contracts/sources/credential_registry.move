module acredia::credential_registry {
    use std::string::String;
    use std::table::{Self, Table};
    use std::vector;
    use std::signer;
    use aptos_framework::event;

    // Error codes
    const EREGISTRY_NOT_INITIALIZED: u64 = 1;
    const ECREDENTIAL_NOT_FOUND: u64 = 2;
    const EALREADY_EXISTS: u64 = 3;

    struct CredentialRecord has store, drop {
        token_id: u64,
        student_wallet: address,
        issuer_wallet: address,
        credential_hash: String,
        ipfs_hash: String,
        issued_at: u64,
    }

    struct Registry has key {
        credentials: Table<u64, CredentialRecord>,
        credentials_by_student: Table<address, vector<u64>>,
        credentials_by_issuer: Table<address, vector<u64>>,
        total_count: u64,
        owner: address,
    }

    #[event]
    struct CredentialRegisteredEvent has drop, store {
        token_id: u64,
        student: address,
        issuer: address,
        credential_hash: String,
        ipfs_hash: String,
    }

    #[event]
    struct CredentialUnregisteredEvent has drop, store {
        token_id: u64,
    }

    // Initialize the registry (call once by admin)
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        assert!(!exists<Registry>(admin_addr), 1); // Registry already exists

        move_to(admin, Registry {
            credentials: table::new(),
            credentials_by_student: table::new(),
            credentials_by_issuer: table::new(),
            total_count: 0,
            owner: admin_addr,
        });
    }

    // Register a credential
    public entry fun register_credential(
        issuer: &signer,
        token_id: u64,
        student: address,
        credential_hash: String,
        ipfs_hash: String,
        registry_addr: address,
    ) acquires Registry {
        let issuer_addr = signer::address_of(issuer);
        
        assert!(exists<Registry>(registry_addr), EREGISTRY_NOT_INITIALIZED);
        
        let registry = borrow_global_mut<Registry>(registry_addr);

        // Check if already exists
        assert!(!table::contains(&registry.credentials, token_id), EALREADY_EXISTS);

        // Create record
        let record = CredentialRecord {
            token_id,
            student_wallet: student,
            issuer_wallet: issuer_addr,
            credential_hash: credential_hash,
            ipfs_hash: ipfs_hash,
            issued_at: 0,
        };

        // Insert into main table
        table::upsert(&mut registry.credentials, token_id, record);

        // Update student credentials list
        if (!table::contains(&registry.credentials_by_student, student)) {
            table::upsert(&mut registry.credentials_by_student, student, vector::empty());
        };
        let student_creds = table::borrow_mut(&mut registry.credentials_by_student, student);
        vector::push_back(student_creds, token_id);

        // Update issuer credentials list
        if (!table::contains(&registry.credentials_by_issuer, issuer_addr)) {
            table::upsert(&mut registry.credentials_by_issuer, issuer_addr, vector::empty());
        };
        let issuer_creds = table::borrow_mut(&mut registry.credentials_by_issuer, issuer_addr);
        vector::push_back(issuer_creds, token_id);

        registry.total_count = registry.total_count + 1;

        event::emit(CredentialRegisteredEvent {
            token_id,
            student,
            issuer: issuer_addr,
            credential_hash,
            ipfs_hash,
        });
    }

    // Unregister a credential
    public entry fun unregister_credential(
        admin: &signer,
        token_id: u64,
        registry_addr: address,
    ) acquires Registry {
        let admin_addr = signer::address_of(admin);
        
        assert!(exists<Registry>(registry_addr), EREGISTRY_NOT_INITIALIZED);
        
        let registry = borrow_global_mut<Registry>(registry_addr);
        
        assert!(registry.owner == admin_addr, 4); // Only owner can unregister

        assert!(table::contains(&registry.credentials, token_id), ECREDENTIAL_NOT_FOUND);

        let _record = table::remove(&mut registry.credentials, token_id);
        registry.total_count = registry.total_count - 1;

        event::emit(CredentialUnregisteredEvent {
            token_id,
        });
    }

    // View function: Get credential by token ID
    #[view]
    public fun get_credential(
        token_id: u64,
        registry_addr: address,
    ): (address, address, String, String, u64) acquires Registry {
        assert!(exists<Registry>(registry_addr), EREGISTRY_NOT_INITIALIZED);
        
        let registry = borrow_global<Registry>(registry_addr);
        assert!(table::contains(&registry.credentials, token_id), ECREDENTIAL_NOT_FOUND);

        let record = table::borrow(&registry.credentials, token_id);
        (
            record.student_wallet,
            record.issuer_wallet,
            record.credential_hash,
            record.ipfs_hash,
            record.issued_at,
        )
    }

    // View function: Get total credentials
    #[view]
    public fun total_credentials(registry_addr: address): u64 acquires Registry {
        assert!(exists<Registry>(registry_addr), EREGISTRY_NOT_INITIALIZED);
        
        let registry = borrow_global<Registry>(registry_addr);
        registry.total_count
    }

    // View function: Get credentials by student
    #[view]
    public fun get_credentials_by_student(
        student: address,
        registry_addr: address,
    ): vector<u64> acquires Registry {
        assert!(exists<Registry>(registry_addr), EREGISTRY_NOT_INITIALIZED);
        
        let registry = borrow_global<Registry>(registry_addr);
        
        if (table::contains(&registry.credentials_by_student, student)) {
            *table::borrow(&registry.credentials_by_student, student)
        } else {
            vector::empty()
        }
    }

    // View function: Get credentials by issuer
    #[view]
    public fun get_credentials_by_issuer(
        issuer: address,
        registry_addr: address,
    ): vector<u64> acquires Registry {
        assert!(exists<Registry>(registry_addr), EREGISTRY_NOT_INITIALIZED);
        
        let registry = borrow_global<Registry>(registry_addr);
        
        if (table::contains(&registry.credentials_by_issuer, issuer)) {
            *table::borrow(&registry.credentials_by_issuer, issuer)
        } else {
            vector::empty()
        }
    }

    // View function: Check if credential exists
    #[view]
    public fun credential_exists(
        token_id: u64,
        registry_addr: address,
    ): bool acquires Registry {
        assert!(exists<Registry>(registry_addr), EREGISTRY_NOT_INITIALIZED);
        
        let registry = borrow_global<Registry>(registry_addr);
        table::contains(&registry.credentials, token_id)
    }
}
