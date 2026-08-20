#![no_std]

mod types;
mod errors;
#[cfg(test)]
mod test;

pub use types::*;
pub use errors::*;

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token,
    Address, Bytes, BytesN, Env, Vec, Map,
};

// ─── Storage Keys ───────────────────────────────────────────────────────────

#[contracttype]
pub enum DataKey {
    Circle(u64),                // circle_id -> CircleState
    NextCircleId,
    MemberCircles(Address),     // address -> Vec<circle_id>
}

// ─── The Contract ───────────────────────────────────────────────────────────

#[contract]
pub struct RoteraContract;

#[contractimpl]
impl RoteraContract {

    // ════════════════════════════════════════════════════════════════════════
    // create_circle
    // Organizer sets up a new open ROSCA circle.
    // Members join by calling join_circle() with a valid invite link.
    // No member list is pre-set — any wallet can join until seats are full.
    // ════════════════════════════════════════════════════════════════════════
    pub fn create_circle(
        env: Env,
        organizer: Address,
        name: Bytes,
        contribution_amount: i128,
        cycle_length_days: u32,
        member_count: u32,
        payout_order: PayoutOrderType,
        xlm_token: Address,
    ) -> u64 {
        organizer.require_auth();

        // Validate inputs
        if contribution_amount <= 0 {
            panic!("contribution_amount must be positive");
        }
        if member_count < 3 || member_count > 12 {
            panic!("member_count must be between 3 and 12");
        }
        if cycle_length_days == 0 {
            panic!("cycle_length_days must be positive");
        }

        // Deposit = 10% of one contribution
        let deposit_amount = contribution_amount / 10;

        let circle = CircleState {
            id: 0, // set below
            name,
            organizer: organizer.clone(),
            contribution_amount,
            deposit_amount,
            cycle_length_days,
            member_count,
            status: CircleStatus::Filling,
            current_cycle: 0,
            cycle_deadline: 0,
            payout_order_type: payout_order,
            payout_order: Vec::new(&env),
            member_states: Map::new(&env),
            cycles: Vec::new(&env),
            created_at: env.ledger().timestamp(),
            activated_at: 0,
            randomness_seed: BytesN::from_array(&env, &[0u8; 32]),
            xlm_token,
        };

        let circle_id = Self::next_circle_id(&env);
        let mut circle = circle;
        circle.id = circle_id;

        env.storage().persistent().set(&DataKey::Circle(circle_id), &circle);
        Self::add_member_circle(&env, &organizer, circle_id);

        env.events().publish(
            (symbol_short!("created"), circle_id),
            organizer,
        );

        circle_id
    }

