#![no_std]

mod types;
mod errors;
#[cfg(test)]
mod test;

pub use types::*;
pub use errors::*;

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, Vec, Map, BytesN,
};

// ─── Storage Keys ───────────────────────────────────────────────────────────

#[contracttype]
pub enum DataKey {
    Circle(u64),         // circle_id -> CircleState
    NextCircleId,
    MemberCircles(Address), // address -> Vec<circle_id>
}

// ─── The Contract ───────────────────────────────────────────────────────────

#[contract]
pub struct RoteraContract;

#[contractimpl]
impl RoteraContract {

    // ════════════════════════════════════════════════════════════════════════
    // create_circle
    // Organizer sets up a new ROSCA circle.
    // ════════════════════════════════════════════════════════════════════════
    pub fn create_circle(
        env: Env,
        organizer: Address,
        name: soroban_sdk::Bytes,
        contribution_amount: i128,
        cycle_length_days: u32,
        members: Vec<Address>,
        payout_order: PayoutOrderType,
    ) -> u64 {
        organizer.require_auth();

        // Validate inputs
        if contribution_amount <= 0 {
            panic!("contribution_amount must be positive");
        }
        if members.len() < 3 || members.len() > 12 {
            panic!("member count must be between 3 and 12");
        }
        if cycle_length_days == 0 {
            panic!("cycle_length_days must be positive");
        }

        let member_count = members.len() as u32;

        // Compute deposit amount = 10% of total expected contributions
        let deposit_amount = contribution_amount / 10;

        // Calculate member payout order
        let order: Vec<Address> = match payout_order {
            PayoutOrderType::Manual => members.clone(),
            PayoutOrderType::RandomPending => {
                // Order will be finalized at activation using a future ledger hash.
                // For now, store members in manual order; randomize on activate_circle.
                members.clone()
            }
        };

        // Build per-member initial state
        let mut member_states: Map<Address, MemberState> = Map::new(&env);
        for (i, addr) in members.iter().enumerate() {
            member_states.set(addr.clone(), MemberState {
                paid_deposit: false,
                deposit_amount,
                total_contributed: 0,
                missed_cycles: 0,
                debt: 0,
                payout_position: i as u32,
                has_received_payout: false,
            });
        }

        // Build initial cycle records — all unpaid
        let cycles: Vec<CycleRecord> = Vec::new(&env);

        let circle = CircleState {
            id: 0, // set below
            name,
            organizer: organizer.clone(),
            contribution_amount,
            cycle_length_days,
            member_count,
            deposit_amount,
            status: CircleStatus::Filling,
            current_cycle: 0,
            cycle_deadline: 0,
            payout_order_type: payout_order,
            payout_order: order,
            member_states,
            cycles,
            created_at: env.ledger().timestamp(),
            activated_at: 0,
            randomness_seed: BytesN::from_array(&env, &[0u8; 32]),
        };

        // Assign and store circle ID
        let circle_id = Self::next_circle_id(&env);
        let mut circle = circle;
        circle.id = circle_id;

        env.storage().persistent().set(&DataKey::Circle(circle_id), &circle);

        // Track for organizer
        Self::add_member_circle(&env, &organizer, circle_id);

        env.events().publish(
            (symbol_short!("created"), circle_id),
            organizer,
        );

        circle_id
    }

    // ════════════════════════════════════════════════════════════════════════
    // join_circle
    // Member confirms their seat and pays the deposit.
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

        // Check member is in the circle's member list
        let mut found = false;
        for addr in circle.payout_order.iter() {
            if addr == member {
                found = true;
                break;
            }
        }
        if !found {
            panic!("you are not on this circle's invite list");
        }

        // Check not already joined
        let state = circle.member_states.get(member.clone())
            .unwrap_or_else(|| panic!("member not found"));
        if state.paid_deposit {
            panic!("you have already joined this circle");
        }

        // Mark deposit paid (actual token transfer handled by frontend via Stellar SDK)
        let mut state = state;
        state.paid_deposit = true;
        circle.member_states.set(member.clone(), state);

        // Check if all members have joined → activate
        let all_joined = circle.payout_order.iter()
            .all(|addr| {
                circle.member_states.get(addr.clone())
                    .map(|s| s.paid_deposit)
                    .unwrap_or(false)
            });

