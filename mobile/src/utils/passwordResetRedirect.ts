type PasswordResetLoginDetails = {
  schoolCode: string;
  email: string;
  password: string;
};

let pendingLoginDetails: PasswordResetLoginDetails | null = null;

export function setPasswordResetLoginDetails(
  details: PasswordResetLoginDetails
) {
  pendingLoginDetails = details;
}

export function consumePasswordResetLoginDetails(): PasswordResetLoginDetails | null {
  const details = pendingLoginDetails;
  pendingLoginDetails = null;
  return details;
}
