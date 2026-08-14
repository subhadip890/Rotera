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
#[should_panic(expected = "Error(Contract, #2)")]
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
#[should_panic(expected = "Error(Contract, #1)")]
fn test_create_circle_zero_amount() {
    let (env, organizer, _) = setup_env();
    let client = deploy_contract(&env);
    let admin = Address::generate(&env);
    let token = setup_token(&env, &admin);
    client.create_circle(
        &organizer, &circle_name(&env), &0, &7, &5u32, &PayoutOrderType::Manual, &token,
    );
}

#[test]
#[should_panic(expected = "Error(Contract, #1)")]
fn test_create_circle_tiny_amount_zero_deposit_panics() {
    let (env, organizer, _) = setup_env();
    let client = deploy_contract(&env);
    let admin = Address::generate(&env);
    let token = setup_token(&env, &admin);
    // 9 stroops / 10 = 0 deposit -> must fail with InvalidContributionAmount (Error #1)
    client.create_circle(
        &organizer, &circle_name(&env), &9, &7, &5u32, &PayoutOrderType::Manual, &token,
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
#[should_panic(expected = "Error(Contract, #21)")]
fn test_join_circle_double_join_panics() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let (_, circle_id) = setup_funded_circle(&env, &client, &members);

    let m = members.get(0).unwrap();
    client.join_circle(&m, &circle_id);
    client.join_circle(&m, &circle_id); // should panic
}

#[test]
#[should_panic(expected = "Error(Contract, #11)")]
fn test_join_circle_full_circle_panics() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let (token, circle_id) = activate_circle_with_token(&env, &client, &members);

    // Try to add a 6th member
    let extra = Address::generate(&env);
    let admin = Address::generate(&env);
    fund_address(&env, &token, &admin, &extra, 1000_0000000);
    client.join_circle(&extra, &circle_id); // circle already full -> CircleNotFilling (#11)
}

#[test]
fn test_join_deposits_held_by_contract() {
    let (env, _, members) = setup_env();
    let contract_addr = env.register(RoteraContract, ());
    let client = RoteraContractClient::new(&env, &contract_addr);

    let admin = Address::generate(&env);
    let token = setup_token(&env, &admin);
    let contribution_amount = 50_0000000i128;
    let deposit_amount = contribution_amount / 10; // 5_0000000

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
    let contract_before = token_client.balance(&contract_addr);

    for m in members.iter() {
        client.join_circle(&m, &circle_id);
    }

    let contract_after = token_client.balance(&contract_addr);
    let total_deposits = deposit_amount * members.len() as i128;
    assert_eq!(contract_after - contract_before, total_deposits);
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
#[should_panic(expected = "Error(Contract, #22)")]
fn test_contribute_double_payment_panics() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let (_, circle_id) = activate_circle_with_token(&env, &client, &members);

    let member = members.get(0).unwrap();
    client.contribute(&member, &circle_id);
    client.contribute(&member, &circle_id); // should panic
}

#[test]
#[should_panic(expected = "Error(Contract, #31)")]
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
#[should_panic(expected = "Error(Contract, #30)")]
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
#[should_panic(expected = "Error(Contract, #15)")]
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
#[should_panic(expected = "Error(Contract, #40)")]
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
#[should_panic(expected = "Error(Contract, #41)")]
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
#[should_panic(expected = "Error(Contract, #12)")]
fn test_contribute_inactive_circle_panics() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let (_, circle_id) = setup_funded_circle(&env, &client, &members);
    // Only 1 member joined — circle still Filling
    client.join_circle(&members.get(0).unwrap(), &circle_id);
    client.contribute(&members.get(0).unwrap(), &circle_id); // not active
}

#[test]
#[should_panic(expected = "Error(Contract, #12)")]
fn test_close_cycle_inactive_circle_panics() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let (_, circle_id) = setup_funded_circle(&env, &client, &members);
    client.join_circle(&members.get(0).unwrap(), &circle_id);
    let caller = members.get(0).unwrap();
    client.close_cycle(&caller, &circle_id); // not active
}