        if all_joined {
            circle.status = CircleStatus::Active;
            circle.activated_at = env.ledger().timestamp();
            circle.current_cycle = 1;
            circle.cycle_deadline = env.ledger().timestamp()
                + (circle.cycle_length_days as u64 * 86400);
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

        // Record contribution (actual token transfer handled externally)
        state.total_contributed += circle.contribution_amount;
        circle.member_states.set(member.clone(), state);

        // Update or create cycle record
        let cycle_record = if (circle.cycles.len() as usize) > cycle_idx {
            let mut record = circle.cycles.get(cycle_idx as u32).unwrap();
            record.contributions.set(member.clone(), true);
            // Overwrite via remove+push workaround (Soroban Vec is immutable at indices)
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

        // Rebuild cycles vec (Soroban Vec requires rebuild to mutate)
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
    // Permissionless keeper: anyone can call after the deadline.
    // Releases pot to recipient, tracks missed payments as debt,
    // advances to next cycle.
    // ════════════════════════════════════════════════════════════════════════
    pub fn close_cycle(env: Env, circle_id: u64) {
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

        // Calculate how much actually came in
        let mut paid_count: i128 = 0;
        let mut missing_members: Vec<Address> = Vec::new(&env);

        if let Some(record) = circle.cycles.get(cycle_idx) {
            for addr in circle.payout_order.iter() {
                let paid = record.contributions.get(addr.clone()).unwrap_or(false);
                if paid {
                    paid_count += 1;
                } else {
                    missing_members.push_back(addr.clone());

                    // Record missed payment and debt
                    let mut ms = circle.member_states.get(addr.clone()).unwrap();
                    ms.missed_cycles += 1;
                    ms.debt += circle.contribution_amount;
                    circle.member_states.set(addr.clone(), ms);
                }
            }
        }

        let amount_paid_out = paid_count * circle.contribution_amount;

        // Update cycle record to closed
        let mut new_cycles: Vec<CycleRecord> = Vec::new(&env);
        for (i, mut record) in circle.cycles.iter().enumerate() {
            if i == cycle_idx as usize {
                record.closed = true;
                record.closed_at = env.ledger().timestamp();
                record.amount_paid_out = amount_paid_out;
                new_cycles.push_back(record);
            } else {
                new_cycles.push_back(record);
            }
        }
        // If no record existed yet (no one paid), create a closed empty one
        if circle.cycles.len() <= cycle_idx {
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

        // Mark recipient as having received payout
        let mut rs = circle.member_states.get(recipient.clone()).unwrap();
        rs.has_received_payout = true;
        circle.member_states.set(recipient.clone(), rs);

        // Advance or complete
        if circle.current_cycle >= circle.member_count {
            circle.status = CircleStatus::Completed;
        } else {
            circle.current_cycle += 1;
            circle.cycle_deadline = env.ledger().timestamp()
                + (circle.cycle_length_days as u64 * 86400);
        }

        env.storage().persistent().set(&DataKey::Circle(circle_id), &circle);

        env.events().publish(
            (symbol_short!("closed"), circle_id),
            (circle.current_cycle - 1, recipient, amount_paid_out),
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // get_status
    // Read current circle state for the dashboard.
    // ════════════════════════════════════════════════════════════════════════
    pub fn get_status(env: Env, circle_id: u64) -> CircleState {
        Self::get_circle_or_panic(&env, circle_id)
    }

    // ════════════════════════════════════════════════════════════════════════
    // withdraw_deposit
    // Member withdraws their held deposit after circle completion.
    // ════════════════════════════════════════════════════════════════════════
    pub fn withdraw_deposit(env: Env, member: Address, circle_id: u64) {
        member.require_auth();

        let circle = Self::get_circle_or_panic(&env, circle_id);

        if circle.status != CircleStatus::Completed {
            panic!("circle has not completed yet");
        }

        let state = circle.member_states.get(member.clone())
            .unwrap_or_else(|| panic!("not a member of this circle"));

        if state.debt > 0 {
            panic!("you have outstanding debt — deposit is withheld until resolved");
        }

        // Actual token return handled by frontend
        env.events().publish(
            (symbol_short!("deposit"), circle_id),
            (member, state.deposit_amount),
        );
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
        circles.push_back(circle_id);
        env.storage().persistent().set(&key, &circles);
    }
}
