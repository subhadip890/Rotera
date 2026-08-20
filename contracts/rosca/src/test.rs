#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token::{Client as TokenClient, StellarAssetClient},
    Address, Bytes, Env, Vec,
};

// ─── Token Setup ─────────────────────────────────────────────────────────────

/// Deploy and fund a mock Stellar asset contract (native XLM stand-in)
fn setup_token(env: &Env, admin: &Address) -> Address {
    let token_id = env.register_stellar_asset_contract_v2(admin.clone());
    token_id.address()
}

fn fund_address(env: &Env, token: &Address, admin: &Address, to: &Address, amount: i128) {
    let asset_client = StellarAssetClient::new(env, token);
    asset_client.mint(to, &amount);
    let _ = admin; // used for semantic clarity
}

// ─── Test Helpers ─────────────────────────────────────────────────────────────

fn setup_env() -> (Env, Address, Vec<Address>) {
    let env = Env::default();
    env.mock_all_auths();

    let organizer = Address::generate(&env);
    let mut members: Vec<Address> = Vec::new(&env);
    members.push_back(organizer.clone());
    members.push_back(Address::generate(&env));
    members.push_back(Address::generate(&env));
    members.push_back(Address::generate(&env));
    members.push_back(Address::generate(&env));

    (env, organizer, members)
}

fn deploy_contract(env: &Env) -> RoteraContractClient<'_> {
    let contract_id = env.register(RoteraContract, ());
    RoteraContractClient::new(env, &contract_id)
}

fn circle_name(env: &Env) -> Bytes {
    Bytes::from_slice(env, b"Test Circle")
}

/// Creates a circle with 5 members, each funded with 1000 XLM equivalent.
/// Returns (contract_client, token_address, circle_id, members)
fn setup_funded_circle(
    env: &Env,
    client: &RoteraContractClient,
    members: &Vec<Address>,
) -> (Address, u64) {
    let admin = Address::generate(env);
    let token = setup_token(env, &admin);
    let contribution_amount = 50_0000000i128; // 50 XLM (7 decimals)
    let deposit_amount = contribution_amount / 10; // 5 XLM

    // Fund each member with enough for deposit + 10 contributions
    let fund_amount = deposit_amount + contribution_amount * 10;
    for m in members.iter() {
        fund_address(env, &token, &admin, &m, fund_amount);
    }

    let circle_id = client.create_circle(
        &members.get(0).unwrap(),
        &circle_name(env),
        &contribution_amount,
        &7u32,
        &(members.len()),
        &PayoutOrderType::Manual,
        &token,
    );

    (token, circle_id)
}

/// Activates a circle by having all members join (paying deposit).
fn activate_circle_with_token(
    env: &Env,
    client: &RoteraContractClient,
    members: &Vec<Address>,
) -> (Address, u64) {
    let (token, circle_id) = setup_funded_circle(env, client, members);
    for m in members.iter() {
        client.join_circle(&m, &circle_id);
    }
    (token, circle_id)
}

// ════════════════════════════════════════════════════════════════════════════
// 1. create_circle tests
// ════════════════════════════════════════════════════════════════════════════

#[test]
fn test_create_circle_success() {
    let (env, organizer, _members) = setup_env();
    let client = deploy_contract(&env);
    let admin = Address::generate(&env);
    let token = setup_token(&env, &admin);

    let circle_id = client.create_circle(
        &organizer,
        &circle_name(&env),
        &100_0000000i128,
        &7u32,
        &5u32,
        &PayoutOrderType::Manual,
        &token,
    );

    assert_eq!(circle_id, 1u64);
    let state = client.get_status(&circle_id);
    assert_eq!(state.status, CircleStatus::Filling);
    assert_eq!(state.member_count, 5);
    assert_eq!(state.contribution_amount, 100_0000000);
    assert_eq!(state.cycle_length_days, 7);
    assert_eq!(state.payout_order.len(), 0); // no members yet
}

#[test]
#[should_panic(expected = "member_count must be between 3 and 12")]
fn test_create_circle_too_few_members() {
    let (env, organizer, _) = setup_env();
    let client = deploy_contract(&env);
    let admin = Address::generate(&env);
    let token = setup_token(&env, &admin);
    client.create_circle(
        &organizer, &circle_name(&env), &100_0000000, &7, &2u32, &PayoutOrderType::Manual, &token,
    );
}