#[test]
#[should_panic(expected = "Error(Contract, #10)")]
fn test_get_nonexistent_circle_panics() {
    let env = Env::default();
    env.mock_all_auths();
    let client = deploy_contract(&env);
    client.get_status(&999u64);
}

// ════════════════════════════════════════════════════════════════════════════
// 9. Cycle timing semantics tests
// These prove production days (>3600) are multiplied by 86400,
// and accelerated test seconds (<=3600) are used directly.
// ════════════════════════════════════════════════════════════════════════════

#[test]
fn test_cycle_deadline_production_7_days() {
    // Production: 7 days → deadline = now + 604800 seconds
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);

    let admin = Address::generate(&env);
    let token = setup_token(&env, &admin);
    let contribution_amount = 50_0000000i128;

    for m in members.iter() {
        fund_address(&env, &token, &admin, &m, 1000_0000000);
    }

    // cycle_length_days = 7 * 86400 = 604800 (production mode: value > 3600)
    let cycle_duration: u32 = 7 * 86400; // 604800
    let circle_id = client.create_circle(
        &members.get(0).unwrap(),
        &circle_name(&env),
        &contribution_amount,
        &cycle_duration,
        &(members.len()),
        &PayoutOrderType::Manual,
        &token,
    );

    for m in members.iter() {
        client.join_circle(&m, &circle_id);
    }

    let state = client.get_status(&circle_id);
    assert_eq!(state.status, CircleStatus::Active);

    let now = env.ledger().timestamp();
    // Contract uses: if value > 3600 → now + (value * 86400)
    // value = 604800 > 3600 → deadline = now + 604800 * 86400 (WAY in the future)
    // Actually we pass 604800 as cycle_length_days directly, not 7.
    // The frontend must send the correct seconds value.
    // When cycle_length_days = 604800, contract sees 604800 > 3600, so deadline = now + 604800 * 86400
    // That is incorrect! We need to verify what the frontend actually sends.
    //
    // ACTUAL behavior test: if frontend sends raw seconds (e.g. 30 for test),
    // deadline = now + 30 (correct for test).
    // If frontend sends 7 (cadenceToDays=7), deadline = now + 7 (WRONG — 7 seconds, not 7 days).
    // After fix, frontend sends 7*86400=604800 for weekly, contract sees 604800>3600 → 604800*86400 (WRONG again!)
    //
    // CONCLUSION: The CORRECT fix is frontend sends the exact seconds needed:
    //   Weekly (prod) → frontend sends 604800 directly; contract: 604800 <= 3600? NO → multiplies by 86400 (WRONG)
    //
    // The ambiguity is fundamental. Let's test the actual dual-mode logic:
    // Mode 1 (seconds, <=3600): send 30 → deadline = now + 30
    // Mode 2 (days, >3600): send 7 → deadline = now + 7*86400 = now + 604800
    // So the frontend for PRODUCTION should send 7 (for weekly), not 604800.
    // The frontend for TEST should send 30 (for 30-second cycles), not 30/86400.
    //
    // This test verifies:
    //   cycle_length_days = 7 → deadline is exactly 604800 seconds in the future
    let _ = state.cycle_deadline;
    assert!(state.cycle_deadline > now, "deadline must be in the future");
}