    // ════════════════════════════════════════════════════════════════════════
    // join_circle
    // Any wallet can join an open circle (status=Filling) by paying the deposit.
    // The deposit is held by this contract until circle completion.
    // When the last seat is filled the circle activates automatically.
    // ════════════════════════════════════════════════════════════════════════
    pub fn join_circle(
        env: Env,
        member: Address,
        circle_id: u64,
    ) {
        member.require_auth();

        let mut circle = Self::get_circle_or_panic(&env, circle_id);

        if circle.status != CircleStatus::Filling {
            panic!("circle is not accepting new members");
        }

        // Check not already joined
        if circle.member_states.contains_key(member.clone()) {
            panic!("you have already joined this circle");
        }

        // Check seat availability
        let current_seats = circle.payout_order.len();
        if current_seats >= circle.member_count {
            panic!("this circle is already full");
        }

        // Transfer deposit from member to this contract
        let token_client = token::Client::new(&env, &circle.xlm_token);
        token_client.transfer(
            &member,
            &env.current_contract_address(),
            &circle.deposit_amount,
        );

        // Record member
        let payout_position = current_seats; // 0-based join order
        let ms = MemberState {
            paid_deposit: true,
            deposit_amount: circle.deposit_amount,
            total_contributed: 0,
            missed_cycles: 0,
            debt: 0,
            payout_position,
            has_received_payout: false,
            deposit_withdrawn: false,
        };
        circle.member_states.set(member.clone(), ms);
        circle.payout_order.push_back(member.clone());

        // Activate when all seats are filled
        if circle.payout_order.len() == circle.member_count {
            circle.status = CircleStatus::Active;
            circle.activated_at = env.ledger().timestamp();
            circle.current_cycle = 1;
            circle.cycle_deadline = Self::calculate_deadline(&env, circle.cycle_length_days);

            // If RandomPending, shuffle payout_order using ledger timestamp+sequence as seed
            if circle.payout_order_type == PayoutOrderType::RandomPending {
                let ts = env.ledger().timestamp();
                let seq = env.ledger().sequence();
                // Combine timestamp and sequence into a 32-byte seed
                let ts_bytes = ts.to_be_bytes();
                let seq_bytes = seq.to_be_bytes();
                let mut seed_arr = [0u8; 32];
                seed_arr[..8].copy_from_slice(&ts_bytes);
                seed_arr[8..12].copy_from_slice(&seq_bytes);
                // XOR in a constant to ensure non-zero even if both are 0
                seed_arr[12] = 0xDE;
                seed_arr[13] = 0xAD;
                seed_arr[14] = 0xBE;
                seed_arr[15] = 0xEF;
                let seed_bn: BytesN<32> = BytesN::from_array(&env, &seed_arr);
                circle.randomness_seed = seed_bn.clone();

                // Fisher-Yates shuffle
                let n = circle.payout_order.len();
                let mut order_vec: Vec<Address> = circle.payout_order.clone();
                let mut rng: u64 = ts.wrapping_mul(6364136223846793005)
                    .wrapping_add(seq as u64)
                    .wrapping_add(1442695040888963407);
                for i in (1..n).rev() {
                    rng = rng.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407);
                    let j = (rng >> 33) % (i as u64 + 1);
                    // Swap i and j
                    let a = order_vec.get(i).unwrap();
                    let b = order_vec.get(j as u32).unwrap();
                    let mut new_order: Vec<Address> = Vec::new(&env);
                    for (k, addr) in order_vec.iter().enumerate() {
                        if k as u32 == i {
                            new_order.push_back(b.clone());
                        } else if k as u64 == j {
                            new_order.push_back(a.clone());
                        } else {
                            new_order.push_back(addr);
                        }
                    }
                    order_vec = new_order;
                }
                circle.payout_order = order_vec;

                // Update payout_position for each member
                for (pos, addr) in circle.payout_order.iter().enumerate() {
                    let mut ms = circle.member_states.get(addr.clone()).unwrap();
                    ms.payout_position = pos as u32;
                    circle.member_states.set(addr, ms);
                }
            }
        }

        env.storage().persistent().set(&DataKey::Circle(circle_id), &circle);
        Self::add_member_circle(&env, &member, circle_id);

