export type VestAccountType = '' | 'personal' | 'business';
export type VestCountry = '' | 'US' | 'DE' | 'NL' | 'BE';

export interface VestValidationModel {
  accountType: VestAccountType;
  country: VestCountry;
  companyName: string;
  workEmail: string;
  teamSize: string;
  vatNumber: string;
  referralCode: string;
}

export function createVestValidationModel(): VestValidationModel {
  return {
    accountType: '',
    country: '',
    companyName: '',
    workEmail: '',
    teamSize: '1',
    vatNumber: '',
    referralCode: '',
  };
}
