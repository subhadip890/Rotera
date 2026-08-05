use soroban_sdk::contracterror;

/// Rotera contract error codes.
/// These map to human-readable messages in the frontend error handling layer.
#[contracterror]
#[derive(Clone, Debug, Copy, PartialEq)]
#[repr(u32)]
pub enum RoteraError {
    // Input validation
    InvalidContributionAmount = 1,
    InvalidMemberCount = 2,
    InvalidCycleLength = 3,

    // Circle state
    CircleNotFound = 10,
    CircleNotFilling = 11,
    CircleNotActive = 12,
    CircleAlreadyCompleted = 13,

    // Member errors
    NotAMember = 20,
    AlreadyJoined = 21,
    AlreadyContributed = 22,
    NotAMemberOfCircle = 23,

    // Timing errors
    DeadlineNotPassed = 30,
    DeadlinePassed = 31,

    // Deposit errors
    OutstandingDebt = 40,
    DepositAlreadyWithdrawn = 41,
}