#[test]
#[should_panic(expected = "contribution_amount must be positive")]
fn test_create_circle_zero_amount() {
    let (env, organizer, _) = setup_env();
    let client = deploy_contract(&env);
    let admin = Address::generate(&env);
    let token = setup_token(&env, &admin);
    client.create_circle(
        &organizer, &circle_name(&env), &0, &7, &5u32, &PayoutOrderType::Manual, &token,
    );
}

// ════════════════════════════════════════════════════════════════════════════
// 2. join_circle tests
// ════════════════════════════════════════════════════════════════════════════

#[test]
fn test_join_circle_all_members_activates() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let (_, circle_id) = activate_circle_with_token(&env, &client, &members);

    let state = client.get_status(&circle_id);
    assert_eq!(state.status, CircleStatus::Active);
    assert_eq!(state.current_cycle, 1);
    assert_eq!(state.payout_order.len(), members.len());
}

#[test]
fn test_join_circle_partial_stays_filling() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let (_, circle_id) = setup_funded_circle(&env, &client, &members);

    // Only 2 of 5 join
    client.join_circle(&members.get(0).unwrap(), &circle_id);
    client.join_circle(&members.get(1).unwrap(), &circle_id);

    let state = client.get_status(&circle_id);
    assert_eq!(state.status, CircleStatus::Filling);
    assert_eq!(state.payout_order.len(), 2);
}

#[test]
#[should_panic(expected = "you have already joined this circle")]
fn test_join_circle_double_join_panics() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let (_, circle_id) = setup_funded_circle(&env, &client, &members);

    let m = members.get(0).unwrap();
    client.join_circle(&m, &circle_id);
    client.join_circle(&m, &circle_id); // should panic
}

#[test]
#[should_panic(expected = "circle is not accepting new members")]
fn test_join_circle_full_circle_panics() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let (token, circle_id) = activate_circle_with_token(&env, &client, &members);

    // Try to add a 6th member
    let extra = Address::generate(&env);
    let admin = Address::generate(&env);
    fund_address(&env, &token, &admin, &extra, 100_0000000);
    client.join_circle(&extra, &circle_id); // should panic: circle not in Filling status
}

#[test]
fn test_join_deposits_held_by_contract() {
    let (env, _, members) = setup_env();
    let _client = deploy_contract(&env);
    let contract_addr = env.register(RoteraContract, ());
    let client = RoteraContractClient::new(&env, &contract_addr);

    let admin = Address::generate(&env);
    let token = setup_token(&env, &admin);
    let contribution_amount = 50_0000000i128;
    let deposit_amount = contribution_amount / 10;

    for m in members.iter() {
        fund_address(&env, &token, &admin, &m, 1000_0000000);
    }

    let circle_id = client.create_circle(
        &members.get(0).unwrap(),
        &circle_name(&env),
        &contribution_amount,
        &7u32,
        &(members.len()),
        &PayoutOrderType::Manual,
        &token,
    );

    let token_client = TokenClient::new(&env, &token);
    let before = token_client.balance(&contract_addr);

    client.join_circle(&members.get(0).unwrap(), &circle_id);
    let after = token_client.balance(&contract_addr);

    assert_eq!(after - before, deposit_amount);
}

// ════════════════════════════════════════════════════════════════════════════
// 3. contribute tests
// ════════════════════════════════════════════════════════════════════════════

#[test]
fn test_contribute_records_payment() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let (_, circle_id) = activate_circle_with_token(&env, &client, &members);

    let member = members.get(0).unwrap();
    client.contribute(&member, &circle_id);

    let state = client.get_status(&circle_id);
    let ms = state.member_states.get(member).unwrap();
    assert_eq!(ms.total_contributed, 50_0000000);
}

#[test]
#[should_panic(expected = "you have already contributed this cycle")]
fn test_contribute_double_payment_panics() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let (_, circle_id) = activate_circle_with_token(&env, &client, &members);

    let member = members.get(0).unwrap();
    client.contribute(&member, &circle_id);
    client.contribute(&member, &circle_id); // should panic
}

#[test]
#[should_panic(expected = "this cycle's deadline has passed")]
fn test_contribute_after_deadline_panics() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let (_, circle_id) = activate_circle_with_token(&env, &client, &members);

    // Advance time past deadline
    env.ledger().with_mut(|li| {
        li.timestamp = li.timestamp + (8 * 86400);
    });

    client.contribute(&members.get(0).unwrap(), &circle_id);
}

