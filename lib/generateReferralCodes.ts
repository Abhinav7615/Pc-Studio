import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { generateUniqueReferralCode } from '@/lib/referral';

export async function generateReferralCodesForExistingUsers() {
  try {
    await dbConnect();

    const usersWithoutReferralCodes = await User.find({
      referralCode: { $exists: false }
    });

    console.log(`Found ${usersWithoutReferralCodes.length} users without referral codes`);

    for (const user of usersWithoutReferralCodes) {
      try {
        const referralCode = await generateUniqueReferralCode();
        user.referralCode = referralCode;
        await user.save();
        console.log(`Generated referral code ${referralCode} for user ${user.email}`);
      } catch (error) {
        console.error(`Failed to generate referral code for user ${user.email}:`, error);
      }
    }

    console.log('Referral code generation completed');
  } catch (error) {
    console.error('Error in generateReferralCodesForExistingUsers:', error);
  }
}