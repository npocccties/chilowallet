export const validateEmail = (email: string): boolean => {
  const emailPattern = /^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  return emailPattern.test(email);
};
