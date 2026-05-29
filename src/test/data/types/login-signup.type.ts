export type LoginCredentials = {
  email: string;
  password: string;
};

export type SignupEntryData = {
  name: string;
  email: string;
};

export type SignupAccountInfoData = {
  password: string;
  day: string;
  month: string;
  year: string;
  firstName: string;
  lastName: string;
  address: string;
  country: string;
  state: string;
  city: string;
  zipcode: string;
  mobileNumber: string;
};

export type SignupUserData = SignupEntryData & SignupAccountInfoData;
