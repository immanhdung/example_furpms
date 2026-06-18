export const AUTH_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful.',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  TOKEN_EXPIRED: 'Token has expired.',
  TOKEN_INVALID: 'Invalid token.',
  UNAUTHORIZED: 'Unauthorized access.',
  FORBIDDEN: 'Access forbidden. Insufficient permissions.',
  PASSWORD_CHANGED: 'Password changed successfully.',
  PASSWORD_MISMATCH: 'New password and confirmation do not match.',
  WRONG_CURRENT_PASSWORD: 'Current password is incorrect.',
};

export const USER_MESSAGES = {
  CREATED: 'User created successfully.',
  UPDATED: 'User updated successfully.',
  FETCHED: 'User retrieved successfully.',
  LIST_FETCHED: 'Users retrieved successfully.',
  NOT_FOUND: 'User not found.',
  EMAIL_EXISTS: 'Email already exists.',
  PROFILE_UPDATED: 'Academic profile updated successfully.',
  PROFILE_FETCHED: 'Academic profile retrieved successfully.',
};

export const CYCLE_MESSAGES = {
  CREATED: 'Cycle created successfully.',
  UPDATED: 'Cycle updated successfully.',
  CONFIGURED: 'Cycle configured successfully.',
  FETCHED: 'Cycle retrieved successfully.',
  LIST_FETCHED: 'Cycles retrieved successfully.',
  NOT_FOUND: 'Cycle not found.',
  OPENED: 'Cycle opened successfully.',
  CLOSED: 'Cycle closed successfully.',
  CANNOT_OPEN: 'Cycle cannot be opened in current state.',
  CANNOT_CLOSE: 'Cycle cannot be closed in current state.',
};

export const TRACK_MESSAGES = {
  CREATED: 'Track created successfully.',
  UPDATED: 'Track updated successfully.',
  FETCHED: 'Track retrieved successfully.',
  LIST_FETCHED: 'Tracks retrieved successfully.',
  NOT_FOUND: 'Track not found.',
  DEACTIVATED: 'Track deactivated successfully.',
  OWNER_ASSIGNED: 'Track owner assigned successfully.',
};

export const PROPOSAL_MESSAGES = {
  CREATED: 'Proposal created successfully.',
  UPDATED: 'Proposal updated successfully.',
  FETCHED: 'Proposal retrieved successfully.',
  LIST_FETCHED: 'Proposals retrieved successfully.',
  NOT_FOUND: 'Proposal not found.',
  SUBMITTED: 'Proposal submitted successfully.',
  WITHDRAWN: 'Proposal withdrawn successfully.',
  CANNOT_EDIT: 'Proposal cannot be edited in current status.',
  CANNOT_SUBMIT: 'Only DRAFT proposals can be submitted.',
  CANNOT_WITHDRAW: 'Only SUBMITTED proposals can be withdrawn.',
  NOT_OWNER: 'Only the Principal Investigator can perform this action.',
};

export const CONTRACT_MESSAGES = {
  CREATED: 'Contract created successfully.',
  FETCHED: 'Contract retrieved successfully.',
  LIST_FETCHED: 'Contracts retrieved successfully.',
  NOT_FOUND: 'Contract not found.',
  SIGNED: 'Contract signed successfully.',
};

export const COUNCIL_MESSAGES = {
  CREATED: 'Council established successfully.',
  FETCHED: 'Council retrieved successfully.',
  LIST_FETCHED: 'Councils retrieved successfully.',
  NOT_FOUND: 'Council not found.',
  MEMBER_ADDED: 'Council member added successfully.',
  MEMBER_REMOVED: 'Council member removed successfully.',
  RESPONDED: 'Response recorded successfully.',
  CONFIRMED: 'Council result confirmed successfully.',
  ALREADY_CONFIRMED: 'Council result has already been confirmed.',
};

export const RESEARCH_TYPE_MESSAGES = {
  CREATED: 'Research type created successfully.',
  UPDATED: 'Research type updated successfully.',
  FETCHED: 'Research type retrieved successfully.',
  LIST_FETCHED: 'Research types retrieved successfully.',
  NOT_FOUND: 'Research type not found.',
};

export const APPLIED_TOPIC_MESSAGES = {
  CREATED: 'Applied topic created successfully.',
  IMPORTED: 'Applied topics imported successfully.',
  FETCHED: 'Applied topic retrieved successfully.',
  LIST_FETCHED: 'Applied topics retrieved successfully.',
  NOT_FOUND: 'Applied topic not found.',
  DELETED: 'Applied topic deleted successfully.',
};

export const ROUND_MESSAGES = {
  CREATED: 'Review round created successfully.',
  LIST_FETCHED: 'Review rounds retrieved successfully.',
  NOT_FOUND: 'Review round not found.',
  OPENED: 'Review round opened successfully.',
  CLOSED: 'Review round closed successfully.',
  PREREQUISITE_NOT_PASSED: 'Prerequisite round has not passed yet.',
  MEMBER_ADDED: 'Reviewer assigned successfully.',
  MEMBER_REMOVED: 'Reviewer assignment removed.',
};

export const SCORE_MESSAGES = {
  SUBMITTED: 'Score submitted successfully.',
  FETCHED: 'Scores retrieved successfully.',
  NOT_FOUND: 'Score not found.',
  DECISION_MADE: 'Council decision finalized.',
  DECISION_FETCHED: 'Council decision retrieved.',
};

export const NOTIFICATION_MESSAGES = {
  LIST_FETCHED: 'Notifications retrieved successfully.',
  MARKED_READ: 'Notification marked as read.',
  ALL_MARKED_READ: 'All notifications marked as read.',
  COUNT_FETCHED: 'Unread count retrieved.',
};

export const GENERAL_MESSAGES = {
  CREATED: 'Created successfully.',
  UPDATED: 'Updated successfully.',
  DELETED: 'Deleted successfully.',
  FETCHED: 'Retrieved successfully.',
  LIST_FETCHED: 'List retrieved successfully.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Validation failed.',
  INTERNAL_ERROR: 'An internal server error occurred.',
  CONFLICT: 'Operation conflicts with current state.',
};