#[test]
fn test_contribute_transfers_xlm_to_contract() {
    let (env, _, members) = setup_env();
    let contract_addr = env.register(RoteraContract, ());
    let client = RoteraContractClient::new(&env, &contract_addr);

    let admin = Address::generate(&env);
    let token = setup_token(&env, &admin);
    let contribution_amount = 50_0000000i128;
    let deposit_amount = contribution_amount / 10;

    for m in members.iter() {
        fund_address(&env, &token, &admin, &m, 1000_0000000);
    }

    let circle_id = client.create_circle(
        &members.get(0).unwrap(),
        &circle_name(&env),
        &contribution_amount,
        &7u32,
        &(members.len()),
        &PayoutOrderType::Manual,
        &token,
    );

    for m in members.iter() {
        client.join_circle(&m, &circle_id);
    }

    let token_client = TokenClient::new(&env, &token);
    // Contract holds 5 deposits
    let after_join = token_client.balance(&contract_addr);
    assert_eq!(after_join, deposit_amount * members.len() as i128);

    // One member contributes
    let member = members.get(0).unwrap();
    client.contribute(&member, &circle_id);
    let after_contrib = token_client.balance(&contract_addr);
    assert_eq!(after_contrib, after_join + contribution_amount);
}

// ════════════════════════════════════════════════════════════════════════════
// 4. close_cycle tests
// ════════════════════════════════════════════════════════════════════════════

#[test]
fn test_close_cycle_all_paid_advances_cycle() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let (_, circle_id) = activate_circle_with_token(&env, &client, &members);

    for m in members.iter() {
        client.contribute(&m, &circle_id);
    }

    env.ledger().with_mut(|li| {
        li.timestamp = li.timestamp + (8 * 86400);
    });

    let caller = members.get(0).unwrap();
    client.close_cycle(&caller, &circle_id);

    let state = client.get_status(&circle_id);
    assert_eq!(state.current_cycle, 2);
}

#[test]
fn test_close_cycle_payout_transfers_xlm() {
    let (env, _, members) = setup_env();
    let contract_addr = env.register(RoteraContract, ());
    let client = RoteraContractClient::new(&env, &contract_addr);

    let admin = Address::generate(&env);
    let token = setup_token(&env, &admin);
    let contribution_amount = 50_0000000i128;

    for m in members.iter() {
        fund_address(&env, &token, &admin, &m, 1000_0000000);
    }

    let circle_id = client.create_circle(
        &members.get(0).unwrap(),
        &circle_name(&env),
        &contribution_amount,
        &7u32,
        &(members.len()),
        &PayoutOrderType::Manual,
        &token,
    );

    for m in members.iter() {
        client.join_circle(&m, &circle_id);
    }
    for m in members.iter() {
        client.contribute(&m, &circle_id);
    }

    let token_client = TokenClient::new(&env, &token);
    let recipient = members.get(0).unwrap(); // first in payout order
    let recipient_before = token_client.balance(&recipient);

    env.ledger().with_mut(|li| {
        li.timestamp = li.timestamp + (8 * 86400);
    });

    let caller = members.get(1).unwrap();
    client.close_cycle(&caller, &circle_id);

    let recipient_after = token_client.balance(&recipient);
    let expected_payout = contribution_amount * members.len() as i128;
    assert_eq!(recipient_after - recipient_before, expected_payout);
}

#[test]
fn test_close_cycle_missed_payments_tracked() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let (_, circle_id) = activate_circle_with_token(&env, &client, &members);

    // Only 3 of 5 contribute; members[3] and members[4] miss
    client.contribute(&members.get(0).unwrap(), &circle_id);
    client.contribute(&members.get(1).unwrap(), &circle_id);
    client.contribute(&members.get(2).unwrap(), &circle_id);

    env.ledger().with_mut(|li| {
        li.timestamp = li.timestamp + (8 * 86400);
    });

    let caller = members.get(0).unwrap();
    client.close_cycle(&caller, &circle_id);

    let state = client.get_status(&circle_id);
    let ms3 = state.member_states.get(members.get(3).unwrap()).unwrap();
    let ms4 = state.member_states.get(members.get(4).unwrap()).unwrap();

    assert_eq!(ms3.missed_cycles, 1);
    assert_eq!(ms3.debt, 50_0000000);
    assert_eq!(ms4.missed_cycles, 1);
    assert_eq!(ms4.debt, 50_0000000);
}

