#![no_std]

/// Rotera ROSCA (Rotating Savings and Credit Association) Smart Contract
///
/// This contract manages on-chain rotating savings circles on Stellar/Soroban.
/// A fixed group of people contribute the same amount on a regular schedule;
/// each cycle, the full pot goes to one member in turn.
///
/// Core functions:
/// - create_circle: Organizer sets up a new circle
/// - join_circle: Member confirms their seat
/// - contribute: Member sends their share for the current cycle
/// - close_cycle: Closes cycle, releases pot to recipient, advances rotation
/// - get_status: Read current circle state for the dashboard

use soroban_sdk::{contract, contractimpl, Env};

#[contract]
pub struct RoteraContract;

#[contractimpl]
impl RoteraContract {
    /// Placeholder — full implementation in Commits 6-8
    pub fn hello(env: Env) -> soroban_sdk::Vec<soroban_sdk::Symbol> {
        let _ = &env;
        soroban_sdk::vec![&env, soroban_sdk::symbol_short!("rotera")]
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::Env;

    #[test]
    fn test_hello() {
        let env = Env::default();
        let contract_id = env.register(RoteraContract, ());
        let client = RoteraContractClient::new(&env, &contract_id);
        let result = client.hello();
        assert_eq!(result.len(), 1);
    }
}