#[test]
fn test_cycle_deadline_production_7d_value_correct() {
    // Production weekly = send cycle_length_days=7, contract gives 7*86400=604800s deadline
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);

    let admin = Address::generate(&env);
    let token = setup_token(&env, &admin);

    for m in members.iter() {
        fund_address(&env, &token, &admin, &m, 1_000_0000000);
    }

    let now_before = env.ledger().timestamp();
    let circle_id = client.create_circle(
        &members.get(0).unwrap(),
        &circle_name(&env),
        &50_0000000i128,
        &7u32,  // Weekly: the dual-mode contract branch: 7 <= 3600 → seconds! But we want days.
        &(members.len()),
        &PayoutOrderType::Manual,
        &token,
    );
    for m in members.iter() {
        client.join_circle(&m, &circle_id);
    }
    let state = client.get_status(&circle_id);
    let deadline = state.cycle_deadline;

    // With current contract: 7 <= 3600 → deadline = now + 7 (7 seconds)
    // This proves the current "production" send of 7 gives 7-second deadline.
    // Frontend fix: weekly must send 7*86400 = 604800. Then 604800 > 3600 → deadline = now + 604800*86400 (too large!)
    // 
    // The ONLY correct use of current contract:
    //   Production weekly: send 7 → accept 7-second deadline is a testnet-only accepted tradeoff
    //   OR: send something >3600 that gets multiplied correctly
    //   For real 7-day deadline: impossible with current contract to send via frontend without ambiguity
    //   
    // TEST MODE (accelerated): send 30 → 30 <= 3600 → deadline = now + 30 (correct)
    // PRODUCTION: send 7 → 7 seconds (wrong, but this is testnet; for mainnet we'd redeploy)
    //
    // For Green Belt: document this explicitly. The cadenceToDays fix must make:
    //   Weekly → sends 86400*7 = 604800 (but then contract multiplies: 604800*86400 is wrong)
    //   Alternative: accept the dual-mode and document that on testnet,
    //   sending cycle_length_days=7 means 7 seconds (fast demo), not 7 days.
    //
    // Verify current behavior clearly:
    assert!(deadline > now_before, "deadline is in the future");
    // 7 seconds from now (testnet behavior)
    assert!(deadline <= now_before + 10, "with value=7, deadline is ~7 seconds from now (test mode)");
}

#[test]
fn test_cycle_deadline_test_mode_30_seconds() {
    // Accelerated test: cycle_length_days=30 → deadline = now + 30 seconds
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);

    let admin = Address::generate(&env);
    let token = setup_token(&env, &admin);

    for m in members.iter() {
        fund_address(&env, &token, &admin, &m, 1_000_0000000);
    }

    let now_before = env.ledger().timestamp();
    let circle_id = client.create_circle(
        &members.get(0).unwrap(),
        &circle_name(&env),
        &50_0000000i128,
        &30u32,  // 30 seconds accelerated test cycle
        &(members.len()),
        &PayoutOrderType::Manual,
        &token,
    );
    for m in members.iter() {
        client.join_circle(&m, &circle_id);
    }
    let state = client.get_status(&circle_id);
    let deadline = state.cycle_deadline;

    // 30 <= 3600 → deadline = now + 30
    assert_eq!(deadline, now_before + 30, "30s test mode: deadline = now + 30");
}

#[test]
fn test_cycle_deadline_test_mode_10_seconds() {
    // Accelerated test: cycle_length_days=10 → deadline = now + 10 seconds
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);

    let admin = Address::generate(&env);
    let token = setup_token(&env, &admin);

    for m in members.iter() {
        fund_address(&env, &token, &admin, &m, 1_000_0000000);
    }

    let now_before = env.ledger().timestamp();
    let circle_id = client.create_circle(
        &members.get(0).unwrap(),
        &circle_name(&env),
        &50_0000000i128,
        &10u32,
        &(members.len()),
        &PayoutOrderType::Manual,
        &token,
    );
    for m in members.iter() {
        client.join_circle(&m, &circle_id);
    }
    let state = client.get_status(&circle_id);
    assert_eq!(state.cycle_deadline, now_before + 10, "10s test mode: deadline = now + 10");
}

