// Function to check the strength of the password and classify as Strong, Medium, or Weak
export function evaluatePasswordStrength(password: string): string {
  const strongLength = 12;
  const mediumLength = 8;
  const strongRegex = new RegExp(
    `^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{${strongLength},})`
  );
  const mediumRegex = new RegExp(
    `^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{${mediumLength},})`
  );

  if (strongRegex.test(password)) {
    return "Strong";
  } else if (mediumRegex.test(password)) {
    return "Medium";
  } else {
    return "Weak";
  }
}
