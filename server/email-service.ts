import { randomBytes } from "crypto";
import { db } from "./db";
import { emailVerificationTokens, users } from "@shared/schema";
import { eq } from "drizzle-orm";

export class EmailService {
  /**
   * Generate a verification token for a user
   */
  static async generateVerificationToken(userId: number): Promise<string> {
    // Delete any existing tokens for this user
    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, userId));
    
    // Generate a secure random token
    const token = randomBytes(32).toString("hex");
    
    // Store the token with a 24-hour expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    await db.insert(emailVerificationTokens).values({
      token,
      userId,
      expiresAt,
    });
    
    return token;
  }
  
  /**
   * Verify a user's email with a token
   */
  static async verifyEmail(token: string): Promise<{ success: boolean, message: string }> {
    try {
      // Find the token in the database
      const [verificationRecord] = await db
        .select()
        .from(emailVerificationTokens)
        .where(eq(emailVerificationTokens.token, token));
      
      if (!verificationRecord) {
        return { 
          success: false, 
          message: "Verification token not found. The link may be invalid or expired." 
        };
      }
      
      // Check if token is expired
      const now = new Date();
      if (now > verificationRecord.expiresAt) {
        // Remove the expired token
        await db
          .delete(emailVerificationTokens)
          .where(eq(emailVerificationTokens.id, verificationRecord.id));
          
        return { 
          success: false, 
          message: "Verification token has expired. Please request a new verification email." 
        };
      }
      
      // Update the user's verification status
      await db
        .update(users)
        .set({ isEmailVerified: true })
        .where(eq(users.id, verificationRecord.userId));
      
      // Remove the used token
      await db
        .delete(emailVerificationTokens)
        .where(eq(emailVerificationTokens.id, verificationRecord.id));
      
      return { 
        success: true, 
        message: "Your email has been successfully verified! You now have full access to all features."
      };
    } catch (error) {
      console.error("Email verification error:", error);
      return { 
        success: false, 
        message: "An error occurred during verification. Please try again later."
      };
    }
  }
  
  /**
   * Check if a user has verified their email
   */
  static async isEmailVerified(userId: number): Promise<boolean> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      
      return user?.isEmailVerified || false;
    } catch (error) {
      console.error("Error checking email verification status:", error);
      return false;
    }
  }
  
  /**
   * Simulates sending a verification email (in the real world, this would use SendGrid or another service)
   */
  static simulateSendVerificationEmail(user: { id: number, email: string }, token: string): void {
    // Build the verification URL - in real implementation, this would be an environment variable
    const verificationUrl = `${process.env.APP_URL || 'http://localhost:5000'}/verify-email?token=${token}`;
    
    // Log the verification link for testing purposes
    console.log(`\n==================================================`);
    console.log(`VERIFICATION EMAIL (SIMULATION)`);
    console.log(`==================================================`);
    console.log(`To: ${user.email}`);
    console.log(`Subject: Verify your email address for DesignKorv`);
    console.log(`--------------------------------------------------`);
    console.log(`Hello,`);
    console.log(`\nPlease verify your email address by clicking the link below:`);
    console.log(`\n${verificationUrl}`);
    console.log(`\nThis link will expire in 24 hours.`);
    console.log(`\nIf you did not create an account with us, please ignore this email.`);
    console.log(`\nThank you,\nThe DesignKorv Team`);
    console.log(`==================================================\n`);
    
    // In a real-world implementation, you would use SendGrid or similar service:
    /*
    const msg = {
      to: user.email,
      from: 'noreply@designkorv.com',
      subject: 'Verify your email address for DesignKorv',
      text: `Please verify your email address by clicking the link below:\n\n${verificationUrl}\n\nThis link will expire in 24 hours.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify your email address</h2>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
            Verify Email
          </a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all;"><a href="${verificationUrl}">${verificationUrl}</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not create an account with us, please ignore this email.</p>
          <p>Thank you,<br>The DesignKorv Team</p>
        </div>
      `,
    };
    sgMail.send(msg);
    */
  }
}