#[test]
#[should_panic(expected = "cycle deadline has not passed yet")]
fn test_close_cycle_before_deadline_panics() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let (_, circle_id) = activate_circle_with_token(&env, &client, &members);
    let caller = members.get(0).unwrap();
    client.close_cycle(&caller, &circle_id); // deadline not passed
}

// ════════════════════════════════════════════════════════════════════════════
// 5. Full rotation test
// ════════════════════════════════════════════════════════════════════════════

#[test]
fn test_full_rotation_completes() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let (_, circle_id) = activate_circle_with_token(&env, &client, &members);

    let total_cycles = members.len() as u64;
    for _ in 0..total_cycles {
        for m in members.iter() {
            client.contribute(&m, &circle_id);
        }
        env.ledger().with_mut(|li| {
            li.timestamp = li.timestamp + (8 * 86400);
        });
        let caller = members.get(0).unwrap();
        client.close_cycle(&caller, &circle_id);
    }

    let state = client.get_status(&circle_id);
    assert_eq!(state.status, CircleStatus::Completed);
    assert_eq!(state.cycles.len(), total_cycles as u32);
}

// ════════════════════════════════════════════════════════════════════════════
// 6. Deposit withdrawal tests
// ════════════════════════════════════════════════════════════════════════════

#[test]
fn test_withdraw_deposit_after_completion() {
    let (env, _, members) = setup_env();
    let contract_addr = env.register(RoteraContract, ());
    let client = RoteraContractClient::new(&env, &contract_addr);

    let admin = Address::generate(&env);
    let token = setup_token(&env, &admin);
    let contribution_amount = 50_0000000i128;
    let deposit_amount = contribution_amount / 10;

    for m in members.iter() {
        fund_address(&env, &token, &admin, &m, 1000_0000000);
    }

    let circle_id = client.create_circle(
        &members.get(0).unwrap(),
        &circle_name(&env),
        &contribution_amount,
        &7u32,
        &(members.len()),
        &PayoutOrderType::Manual,
        &token,
    );

    for m in members.iter() {
        client.join_circle(&m, &circle_id);
    }

    let total_cycles = members.len() as u64;
    for _ in 0..total_cycles {
        for m in members.iter() { client.contribute(&m, &circle_id); }
        env.ledger().with_mut(|li| { li.timestamp = li.timestamp + (8 * 86400); });
        let caller = members.get(0).unwrap();
        client.close_cycle(&caller, &circle_id);
    }

    let token_client = TokenClient::new(&env, &token);
    let member = members.get(0).unwrap();
    let before = token_client.balance(&member);

    // Should succeed — no debt
    client.withdraw_deposit(&member, &circle_id);

    let after = token_client.balance(&member);
    assert_eq!(after - before, deposit_amount);
}

#[test]
#[should_panic(expected = "circle has not completed yet")]
fn test_withdraw_deposit_before_completion_panics() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let (_, circle_id) = activate_circle_with_token(&env, &client, &members);
    client.withdraw_deposit(&members.get(0).unwrap(), &circle_id);
}

#[test]
fn test_deposit_locked_while_debt_exists() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let (_, circle_id) = activate_circle_with_token(&env, &client, &members);

    // member[4] misses cycle 1
    client.contribute(&members.get(0).unwrap(), &circle_id);
    client.contribute(&members.get(1).unwrap(), &circle_id);
    client.contribute(&members.get(2).unwrap(), &circle_id);
    client.contribute(&members.get(3).unwrap(), &circle_id);
    // member[4] does NOT contribute

    env.ledger().with_mut(|li| { li.timestamp = li.timestamp + (8 * 86400); });
    let caller = members.get(0).unwrap();
    client.close_cycle(&caller, &circle_id);

    // Complete remaining cycles so circle finishes
    for _ in 1..(members.len() as u64) {
        for m in members.iter() { client.contribute(&m, &circle_id); }
        env.ledger().with_mut(|li| { li.timestamp = li.timestamp + (8 * 86400); });
        client.close_cycle(&caller, &circle_id);
    }

    let state = client.get_status(&circle_id);
    assert_eq!(state.status, CircleStatus::Completed);

    // member[4] has debt — withdraw should fail
    let debtor = members.get(4).unwrap();
    let ms = state.member_states.get(debtor.clone()).unwrap();
    assert!(ms.debt > 0, "expected debt > 0 for missed payment");
}

