#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Bytes, Env, Vec,
};

/// Helper: create a test env with a funded set of addresses
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

fn deploy_contract(env: &Env) -> RoteraContractClient {
    let contract_id = env.register(RoteraContract, ());
    RoteraContractClient::new(env, &contract_id)
}

fn circle_name(env: &Env) -> Bytes {
    Bytes::from_slice(env, b"Test Circle")
}

// ════════════════════════════════════════════════════════════════════════════
// create_circle tests
// ════════════════════════════════════════════════════════════════════════════

#[test]
fn test_create_circle_success() {
    let (env, organizer, members) = setup_env();
    let client = deploy_contract(&env);

    let circle_id = client.create_circle(
        &organizer,
        &circle_name(&env),
        &100_0000000i128, // 100 XLM (7 decimals)
        &7u32,
        &members,
        &PayoutOrderType::Manual,
    );

    assert_eq!(circle_id, 1u64);
    let state = client.get_status(&circle_id);
    assert_eq!(state.status, CircleStatus::Filling);
    assert_eq!(state.member_count, 5);
    assert_eq!(state.contribution_amount, 100_0000000);
    assert_eq!(state.cycle_length_days, 7);
}

#[test]
#[should_panic(expected = "member count must be between 3 and 12")]
fn test_create_circle_too_few_members() {
    let (env, organizer, _) = setup_env();
    let client = deploy_contract(&env);
    let mut two_members: Vec<Address> = Vec::new(&env);
    two_members.push_back(organizer.clone());
    two_members.push_back(Address::generate(&env));
    client.create_circle(&organizer, &circle_name(&env), &100, &7, &two_members, &PayoutOrderType::Manual);
}

#[test]
#[should_panic(expected = "contribution_amount must be positive")]
fn test_create_circle_zero_amount() {
    let (env, organizer, members) = setup_env();
    let client = deploy_contract(&env);
    client.create_circle(&organizer, &circle_name(&env), &0, &7, &members, &PayoutOrderType::Manual);
}

// ════════════════════════════════════════════════════════════════════════════
// join_circle tests
// ════════════════════════════════════════════════════════════════════════════

#[test]
fn test_join_circle_all_members_activates() {
    let (env, organizer, members) = setup_env();
    let client = deploy_contract(&env);

    let circle_id = client.create_circle(
        &organizer, &circle_name(&env), &100_0000000, &7, &members, &PayoutOrderType::Manual,
    );

    // All members join
    for member in members.iter() {
        client.join_circle(&member, &circle_id);
    }

    let state = client.get_status(&circle_id);
    assert_eq!(state.status, CircleStatus::Active);
    assert_eq!(state.current_cycle, 1);
}

#[test]
fn test_join_circle_partial_stays_filling() {
    let (env, organizer, members) = setup_env();
    let client = deploy_contract(&env);
    let circle_id = client.create_circle(
        &organizer, &circle_name(&env), &100_0000000, &7, &members, &PayoutOrderType::Manual,
    );
    // Only 2 of 5 join
    client.join_circle(&members.get(0).unwrap(), &circle_id);
    client.join_circle(&members.get(1).unwrap(), &circle_id);

    let state = client.get_status(&circle_id);
    assert_eq!(state.status, CircleStatus::Filling);
}

#[test]
#[should_panic(expected = "you have already joined this circle")]
fn test_join_circle_double_join_panics() {
    let (env, organizer, members) = setup_env();
    let client = deploy_contract(&env);
    let circle_id = client.create_circle(
        &organizer, &circle_name(&env), &100_0000000, &7, &members, &PayoutOrderType::Manual,
    );
    client.join_circle(&organizer, &circle_id);
    client.join_circle(&organizer, &circle_id); // should panic
}

// ════════════════════════════════════════════════════════════════════════════
// contribute + close_cycle tests
// ════════════════════════════════════════════════════════════════════════════