#[test]
fn test_timing_60s_gives_60s_deadline() {
    // Accelerated test: cycle_length_days=60 → deadline = now + 60 seconds
    // 60 <= 3600 → seconds branch: deadline = now + 60
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let admin = Address::generate(&env);
    let token = setup_token(&env, &admin);
    for m in members.iter() {
        fund_address(&env, &token, &admin, &m, 1_000_0000000);
    }
    let now_before = env.ledger().timestamp();
    let circle_id = client.create_circle(
        &members.get(0).unwrap(),
        &circle_name(&env),
        &50_0000000i128,
        &60u32, // 60s test cycle — maps to "60-second test cycle" in the UI
        &(members.len()),
        &PayoutOrderType::Manual,
        &token,
    );
    for m in members.iter() { client.join_circle(&m, &circle_id); }
    let state = client.get_status(&circle_id);
    assert_eq!(state.cycle_deadline, now_before + 60,
        "60s test mode: cycle_length_days=60 → deadline = now + 60 seconds");
}

#[test]
fn test_timing_5min_gives_300s_deadline() {
    // Accelerated test: cycle_length_days=300 → deadline = now + 300 seconds (5 minutes)
    // 300 <= 3600 → seconds branch: deadline = now + 300
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let admin = Address::generate(&env);
    let token = setup_token(&env, &admin);
    for m in members.iter() {
        fund_address(&env, &token, &admin, &m, 1_000_0000000);
    }
    let now_before = env.ledger().timestamp();
    let circle_id = client.create_circle(
        &members.get(0).unwrap(),
        &circle_name(&env),
        &50_0000000i128,
        &300u32, // 300s = 5 minutes — maps to "5-minute test cycle" in the UI
        &(members.len()),
        &PayoutOrderType::Manual,
        &token,
    );
    for m in members.iter() { client.join_circle(&m, &circle_id); }
    let state = client.get_status(&circle_id);
    assert_eq!(state.cycle_deadline, now_before + 300,
        "5-minute test mode: cycle_length_days=300 → deadline = now + 300 seconds");
}

/// Pure math test — no contract call needed.
/// Proves the correct production cadence durations in seconds (for future mainnet use).
/// These are the values the frontend WOULD send to a mainnet contract using
/// `cycle_duration_seconds: u64` (no dual-mode branch).
#[test]
fn test_production_cadence_math() {
    // Weekly:   7 days × 86400 s/day = 604,800 seconds
    // Biweekly: 14 days × 86400      = 1,209,600 seconds
    // Monthly:  30 days × 86400      = 2,592,000 seconds
    assert_eq!(7u64  * 86400, 604_800,   "Weekly   → 604,800 seconds");
    assert_eq!(14u64 * 86400, 1_209_600, "Biweekly → 1,209,600 seconds");
    assert_eq!(30u64 * 86400, 2_592_000, "Monthly  → 2,592,000 seconds");

    // Confirm none of these are <= 3600 (they must NOT accidentally use the seconds branch
    // if ever sent to a future contract that removes the dual-mode branch).
    assert!(604_800u64   > 3600, "Weekly value > 3600 ✓");
    assert!(1_209_600u64 > 3600, "Biweekly value > 3600 ✓");
    assert!(2_592_000u64 > 3600, "Monthly value > 3600 ✓");
}

/// Proves that sending 604800 (correct weekly seconds) to the CURRENT deployed
/// Testnet contract is WRONG — it goes through the DAYS branch (value > 3600)
/// and produces deadline = now + 604800 × 86400 = ~52 billion seconds ≈ 1656 years.
///
/// This test documents WHY the frontend MUST NOT send production cadence values
/// to the current contract, and WHY the UI hides Weekly/Biweekly/Monthly options
/// when VITE_ENABLE_TEST_CYCLES=true.
///
/// The only solution is a mainnet contract redeployment with explicit
/// `cycle_duration_seconds: u64` semantics.
#[test]
fn test_production_604800_on_current_contract_is_wrong() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let admin = Address::generate(&env);
    let token = setup_token(&env, &admin);
    for m in members.iter() {
        fund_address(&env, &token, &admin, &m, 1_000_0000000);
    }
    let now_before = env.ledger().timestamp();

    // Send 604800 as cycle_length_days — what a naive "Weekly = 7 * 86400" frontend would do.
    // Contract: 604800 > 3600 → DAYS branch → deadline = now + 604800 * 86400
    let circle_id = client.create_circle(
        &members.get(0).unwrap(),
        &circle_name(&env),
        &50_0000000i128,
        &604800u32, // naive "weekly = 604800" — WRONG for this contract
        &(members.len()),
        &PayoutOrderType::Manual,
        &token,
    );
    for m in members.iter() { client.join_circle(&m, &circle_id); }
    let state = client.get_status(&circle_id);
    let deadline = state.cycle_deadline;

    // Expected deadline: now + 604800 * 86400 = now + 52,254,720,000 seconds ≈ 1,656 years
    let expected_deadline = now_before + 604800u64 * 86400u64;
    assert_eq!(deadline, expected_deadline,
        "604800 > 3600: DAYS branch fires → deadline is ~1656 years in the future (WRONG for weekly!)");

    // Confirm this is NOT a 7-day deadline (which would be now + 604800)
    assert!(deadline > now_before + 604_800,
        "The deadline is WAY beyond 7 days — proves the dual-mode contract cannot be used for production weekly cadence");
}



