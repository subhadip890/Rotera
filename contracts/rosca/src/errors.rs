use soroban_sdk::contracterror;

/// Rotera contract error codes.
/// These map to human-readable messages in the frontend error handling layer.
#[contracterror]
#[derive(Clone, Debug, Copy, PartialEq)]
#[repr(u32)]
pub enum RoteraError {
    // Input validation (1..9)
    InvalidContributionAmount = 1,
    InvalidMemberCount = 2,
    InvalidCycleLength = 3,
    InvalidRepaymentAmount = 4,
    OverpaymentNotAllowed = 5,
    NoOutstandingDebt = 6,

    // Circle state (10..19)
    CircleNotFound = 10,
    CircleNotFilling = 11,
    CircleNotActive = 12,
    CircleAlreadyCompleted = 13,
    CircleAlreadyFull = 14,
    CircleNotCompleted = 15,

    // Member errors (20..29)
    NotAMember = 20,
    AlreadyJoined = 21,
    AlreadyContributed = 22,
    NotAMemberOfCircle = 23,

    // Timing errors (30..39)
    DeadlineNotPassed = 30,
    DeadlinePassed = 31,

    // Deposit errors (40..49)
    OutstandingDebt = 40,
    DepositAlreadyWithdrawn = 41,
}

