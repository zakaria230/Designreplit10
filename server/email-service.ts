import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import * as crypto from 'crypto';

// Simple email verification system (without actual email sending)
export class EmailService {
  /**
   * Generate a verification token for a user
   */
  static async generateVerificationToken(userId: number): Promise<string> {
    // Generate a random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiry to 24 hours from now
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24);
    
    // Update the user with the verification token
    await db.update(users)
      .set({
        emailVerificationToken: token,
        emailVerificationTokenExpiry: tokenExpiry
      })
      .where(eq(users.id, userId));
    
    return token;
  }
  
  /**
   * Verify a user's email with a token
   */
  static async verifyEmail(token: string): Promise<{ success: boolean, message: string }> {
    try {
      // Find user with this token
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.emailVerificationToken, token));
      
      if (!user) {
        return {
          success: false,
          message: 'التحقق غير صالح أو انتهت صلاحيته'
        };
      }
      
      // Check if token has expired
      if (user.emailVerificationTokenExpiry && new Date() > new Date(user.emailVerificationTokenExpiry)) {
        return {
          success: false,
          message: 'انتهت صلاحية رابط التحقق'
        };
      }
      
      // Update user as verified
      await db.update(users)
        .set({
          isEmailVerified: true,
          emailVerificationToken: null,
          emailVerificationTokenExpiry: null
        })
        .where(eq(users.id, user.id));
      
      return {
        success: true,
        message: 'تم التحقق من البريد الإلكتروني بنجاح'
      };
    } catch (error) {
      console.error('Error verifying email:', error);
      return {
        success: false,
        message: 'حدث خطأ أثناء التحقق من البريد الإلكتروني'
      };
    }
  }
  
  /**
   * Check if a user has verified their email
   */
  static async isEmailVerified(userId: number): Promise<boolean> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    return !!user?.isEmailVerified;
  }
  
  /**
   * Simulates sending a verification email (in the real world, this would use SendGrid or another service)
   */
  static simulateSendVerificationEmail(user: { id: number, email: string }, token: string): void {
    // In a real implementation, this would send an actual email
    console.log(`Simulating email to: ${user.email}`);
    console.log(`Verification URL: ${process.env.SITE_URL || 'http://localhost:5000'}/verify-email?token=${token}`);
  }
}