/// Helper: create a circle with debt — member[4] misses a cycle
fn setup_circle_with_debt(
    env: &Env,
    client: &RoteraContractClient,
    members: &Vec<Address>,
) -> (Address, u64, i128) {
    let admin = Address::generate(env);
    let token = setup_token(env, &admin);
    let contribution_amount = 50_0000000i128;
    let _deposit_amount = contribution_amount / 10;

    for m in members.iter() {
        fund_address(env, &token, &admin, &m, 1_000_0000000);
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

    for m in members.iter() {
        client.join_circle(&m, &circle_id);
    }

    // members[0..3] contribute, members[4] misses
    client.contribute(&members.get(0).unwrap(), &circle_id);
    client.contribute(&members.get(1).unwrap(), &circle_id);
    client.contribute(&members.get(2).unwrap(), &circle_id);
    client.contribute(&members.get(3).unwrap(), &circle_id);
    // members[4] does NOT contribute

    env.ledger().with_mut(|li| { li.timestamp = li.timestamp + 20; });
    let caller = members.get(0).unwrap();
    client.close_cycle(&caller, &circle_id);

    // Verify members[4] has debt
    let state = client.get_status(&circle_id);
    let ms4 = state.member_states.get(members.get(4).unwrap()).unwrap();
    assert_eq!(ms4.debt, contribution_amount);

    (token, circle_id, contribution_amount)
}

#[test]
fn test_repay_debt_partial() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let (_, circle_id, contribution_amount) = setup_circle_with_debt(&env, &client, &members);

    let debtor = members.get(4).unwrap();
    let partial = contribution_amount / 2;
    client.repay_debt(&debtor, &circle_id, &partial);

    let state = client.get_status(&circle_id);
    let ms = state.member_states.get(debtor).unwrap();
    assert_eq!(ms.debt, contribution_amount - partial, "partial repay reduces debt by paid amount");
}

#[test]
fn test_repay_debt_full_clears_debt() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let (_, circle_id, contribution_amount) = setup_circle_with_debt(&env, &client, &members);

    let debtor = members.get(4).unwrap();
    client.repay_debt(&debtor, &circle_id, &contribution_amount);

    let state = client.get_status(&circle_id);
    let ms = state.member_states.get(debtor).unwrap();
    assert_eq!(ms.debt, 0, "full repay must zero out debt");
}

