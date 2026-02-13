//! # DocuMarket Smart Contract
//! 
//! The core marketplace contract for DocuMate that enforces the 75/20/5 revenue split.
//! 
//! ## Revenue Distribution (IMMUTABLE)
//! - 75% → Creator (Template Seller)
//! - 20% → DocuMate Treasury (Company Revenue)
//! - 5%  → Burn Address (Deflationary Mechanism)
//!
//! ## Key Features
//! - NFT-based template ownership
//! - Automatic revenue splitting on purchase
//! - Verification status management
//! - Royalty enforcement on secondary sales

#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod docu_marketplace {
    use ink::prelude::string::String;
    use ink::prelude::vec::Vec;
    use ink::storage::Mapping;

    // ============================================================
    // CONSTANTS - THE IRON RULES (NEVER CHANGE)
    // ============================================================
    
    /// Creator's share of each sale (75%)
    const CREATOR_SHARE: u8 = 75;
    /// Company treasury share (20%)
    const COMPANY_SHARE: u8 = 20;
    /// Burn share for deflation (5%)
    const BURN_SHARE: u8 = 5;
    
    // ============================================================
    // TYPES
    // ============================================================
    
    /// Unique identifier for templates
    pub type TemplateId = u64;
    
    /// Template metadata stored on-chain
    #[derive(Debug, Clone, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout))]
    pub struct Template {
        /// Template unique ID
        pub id: TemplateId,
        /// Creator's account (receives 75%)
        pub creator: AccountId,
        /// Current owner (for secondary sales)
        pub owner: AccountId,
        /// Price in $DOCU tokens (smallest unit)
        pub price: Balance,
        /// IPFS CID of encrypted template content
        pub ipfs_cid: String,
        /// Template category (Legal, Creative, Engineering)
        pub category: String,
        /// Whether template is verified ("Blue Check")
        pub is_verified: bool,
        /// Whether template is listed for sale
        pub is_listed: bool,
        /// Total sales count
        pub sales_count: u64,
        /// Creation timestamp
        pub created_at: Timestamp,
    }
    
    /// Purchase receipt for audit trail
    #[derive(Debug, Clone, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct PurchaseReceipt {
        pub template_id: TemplateId,
        pub buyer: AccountId,
        pub seller: AccountId,
        pub total_price: Balance,
        pub creator_amount: Balance,
        pub company_amount: Balance,
        pub burn_amount: Balance,
        pub timestamp: Timestamp,
    }
    
    // ============================================================
    // EVENTS
    // ============================================================
    
    /// Emitted when a new template is minted
    #[ink(event)]
    pub struct TemplateMinted {
        #[ink(topic)]
        template_id: TemplateId,
        #[ink(topic)]
        creator: AccountId,
        price: Balance,
        ipfs_cid: String,
    }
    
    /// Emitted when a template is purchased
    #[ink(event)]
    pub struct TemplatePurchased {
        #[ink(topic)]
        template_id: TemplateId,
        #[ink(topic)]
        buyer: AccountId,
        #[ink(topic)]
        seller: AccountId,
        total_price: Balance,
        creator_amount: Balance,
        company_amount: Balance,
        burn_amount: Balance,
    }
    
    /// Emitted when a template is verified
    #[ink(event)]
    pub struct TemplateVerified {
        #[ink(topic)]
        template_id: TemplateId,
        verifier: AccountId,
    }
    
    /// Emitted when tokens are burned
    #[ink(event)]
    pub struct TokensBurned {
        amount: Balance,
        from_sale: TemplateId,
    }
    
    // ============================================================
    // ERRORS
    // ============================================================
    
    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        /// Template does not exist
        TemplateNotFound,
        /// Template is not listed for sale
        NotForSale,
        /// Insufficient payment amount
        InsufficientPayment,
        /// Caller is not the owner
        NotOwner,
        /// Caller is not admin
        NotAdmin,
        /// Template already verified
        AlreadyVerified,
        /// Cannot buy own template
        CannotBuyOwnTemplate,
        /// Transfer failed
        TransferFailed,
        /// Invalid price (must be > 0)
        InvalidPrice,
    }
    
    // ============================================================
    // CONTRACT STORAGE
    // ============================================================
    
    #[ink(storage)]
    pub struct DocuMarketplace {
        /// Contract admin (for verification)
        admin: AccountId,
        /// Company treasury address (receives 20%)
        treasury: AccountId,
        /// Burn address (receives 5% - typically 0x00...00)
        burn_address: AccountId,
        /// Next template ID counter
        next_template_id: TemplateId,
        /// Template storage: ID -> Template
        templates: Mapping<TemplateId, Template>,
        /// User's owned templates: User -> Vec<TemplateId>
        user_templates: Mapping<AccountId, Vec<TemplateId>>,
        /// User's created templates: Creator -> Vec<TemplateId>
        creator_templates: Mapping<AccountId, Vec<TemplateId>>,
        /// Total platform volume (GMV)
        total_volume: Balance,
        /// Total burned tokens
        total_burned: Balance,
    }
    
    // ============================================================
    // IMPLEMENTATION
    // ============================================================
    
    impl DocuMarketplace {
        /// Constructor - Initialize the marketplace
        #[ink(constructor)]
        pub fn new(treasury: AccountId, burn_address: AccountId) -> Self {
            Self {
                admin: Self::env().caller(),
                treasury,
                burn_address,
                next_template_id: 1,
                templates: Mapping::default(),
                user_templates: Mapping::default(),
                creator_templates: Mapping::default(),
                total_volume: 0,
                total_burned: 0,
            }
        }
        
        // --------------------------------------------------------
        // CORE MARKETPLACE FUNCTIONS
        // --------------------------------------------------------
        
        /// Mint a new template NFT
        /// 
        /// # Arguments
        /// * `ipfs_cid` - IPFS content identifier for encrypted template
        /// * `category` - Template category (Legal, Creative, Engineering)
        /// * `price` - Sale price in $DOCU tokens
        #[ink(message, payable)]
        pub fn mint_template(
            &mut self,
            ipfs_cid: String,
            category: String,
            price: Balance,
        ) -> Result<TemplateId, Error> {
            // Validate price
            if price == 0 {
                return Err(Error::InvalidPrice);
            }
            
            let caller = self.env().caller();
            let template_id = self.next_template_id;
            let now = self.env().block_timestamp();
            
            // Create template
            let template = Template {
                id: template_id,
                creator: caller,
                owner: caller,
                price,
                ipfs_cid: ipfs_cid.clone(),
                category,
                is_verified: false,
                is_listed: true,
                sales_count: 0,
                created_at: now,
            };
            
            // Store template
            self.templates.insert(template_id, &template);
            
            // Update creator's template list
            let mut creator_list = self.creator_templates.get(caller).unwrap_or_default();
            creator_list.push(template_id);
            self.creator_templates.insert(caller, &creator_list);
            
            // Update owner's template list
            let mut owner_list = self.user_templates.get(caller).unwrap_or_default();
            owner_list.push(template_id);
            self.user_templates.insert(caller, &owner_list);
            
            // Increment counter
            self.next_template_id += 1;
            
            // Emit event
            self.env().emit_event(TemplateMinted {
                template_id,
                creator: caller,
                price,
                ipfs_cid,
            });
            
            Ok(template_id)
        }
        
        /// Purchase a template - THE CORE 75/20/5 SPLIT LOGIC
        /// 
        /// This function MUST enforce the revenue split:
        /// - 75% to Creator
        /// - 20% to Company Treasury
        /// - 5% to Burn Address
        /// 
        /// # Arguments
        /// * `template_id` - The template to purchase
        #[ink(message, payable)]
        pub fn purchase_template(&mut self, template_id: TemplateId) -> Result<PurchaseReceipt, Error> {
            let buyer = self.env().caller();
            let payment = self.env().transferred_value();
            
            // Get template
            let mut template = self.templates.get(template_id)
                .ok_or(Error::TemplateNotFound)?;
            
            // Validations
            if !template.is_listed {
                return Err(Error::NotForSale);
            }
            if template.owner == buyer {
                return Err(Error::CannotBuyOwnTemplate);
            }
            if payment < template.price {
                return Err(Error::InsufficientPayment);
            }
            
            let total_price = template.price;
            let seller = template.owner;
            let creator = template.creator;
            
            // ====================================================
            // THE IRON RULES: 75/20/5 SPLIT (IMMUTABLE)
            // ====================================================
            
            // Calculate splits (using integer math to avoid rounding errors)
            // Total must equal 100%
            let creator_amount = (total_price * CREATOR_SHARE as u128) / 100;
            let company_amount = (total_price * COMPANY_SHARE as u128) / 100;
            let burn_amount = total_price - creator_amount - company_amount; // Remainder goes to burn
            
            // Verify split integrity (defensive programming)
            assert!(
                creator_amount + company_amount + burn_amount == total_price,
                "Split calculation error - this should never happen"
            );
            
            // ====================================================
            // EXECUTE TRANSFERS
            // ====================================================
            
            // 1. Transfer 75% to CREATOR (always the original creator for royalties)
            if self.env().transfer(creator, creator_amount).is_err() {
                return Err(Error::TransferFailed);
            }
            
            // 2. Transfer 20% to COMPANY TREASURY
            if self.env().transfer(self.treasury, company_amount).is_err() {
                return Err(Error::TransferFailed);
            }
            
            // 3. Transfer 5% to BURN ADDRESS (deflationary mechanism)
            if self.env().transfer(self.burn_address, burn_amount).is_err() {
                return Err(Error::TransferFailed);
            }
            
            // ====================================================
            // UPDATE STATE
            // ====================================================
            
            // Update template ownership
            template.owner = buyer;
            template.sales_count += 1;
            template.is_listed = false; // Delist after purchase
            self.templates.insert(template_id, &template);
            
            // Update user template lists
            // Remove from seller's list
            let mut seller_list = self.user_templates.get(seller).unwrap_or_default();
            seller_list.retain(|&id| id != template_id);
            self.user_templates.insert(seller, &seller_list);
            
            // Add to buyer's list
            let mut buyer_list = self.user_templates.get(buyer).unwrap_or_default();
            buyer_list.push(template_id);
            self.user_templates.insert(buyer, &buyer_list);
            
            // Update platform metrics
            self.total_volume += total_price;
            self.total_burned += burn_amount;
            
            // Create receipt
            let receipt = PurchaseReceipt {
                template_id,
                buyer,
                seller,
                total_price,
                creator_amount,
                company_amount,
                burn_amount,
                timestamp: self.env().block_timestamp(),
            };
            
            // Emit events
            self.env().emit_event(TemplatePurchased {
                template_id,
                buyer,
                seller,
                total_price,
                creator_amount,
                company_amount,
                burn_amount,
            });
            
            self.env().emit_event(TokensBurned {
                amount: burn_amount,
                from_sale: template_id,
            });
            
            Ok(receipt)
        }
        
        /// Calculate the revenue split for a given price (view function)
        /// 
        /// # Arguments
        /// * `price` - The sale price to calculate split for
        /// 
        /// # Returns
        /// (creator_amount, company_amount, burn_amount)
        #[ink(message)]
        pub fn calculate_split(&self, price: Balance) -> (Balance, Balance, Balance) {
            let creator_amount = (price * CREATOR_SHARE as u128) / 100;
            let company_amount = (price * COMPANY_SHARE as u128) / 100;
            let burn_amount = price - creator_amount - company_amount;
            
            (creator_amount, company_amount, burn_amount)
        }
        
        // --------------------------------------------------------
        // LISTING MANAGEMENT
        // --------------------------------------------------------
        
        /// List a template for sale
        #[ink(message)]
        pub fn list_template(&mut self, template_id: TemplateId, price: Balance) -> Result<(), Error> {
            let caller = self.env().caller();
            
            let mut template = self.templates.get(template_id)
                .ok_or(Error::TemplateNotFound)?;
            
            if template.owner != caller {
                return Err(Error::NotOwner);
            }
            
            if price == 0 {
                return Err(Error::InvalidPrice);
            }
            
            template.price = price;
            template.is_listed = true;
            self.templates.insert(template_id, &template);
            
            Ok(())
        }
        
        /// Delist a template
        #[ink(message)]
        pub fn delist_template(&mut self, template_id: TemplateId) -> Result<(), Error> {
            let caller = self.env().caller();
            
            let mut template = self.templates.get(template_id)
                .ok_or(Error::TemplateNotFound)?;
            
            if template.owner != caller {
                return Err(Error::NotOwner);
            }
            
            template.is_listed = false;
            self.templates.insert(template_id, &template);
            
            Ok(())
        }
        
        // --------------------------------------------------------
        // VERIFICATION (ADMIN ONLY)
        // --------------------------------------------------------
        
        /// Verify a template ("Blue Check")
        /// Only callable by admin after manual review
        #[ink(message)]
        pub fn verify_template(&mut self, template_id: TemplateId) -> Result<(), Error> {
            let caller = self.env().caller();
            
            if caller != self.admin {
                return Err(Error::NotAdmin);
            }
            
            let mut template = self.templates.get(template_id)
                .ok_or(Error::TemplateNotFound)?;
            
            if template.is_verified {
                return Err(Error::AlreadyVerified);
            }
            
            template.is_verified = true;
            self.templates.insert(template_id, &template);
            
            self.env().emit_event(TemplateVerified {
                template_id,
                verifier: caller,
            });
            
            Ok(())
        }
        
        /// Revoke verification (admin only)
        #[ink(message)]
        pub fn revoke_verification(&mut self, template_id: TemplateId) -> Result<(), Error> {
            let caller = self.env().caller();
            
            if caller != self.admin {
                return Err(Error::NotAdmin);
            }
            
            let mut template = self.templates.get(template_id)
                .ok_or(Error::TemplateNotFound)?;
            
            template.is_verified = false;
            self.templates.insert(template_id, &template);
            
            Ok(())
        }
        
        // --------------------------------------------------------
        // VIEW FUNCTIONS (QUERIES)
        // --------------------------------------------------------
        
        /// Get template details
        #[ink(message)]
        pub fn get_template(&self, template_id: TemplateId) -> Option<Template> {
            self.templates.get(template_id)
        }
        
        /// Get all templates owned by a user
        #[ink(message)]
        pub fn get_user_templates(&self, user: AccountId) -> Vec<TemplateId> {
            self.user_templates.get(user).unwrap_or_default()
        }
        
        /// Get all templates created by a user
        #[ink(message)]
        pub fn get_creator_templates(&self, creator: AccountId) -> Vec<TemplateId> {
            self.creator_templates.get(creator).unwrap_or_default()
        }
        
        /// Get platform statistics
        #[ink(message)]
        pub fn get_platform_stats(&self) -> (Balance, Balance, TemplateId) {
            (self.total_volume, self.total_burned, self.next_template_id - 1)
        }
        
        /// Get the current admin
        #[ink(message)]
        pub fn get_admin(&self) -> AccountId {
            self.admin
        }
        
        /// Get the treasury address
        #[ink(message)]
        pub fn get_treasury(&self) -> AccountId {
            self.treasury
        }
        
        /// Get the burn address
        #[ink(message)]
        pub fn get_burn_address(&self) -> AccountId {
            self.burn_address
        }
        
        // --------------------------------------------------------
        // ADMIN FUNCTIONS
        // --------------------------------------------------------
        
        /// Transfer admin rights
        #[ink(message)]
        pub fn transfer_admin(&mut self, new_admin: AccountId) -> Result<(), Error> {
            if self.env().caller() != self.admin {
                return Err(Error::NotAdmin);
            }
            
            self.admin = new_admin;
            Ok(())
        }
        
        /// Update treasury address (admin only)
        #[ink(message)]
        pub fn update_treasury(&mut self, new_treasury: AccountId) -> Result<(), Error> {
            if self.env().caller() != self.admin {
                return Err(Error::NotAdmin);
            }
            
            self.treasury = new_treasury;
            Ok(())
        }
    }
    
    // ============================================================
    // TESTS
    // ============================================================
    
    #[cfg(test)]
    mod tests {
        use super::*;
        
        #[ink::test]
        fn test_split_calculation() {
            let contract = DocuMarketplace::new(
                AccountId::from([0x01; 32]),
                AccountId::from([0x00; 32]),
            );
            
            // Test $100 sale
            let price: Balance = 100_000_000_000; // 100 tokens (12 decimals)
            let (creator, company, burn) = contract.calculate_split(price);
            
            // 75% = 75 tokens
            assert_eq!(creator, 75_000_000_000);
            // 20% = 20 tokens
            assert_eq!(company, 20_000_000_000);
            // 5% = 5 tokens
            assert_eq!(burn, 5_000_000_000);
            
            // Verify total
            assert_eq!(creator + company + burn, price);
        }
        
        #[ink::test]
        fn test_split_integrity() {
            let contract = DocuMarketplace::new(
                AccountId::from([0x01; 32]),
                AccountId::from([0x00; 32]),
            );
            
            // Test various prices to ensure no rounding errors
            let test_prices: Vec<Balance> = vec![
                1,
                100,
                1_000_000,
                999_999_999,
                123_456_789_012,
            ];
            
            for price in test_prices {
                let (creator, company, burn) = contract.calculate_split(price);
                assert_eq!(
                    creator + company + burn,
                    price,
                    "Split doesn't equal total for price: {}",
                    price
                );
            }
        }
    }
}