#[test]
#[should_panic(expected = "you have outstanding debt")]
fn test_withdraw_deposit_with_debt_panics() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let (_, circle_id) = activate_circle_with_token(&env, &client, &members);

    // member[4] misses cycle 1
    client.contribute(&members.get(0).unwrap(), &circle_id);
    client.contribute(&members.get(1).unwrap(), &circle_id);
    client.contribute(&members.get(2).unwrap(), &circle_id);
    client.contribute(&members.get(3).unwrap(), &circle_id);

    env.ledger().with_mut(|li| { li.timestamp = li.timestamp + (8 * 86400); });
    let caller = members.get(0).unwrap();
    client.close_cycle(&caller, &circle_id);

    // Complete remaining cycles
    for _ in 1..(members.len() as u64) {
        for m in members.iter() { client.contribute(&m, &circle_id); }
        env.ledger().with_mut(|li| { li.timestamp = li.timestamp + (8 * 86400); });
        client.close_cycle(&caller, &circle_id);
    }

    // member[4] has debt — this should panic
    client.withdraw_deposit(&members.get(4).unwrap(), &circle_id);
}

#[test]
#[should_panic(expected = "deposit already withdrawn")]
fn test_withdraw_deposit_double_withdraw_panics() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let (_, circle_id) = activate_circle_with_token(&env, &client, &members);

    let total_cycles = members.len() as u64;
    for _ in 0..total_cycles {
        for m in members.iter() { client.contribute(&m, &circle_id); }
        env.ledger().with_mut(|li| { li.timestamp = li.timestamp + (8 * 86400); });
        let caller = members.get(0).unwrap();
        client.close_cycle(&caller, &circle_id);
    }

    let member = members.get(0).unwrap();
    client.withdraw_deposit(&member, &circle_id); // first: OK
    client.withdraw_deposit(&member, &circle_id); // second: panic
}

// ════════════════════════════════════════════════════════════════════════════
// 7. Payout order: Random ordering behavior
// ════════════════════════════════════════════════════════════════════════════

#[test]
fn test_random_ordering_assigned_at_activation() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);

    let admin = Address::generate(&env);
    let token = setup_token(&env, &admin);
    let contribution_amount = 50_0000000i128;

    for m in members.iter() {
        fund_address(&env, &token, &admin, &m, 1000_0000000);
    }

    let circle_id = client.create_circle(
        &members.get(0).unwrap(),
        &circle_name(&env),
        &contribution_amount,
        &7u32,
        &(members.len()),
        &PayoutOrderType::RandomPending,
        &token,
    );

    for m in members.iter() {
        client.join_circle(&m, &circle_id);
    }

    let state = client.get_status(&circle_id);
    assert_eq!(state.status, CircleStatus::Active);
    // Random order is stored; all members still present in payout_order
    assert_eq!(state.payout_order.len(), members.len());
    // Randomness seed should have our constant bytes at positions 12-15 (DEADBEEF)
    // This proves the seed was set from the activation logic
    let seed_bytes = state.randomness_seed.to_array();
    assert_eq!(seed_bytes[12], 0xDE);
    assert_eq!(seed_bytes[13], 0xAD);
    assert_eq!(seed_bytes[14], 0xBE);
    assert_eq!(seed_bytes[15], 0xEF);
}

// ════════════════════════════════════════════════════════════════════════════
// 8. Unauthorized action tests
// ════════════════════════════════════════════════════════════════════════════

#[test]
#[should_panic(expected = "circle is not active")]
fn test_contribute_inactive_circle_panics() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let (_, circle_id) = setup_funded_circle(&env, &client, &members);
    // Only 1 member joined — circle still Filling
    client.join_circle(&members.get(0).unwrap(), &circle_id);
    client.contribute(&members.get(0).unwrap(), &circle_id); // not active
}

#[test]
#[should_panic(expected = "circle is not active")]
fn test_close_cycle_inactive_circle_panics() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let (_, circle_id) = setup_funded_circle(&env, &client, &members);
    client.join_circle(&members.get(0).unwrap(), &circle_id);
    let caller = members.get(0).unwrap();
    client.close_cycle(&caller, &circle_id); // not active
}

#[test]
#[should_panic(expected = "circle not found")]
fn test_get_nonexistent_circle_panics() {
    let env = Env::default();
    env.mock_all_auths();
    let client = deploy_contract(&env);
    client.get_status(&999u64);
}