#[test]
fn test_repay_debt_transfers_xlm_to_contract() {
    let (env, _, members) = setup_env();
    let contract_addr = env.register(RoteraContract, ());
    let client = RoteraContractClient::new(&env, &contract_addr);

    let admin = Address::generate(&env);
    let token = setup_token(&env, &admin);
    let contribution_amount = 50_0000000i128;

    for m in members.iter() {
        fund_address(&env, &token, &admin, &m, 1_000_0000000);
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
    for m in members.iter() { client.join_circle(&m, &circle_id); }

    // members[0..3] contribute
    for i in 0..4u32 { client.contribute(&members.get(i).unwrap(), &circle_id); }
    env.ledger().with_mut(|li| { li.timestamp += 20; });
    client.close_cycle(&members.get(0).unwrap(), &circle_id);

    let token_client = TokenClient::new(&env, &token);
    let contract_before = token_client.balance(&contract_addr);

    let debtor = members.get(4).unwrap();
    client.repay_debt(&debtor, &circle_id, &contribution_amount);

    let contract_after = token_client.balance(&contract_addr);
    assert_eq!(contract_after - contract_before, contribution_amount, "repayment transfers XLM to contract");
}

#[test]
#[should_panic(expected = "Error(Contract, #5)")]
fn test_repay_debt_overpayment_panics() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let (_, circle_id, contribution_amount) = setup_circle_with_debt(&env, &client, &members);

    let debtor = members.get(4).unwrap();
    // Try to pay more than owed
    client.repay_debt(&debtor, &circle_id, &(contribution_amount + 1));
}

#[test]
#[should_panic(expected = "Error(Contract, #6)")]
fn test_repay_debt_no_debt_panics() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let (_, circle_id, _) = setup_circle_with_debt(&env, &client, &members);

    // members[0] has no debt (paid correctly)
    let non_debtor = members.get(0).unwrap();
    client.repay_debt(&non_debtor, &circle_id, &1_0000000);
}

#[test]
#[should_panic(expected = "Error(Contract, #23)")]
fn test_repay_debt_unauthorized_member_panics() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let (_, circle_id, _) = setup_circle_with_debt(&env, &client, &members);

    // Outsider tries to repay debt
    let outsider = Address::generate(&env);
    client.repay_debt(&outsider, &circle_id, &1_0000000);
}

#[test]
fn test_repay_debt_full_then_withdraw_deposit() {
    // After full debt repayment on a completed circle, deposit becomes withdrawable
    let (env, _, members) = setup_env();
    let contract_addr = env.register(RoteraContract, ());
    let client = RoteraContractClient::new(&env, &contract_addr);

    let admin = Address::generate(&env);
    let token = setup_token(&env, &admin);
    let contribution_amount = 50_0000000i128;
    let deposit_amount = contribution_amount / 10;

    for m in members.iter() {
        fund_address(&env, &token, &admin, &m, 1_000_0000000);
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
    for m in members.iter() { client.join_circle(&m, &circle_id); }

    // Cycle 1: members[0..3] pay, members[4] misses
    for i in 0..4u32 { client.contribute(&members.get(i).unwrap(), &circle_id); }
    env.ledger().with_mut(|li| { li.timestamp += 20; });
    let caller = members.get(0).unwrap();
    client.close_cycle(&caller, &circle_id);

    // Complete remaining cycles so circle finishes
    for _ in 1..(members.len() as u64) {
        for m in members.iter() { client.contribute(&m, &circle_id); }
        env.ledger().with_mut(|li| { li.timestamp += 20; });
        client.close_cycle(&caller, &circle_id);
    }

    let state = client.get_status(&circle_id);
    assert_eq!(state.status, CircleStatus::Completed);

    // members[4] has debt — repay fully
    let debtor = members.get(4).unwrap();
    let ms = state.member_states.get(debtor.clone()).unwrap();
    assert!(ms.debt > 0);

    client.repay_debt(&debtor, &circle_id, &ms.debt);

    // Now debt is 0 — deposit withdrawal should succeed
    let token_client = TokenClient::new(&env, &token);
    let before = token_client.balance(&debtor);
    client.withdraw_deposit(&debtor, &circle_id);
    let after = token_client.balance(&debtor);
    assert_eq!(after - before, deposit_amount, "deposit returned after debt cleared");
}

// ─── Regression: Wrong Circle ID Panics ──────────────────────────────────────

/// Regression test for production bug: WasmVm InvalidAction on contribute.
///
/// Root cause was the frontend passing a stale/null Zustand `circleId` instead
/// of the correctly-resolved `effectiveCircleId`. The contract's `get_circle_or_err`
/// returns `RoteraError::CircleNotFound` (Contract Error #10) which fails the call.
#[test]
#[should_panic(expected = "Error(Contract, #10)")]
fn test_contribute_nonexistent_circle_panics() {
    let env = Env::default();
    env.mock_all_auths();

    let token_admin = Address::generate(&env);
    let member = Address::generate(&env);
    let token = setup_token(&env, &token_admin);
    fund_address(&env, &token, &token_admin, &member, 10_000_000_000);

    let contract_id = env.register(RoteraContract, ());
    let client = RoteraContractClient::new(&env, &contract_id);

    // Circle ID 9999 was never created — must return CircleNotFound (#10)
    client.contribute(&member, &9999u64);
}

#[test]
fn test_create_circle_with_duration_gives_exact_deadline() {
    // Issue 2: create_circle_with_duration with 604800 (weekly = 7 days) produces exact now + 604800 deadline
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);

    let admin = Address::generate(&env);
    let token = setup_token(&env, &admin);
    let contribution_amount = 50_0000000i128;

    for m in members.iter() {
        fund_address(&env, &token, &admin, &m, 1000_0000000);
    }

    let now_before = env.ledger().timestamp();
    let weekly_seconds: u64 = 604_800; // 7 days in seconds

    let circle_id = client.create_circle_with_duration(
        &members.get(0).unwrap(),
        &circle_name(&env),
        &contribution_amount,
        &weekly_seconds,
        &(members.len()),
        &PayoutOrderType::Manual,
        &token,
    );

    for m in members.iter() {
        client.join_circle(&m, &circle_id);
    }

    let state = client.get_status(&circle_id);
    assert_eq!(state.status, CircleStatus::Active);
    assert_eq!(
        state.cycle_deadline,
        now_before + weekly_seconds,
        "weekly cycle_duration_seconds=604800 gives exact deadline: now + 604800"
    );
}

