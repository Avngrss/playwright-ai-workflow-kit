export const customerUser = {
  email:
    process.env.PRACTICE_SOFTWARE_TESTING_EMAIL ??
    "customer@practicesoftwaretesting.com",
  password: process.env.PRACTICE_SOFTWARE_TESTING_PASSWORD ?? "welcome01",
};

export const secondaryCustomerUser = {
  email:
    process.env.PRACTICE_SOFTWARE_TESTING_EMAIL_SECONDARY ??
    "customer2@practicesoftwaretesting.com",
  password:
    process.env.PRACTICE_SOFTWARE_TESTING_PASSWORD_SECONDARY ?? "welcome01",
};
