use soroban_sdk::{contracttype, Address, Bytes, BytesN, Map, Vec};

// ─── Enums ───────────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, PartialEq, Debug)]
pub enum CircleStatus {
    Filling,    // waiting for members to join up to member_count
    Active,     // contributions and payouts happening
    Completed,  // all cycles done
}

#[contracttype]
#[derive(Clone, PartialEq, Debug)]
pub enum PayoutOrderType {
    Manual,        // order finalized at activation in join order
    RandomPending, // will be shuffled at activation using ledger hash
}

// ─── Structs ─────────────────────────────────────────────────────────────────

/// Per-member tracking across all cycles
#[contracttype]
#[derive(Clone, Debug)]
pub struct MemberState {
    /// Whether the member has paid their entry deposit
    pub paid_deposit: bool,
    /// Amount held as deposit (10% of contribution_amount)
    pub deposit_amount: i128,
    /// Cumulative amount contributed across all cycles
    pub total_contributed: i128,
    /// Number of cycles where payment was missed
    pub missed_cycles: u32,
    /// Outstanding debt from missed contributions
    pub debt: i128,
    /// Position in the payout order (0-based, assigned at activation)
    pub payout_position: u32,
    /// Whether this member has already received their one payout
    pub has_received_payout: bool,
    /// Whether this member's deposit has been refunded after completion
    pub deposit_withdrawn: bool,
}

/// Record for a single completed or in-progress cycle
#[contracttype]
#[derive(Clone, Debug)]
pub struct CycleRecord {
    /// 1-based cycle number
    pub cycle_number: u32,
    /// Address that received (or will receive) the payout
    pub recipient: Address,
    /// Per-member contribution status for this cycle (address -> paid?)
    pub contributions: Map<Address, bool>,
    /// How much was actually paid out (may be less than full pot if some missed)
    pub amount_paid_out: i128,
    /// Whether this cycle has been closed
    pub closed: bool,
    /// Timestamp when closed (0 if still open)
    pub closed_at: u64,
    /// Whether debt has already been assessed and charged for this cycle attempt
    pub debt_charged: bool,
}

/// Full circle state — stored persistently per circle_id
#[contracttype]
#[derive(Clone, Debug)]
pub struct CircleState {
    pub id: u64,
    pub name: Bytes,
    pub organizer: Address,
    pub contribution_amount: i128,
    /// Deposit = 10% of contribution_amount held in escrow
    pub deposit_amount: i128,
    pub cycle_length_days: u32,
    /// Maximum seats in this circle (3–12)
    pub member_count: u32,
    pub status: CircleStatus,
    /// Current 1-based cycle number (0 = not yet active)
    pub current_cycle: u32,
    /// Ledger timestamp when current cycle deadline passes
    pub cycle_deadline: u64,
    pub payout_order_type: PayoutOrderType,
    /// Ordered list of members — index = payout position (filled at activation)
    pub payout_order: Vec<Address>,
    /// Per-member state map
    pub member_states: Map<Address, MemberState>,
    /// Historical cycle records
    pub cycles: Vec<CycleRecord>,
    pub created_at: u64,
    pub activated_at: u64,
    /// Randomness seed used for ordering (set from ledger hash at activation)
    pub randomness_seed: BytesN<32>,
    /// Native XLM token contract address (stellar asset contract)
    pub xlm_token: Address,
}