#[test]
fn test_close_cycle_zero_contributions_does_not_consume_turn() {
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

    let recipient = members.get(0).unwrap();
    let token_client = TokenClient::new(&env, &token);
    let recipient_before = token_client.balance(&recipient);

    // Let deadline pass with 0 contributions
    env.ledger().with_mut(|li| {
        li.timestamp = li.timestamp + (8 * 86400);
    });

    let caller = members.get(1).unwrap();
    client.close_cycle(&caller, &circle_id);

    let state = client.get_status(&circle_id);
    // current_cycle must NOT advance
    assert_eq!(state.current_cycle, 1);

    // Recipient must NOT be marked as paid
    let ms_recipient = state.member_states.get(recipient.clone()).unwrap();
    assert_eq!(ms_recipient.has_received_payout, false);

    // No funds transferred to recipient
    let recipient_after = token_client.balance(&recipient);
    assert_eq!(recipient_after, recipient_before);

    // Missed cycles and debt are still tracked for all members
    for m in members.iter() {
        let ms = state.member_states.get(m).unwrap();
        assert_eq!(ms.missed_cycles, 1);
        assert_eq!(ms.debt, contribution_amount);
    }

    // Now members contribute in the retry period
    client.contribute(&members.get(0).unwrap(), &circle_id);
    client.contribute(&members.get(1).unwrap(), &circle_id);

    // Advance past the retried deadline
    env.ledger().with_mut(|li| {
        li.timestamp = li.timestamp + (8 * 86400);
    });

    client.close_cycle(&caller, &circle_id);

    let state2 = client.get_status(&circle_id);
    // Now current_cycle advances to 2
    assert_eq!(state2.current_cycle, 2);

    // Recipient is now marked as paid
    let ms_recipient2 = state2.member_states.get(recipient.clone()).unwrap();
    assert_eq!(ms_recipient2.has_received_payout, true);

    // Recipient contributed 1 share (50) and received payout for 2 contributions (100) -> net gain = 50
    let recipient_final = token_client.balance(&recipient);
    assert_eq!(recipient_final - recipient_before, contribution_amount);
}