fn activate_circle(env: &Env, client: &RoteraContractClient, members: &Vec<Address>) -> u64 {
    let circle_id = client.create_circle(
        &members.get(0).unwrap(),
        &circle_name(env),
        &50_0000000i128,
        &7,
        members,
        &PayoutOrderType::Manual,
    );
    for m in members.iter() {
        client.join_circle(&m, &circle_id);
    }
    circle_id
}

#[test]
fn test_contribute_records_payment() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let circle_id = activate_circle(&env, &client, &members);

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
    let circle_id = activate_circle(&env, &client, &members);

    let member = members.get(0).unwrap();
    client.contribute(&member, &circle_id);
    client.contribute(&member, &circle_id); // should panic
}

#[test]
fn test_close_cycle_all_paid_advances_cycle() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let circle_id = activate_circle(&env, &client, &members);

    // All members contribute
    for m in members.iter() {
        client.contribute(&m, &circle_id);
    }

    // Advance time past deadline
    env.ledger().with_mut(|li| {
        li.timestamp = li.timestamp + (8 * 86400); // +8 days
    });

    client.close_cycle(&circle_id);

    let state = client.get_status(&circle_id);
    assert_eq!(state.current_cycle, 2); // advanced to cycle 2
}

#[test]
fn test_close_cycle_missed_payments_tracked() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let circle_id = activate_circle(&env, &client, &members);

    // Only 3 of 5 contribute
    client.contribute(&members.get(0).unwrap(), &circle_id);
    client.contribute(&members.get(1).unwrap(), &circle_id);
    client.contribute(&members.get(2).unwrap(), &circle_id);
    // members[3] and members[4] miss

    env.ledger().with_mut(|li| {
        li.timestamp = li.timestamp + (8 * 86400);
    });

    client.close_cycle(&circle_id);

    let state = client.get_status(&circle_id);
    let ms3 = state.member_states.get(members.get(3).unwrap()).unwrap();
    let ms4 = state.member_states.get(members.get(4).unwrap()).unwrap();

    // Both should have 1 missed cycle and debt recorded
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
    let circle_id = activate_circle(&env, &client, &members);
    client.close_cycle(&circle_id); // deadline not passed
}

// ════════════════════════════════════════════════════════════════════════════
// Full rotation test — all cycles, all payouts
// ════════════════════════════════════════════════════════════════════════════

#[test]
fn test_full_rotation_completes() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let circle_id = activate_circle(&env, &client, &members);

    let total_cycles = members.len() as u64;

    for _ in 0..total_cycles {
        for m in members.iter() {
            client.contribute(&m, &circle_id);
        }
        env.ledger().with_mut(|li| {
            li.timestamp = li.timestamp + (8 * 86400);
        });
        client.close_cycle(&circle_id);
    }

    let state = client.get_status(&circle_id);
    assert_eq!(state.status, CircleStatus::Completed);
    assert_eq!(state.cycles.len(), total_cycles as u32);
}

// ════════════════════════════════════════════════════════════════════════════
// Deposit withdrawal test
// ════════════════════════════════════════════════════════════════════════════

#[test]
fn test_withdraw_deposit_after_completion() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let circle_id = activate_circle(&env, &client, &members);
    let total_cycles = members.len() as u64;

    for _ in 0..total_cycles {
        for m in members.iter() { client.contribute(&m, &circle_id); }
        env.ledger().with_mut(|li| { li.timestamp = li.timestamp + (8 * 86400); });
        client.close_cycle(&circle_id);
    }

    // Should not panic — circle is complete and no debt
    client.withdraw_deposit(&members.get(0).unwrap(), &circle_id);
}

#[test]
#[should_panic(expected = "circle has not completed yet")]
fn test_withdraw_deposit_before_completion_panics() {
    let (env, _, members) = setup_env();
    let client = deploy_contract(&env);
    let circle_id = activate_circle(&env, &client, &members);
    client.withdraw_deposit(&members.get(0).unwrap(), &circle_id);
}
