export const DONATION_INTERVAL_DAYS = 90;

export function getEligibilityStatus(lastDonationDate?: string) {
  if (!lastDonationDate) return { isEligible: true, daysLeft: 0, nextDate: new Date() };

  const lastDate = new Date(lastDonationDate);
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + DONATION_INTERVAL_DAYS);

  const today = new Date();
  const diffTime = nextDate.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    isEligible: daysLeft <= 0,
    daysLeft: daysLeft > 0 ? daysLeft : 0,
    nextDate
  };
}