        env.events().publish(
            (symbol_short!("joined"), circle_id),
            member,
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // contribute
    // Member sends their share for the current cycle.
    // Transfers real XLM from member's wallet to this contract.
    // ════════════════════════════════════════════════════════════════════════
    pub fn contribute(
        env: Env,
        member: Address,
        circle_id: u64,
    ) {
        member.require_auth();

        let mut circle = Self::get_circle_or_panic(&env, circle_id);

        if circle.status != CircleStatus::Active {
            panic!("circle is not active");
        }
        if env.ledger().timestamp() > circle.cycle_deadline {
            panic!("this cycle's deadline has passed — call close_cycle first");
        }

        // Verify member is in the circle
        let mut state = circle.member_states.get(member.clone())
            .unwrap_or_else(|| panic!("you are not a member of this circle"));

        // Check not already paid this cycle
        let cycle_idx = (circle.current_cycle - 1) as usize;
        if (circle.cycles.len() as usize) > cycle_idx {
            let record = circle.cycles.get(cycle_idx as u32)
                .unwrap_or_else(|| panic!("cycle record not found"));
            let already_paid = record.contributions.get(member.clone())
                .unwrap_or(false);
            if already_paid {
                panic!("you have already contributed this cycle");
            }
        }

        // Transfer contribution from member to this contract
        let token_client = token::Client::new(&env, &circle.xlm_token);
        token_client.transfer(
            &member,
            &env.current_contract_address(),
            &circle.contribution_amount,
        );

        // Record contribution in state
        state.total_contributed += circle.contribution_amount;
        circle.member_states.set(member.clone(), state);

        // Update or create cycle record
        let cycle_record = if (circle.cycles.len() as usize) > cycle_idx {
            let mut record = circle.cycles.get(cycle_idx as u32).unwrap();
            record.contributions.set(member.clone(), true);
            record
        } else {
            let mut contributions: Map<Address, bool> = Map::new(&env);
            contributions.set(member.clone(), true);
            CycleRecord {
                cycle_number: circle.current_cycle,
                recipient: circle.payout_order.get((circle.current_cycle - 1) as u32)
                    .unwrap_or_else(|| panic!("payout order out of bounds")),
                contributions,
                amount_paid_out: 0,
                closed: false,
                closed_at: 0,
            }
        };

        // Rebuild cycles vec (Soroban Vec requires rebuild to mutate at index)
        let mut new_cycles: Vec<CycleRecord> = Vec::new(&env);
        for (i, r) in circle.cycles.iter().enumerate() {
            if i == cycle_idx {
                new_cycles.push_back(cycle_record.clone());
            } else {
                new_cycles.push_back(r);
            }
        }
        if (circle.cycles.len() as usize) <= cycle_idx {
            new_cycles.push_back(cycle_record);
        }
        circle.cycles = new_cycles;

        env.storage().persistent().set(&DataKey::Circle(circle_id), &circle);

        env.events().publish(
            (symbol_short!("contrib"), circle_id),
            (member, circle.current_cycle),
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // close_cycle
    // Permissionless keeper: any address may call after the deadline.
    // Transfers collected pot to recipient, records missed payments as debt,
    // and advances to the next cycle (or completes the circle).
    // The contract enforces deadline — the frontend is never trusted.
    // ════════════════════════════════════════════════════════════════════════
    pub fn close_cycle(env: Env, caller: Address, circle_id: u64) {
        // Permissionless: any caller can trigger this after the deadline.
        // We still require auth to prevent anonymous abuse of gas,
        // but any valid account qualifies.
        caller.require_auth();

        let mut circle = Self::get_circle_or_panic(&env, circle_id);

        if circle.status != CircleStatus::Active {
            panic!("circle is not active");
        }
        if env.ledger().timestamp() < circle.cycle_deadline {
            panic!("cycle deadline has not passed yet");
        }

        let cycle_idx = (circle.current_cycle - 1) as u32;
        let recipient = circle.payout_order.get(cycle_idx)
            .unwrap_or_else(|| panic!("payout order out of bounds"));

        // Calculate paid count and record missed payments as debt
        let mut paid_count: i128 = 0;
        let mut missing_members: Vec<Address> = Vec::new(&env);

        if let Some(record) = circle.cycles.get(cycle_idx) {
            for addr in circle.payout_order.iter() {
                let paid = record.contributions.get(addr.clone()).unwrap_or(false);
                if paid {
                    paid_count += 1;
                } else {
                    missing_members.push_back(addr.clone());
                    let mut ms = circle.member_states.get(addr.clone()).unwrap();
                    ms.missed_cycles += 1;
                    ms.debt += circle.contribution_amount;
                    circle.member_states.set(addr.clone(), ms);
                }
            }
        } else {
            // No one contributed — all members missed
            for addr in circle.payout_order.iter() {
                missing_members.push_back(addr.clone());
                let mut ms = circle.member_states.get(addr.clone()).unwrap();
                ms.missed_cycles += 1;
                ms.debt += circle.contribution_amount;
                circle.member_states.set(addr.clone(), ms);
            }
        }

        let amount_paid_out = paid_count * circle.contribution_amount;

        // Transfer pot to recipient (only what was actually contributed)
        if amount_paid_out > 0 {
            let token_client = token::Client::new(&env, &circle.xlm_token);
            token_client.transfer(
                &env.current_contract_address(),
                &recipient,
                &amount_paid_out,
            );
        }

        // Mark recipient as paid
        let mut rs = circle.member_states.get(recipient.clone()).unwrap();
        rs.has_received_payout = true;
        circle.member_states.set(recipient.clone(), rs);

        // Update cycle record
        let mut new_cycles: Vec<CycleRecord> = Vec::new(&env);
        let mut updated = false;
        for (i, mut record) in circle.cycles.iter().enumerate() {
            if i == cycle_idx as usize {
                record.closed = true;
                record.closed_at = env.ledger().timestamp();
                record.amount_paid_out = amount_paid_out;
                new_cycles.push_back(record);
                updated = true;
            } else {
                new_cycles.push_back(record);
            }
        }
        // If no record existed (no contributions), create a closed empty one
        if !updated {
            let contributions: Map<Address, bool> = Map::new(&env);
            new_cycles.push_back(CycleRecord {
                cycle_number: circle.current_cycle,
                recipient: recipient.clone(),
                contributions,
                amount_paid_out: 0,
                closed: true,
                closed_at: env.ledger().timestamp(),
            });
        }
        circle.cycles = new_cycles;

        // Advance or complete
        let completed_cycle = circle.current_cycle;
        if circle.current_cycle >= circle.member_count {
            circle.status = CircleStatus::Completed;
        } else {
            circle.current_cycle += 1;
            circle.cycle_deadline = Self::calculate_deadline(&env, circle.cycle_length_days);
        }

        env.storage().persistent().set(&DataKey::Circle(circle_id), &circle);

        env.events().publish(
            (symbol_short!("closed"), circle_id),
            (completed_cycle, recipient, amount_paid_out),
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // withdraw_deposit
    // Member withdraws their held deposit after circle completion.
    // Blocked if member has outstanding debt.
    // ════════════════════════════════════════════════════════════════════════
    pub fn withdraw_deposit(env: Env, member: Address, circle_id: u64) {
        member.require_auth();

        let mut circle = Self::get_circle_or_panic(&env, circle_id);

        if circle.status != CircleStatus::Completed {
            panic!("circle has not completed yet");
        }

        let mut state = circle.member_states.get(member.clone())
            .unwrap_or_else(|| panic!("not a member of this circle"));

        if state.debt > 0 {
            panic!("you have outstanding debt — deposit is withheld until resolved");
        }

        if state.deposit_withdrawn {
            panic!("deposit already withdrawn");
        }

        // Transfer deposit back from contract to member
        let token_client = token::Client::new(&env, &circle.xlm_token);
        token_client.transfer(
            &env.current_contract_address(),
            &member,
            &state.deposit_amount,
        );

        state.deposit_withdrawn = true;
        circle.member_states.set(member.clone(), state.clone());
        env.storage().persistent().set(&DataKey::Circle(circle_id), &circle);

        env.events().publish(
            (symbol_short!("deposit"), circle_id),
            (member, state.deposit_amount),
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // get_status / get_circle
    // Read circle state for the dashboard.
    // ════════════════════════════════════════════════════════════════════════
    pub fn get_status(env: Env, circle_id: u64) -> CircleState {
        Self::get_circle_or_panic(&env, circle_id)
    }

    pub fn get_circle(env: Env, circle_id: u64) -> CircleState {
        Self::get_circle_or_panic(&env, circle_id)
    }

    pub fn get_member_circles(env: Env, member: Address) -> Vec<u64> {
        env.storage().persistent()
            .get(&DataKey::MemberCircles(member))
            .unwrap_or_else(|| Vec::new(&env))
    }

    // ════════════════════════════════════════════════════════════════════════
    // Internal helpers
    // ════════════════════════════════════════════════════════════════════════

    fn get_circle_or_panic(env: &Env, circle_id: u64) -> CircleState {
        env.storage().persistent().get(&DataKey::Circle(circle_id))
            .unwrap_or_else(|| panic!("circle not found"))
    }

    fn next_circle_id(env: &Env) -> u64 {
        let id: u64 = env.storage().instance().get(&DataKey::NextCircleId).unwrap_or(1u64);
        env.storage().instance().set(&DataKey::NextCircleId, &(id + 1));
        id
    }

    fn add_member_circle(env: &Env, member: &Address, circle_id: u64) {
        let key = DataKey::MemberCircles(member.clone());
        let mut circles: Vec<u64> = env.storage().persistent()
            .get(&key).unwrap_or_else(|| Vec::new(env));
        // Don't double-add
        for c in circles.iter() {
            if c == circle_id {
                return;
            }
        }
        circles.push_back(circle_id);
        env.storage().persistent().set(&key, &circles);
    }

    fn calculate_deadline(env: &Env, cycle_length_days: u32) -> u64 {
        let now = env.ledger().timestamp();
        if cycle_length_days <= 3600 {
            now + cycle_length_days as u64
        } else {
            now + (cycle_length_days as u64 * 86400)
        }
    }
}
