#![no_std]

use soroban_sdk::{contract, contractimpl, Env, symbol_short};

#[contract]
pub struct SavingsGoalContract;

#[contractimpl]
impl SavingsGoalContract {
    /// Initialize the savings goal contract with a target amount
    pub fn init(env: Env, target: i128) {
        let target_key = symbol_short!("target");
        let saved_key = symbol_short!("saved");
        
        if env.storage().instance().has(&target_key) {
            core::panic!("Contract is already initialized");
        }
        
        env.storage().instance().set(&target_key, &target);
        env.storage().instance().set(&saved_key, &0i128);
    }

    /// Contribute to the savings goal
    pub fn contribute(env: Env, amount: i128) -> i128 {
        core::assert!(amount > 0, "Contribution must be greater than zero");
        
        let saved_key = symbol_short!("saved");
        let saved: i128 = env.storage().instance().get(&saved_key).unwrap_or(0);
        let new_saved = saved + amount;
        
        env.storage().instance().set(&saved_key, &new_saved);
        new_saved
    }

    /// Get the current state of the savings goal
    pub fn get_state(env: Env) -> (i128, i128) {
        let target_key = symbol_short!("target");
        let saved_key = symbol_short!("saved");
        
        let target: i128 = env.storage().instance().get(&target_key).unwrap_or(0);
        let saved: i128 = env.storage().instance().get(&saved_key).unwrap_or(0);
        
        (target, saved)
    }
}