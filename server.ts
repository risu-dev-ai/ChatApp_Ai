import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // Lazy initialize Gemini
  let ai: GoogleGenAI | null = null;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      console.log("Gemini API initialized successfully.");
    } catch (err) {
      console.error("Error initializing Gemini API:", err);
    }
  } else {
    console.warn("GEMINI_API_KEY not found in environment variables.");
  }

  // OTP In-Memory Storage Cache
  const otpStore = new Map<string, { otp: string; expiresAt: number }>();

  // API endpoint for generating & dispatching OTP
  app.post("/api/otp/send", async (req: express.Request, res: express.Response) => {
    try {
      const { type, target, channel } = req.body;
      if (!target) {
        return res.status(400).json({ error: "Verification target (email or phone) is required." });
      }

      // Generate a 6-digit secure numeric OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Expire in 5 minutes
      otpStore.set(target.toLowerCase().trim(), {
        otp: generatedOtp,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      console.log(`[OTP Engine] Generated OTP ${generatedOtp} for ${target} via channel ${channel || 'auto'}`);

      let deliveryStatus = "simulated";
      let statusDetails = "";

      // 1. TELEGRAM DISPATCH (Real, completely free verification!)
      if (channel === "telegram" || (type === "phone" && channel === "telegram")) {
        const tgToken = process.env.TELEGRAM_BOT_TOKEN;
        const tgChatId = process.env.TELEGRAM_CHAT_ID;
        
        if (tgToken && tgChatId) {
          try {
            const tgUrl = `https://api.telegram.org/bot${tgToken}/sendMessage`;
            const tgRes = await fetch(tgUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: tgChatId,
                text: `🔒 BakBak AI OTP Verification Code: ${generatedOtp}\n\nThis code is valid for 5 minutes. Please do not share it with anyone.`,
              }),
            });
            const tgData = await tgRes.json();
            if (tgData.ok) {
              deliveryStatus = "sent";
              statusDetails = "Real-time OTP delivered instantly to configured Telegram Bot.";
            } else {
              console.warn("Telegram API responded with error:", tgData);
              statusDetails = `Telegram delivery failed: ${tgData.description || "Unknown error"}. Falling back to sandbox mode.`;
            }
          } catch (err: any) {
            console.error("Telegram delivery exception:", err);
            statusDetails = `Telegram network error. Falling back to sandbox mode.`;
          }
        } else {
          statusDetails = "Telegram config missing in environment variables. Simulated sandbox delivery used.";
        }
      } 
      // 2. SMTP EMAIL DISPATCH (Real email verification!)
      else if (channel === "email" || type === "email") {
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;
        
        if (smtpUser && smtpPass) {
          try {
            const transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST || "smtp.gmail.com",
              port: parseInt(process.env.SMTP_PORT || "587"),
              secure: process.env.SMTP_PORT === "465",
              auth: {
                user: smtpUser,
                pass: smtpPass,
              },
            });

            await transporter.sendMail({
              from: `"BakBak AI OTP" <${smtpUser}>`,
              to: target.toLowerCase().trim(),
              subject: "🔒 BakBak AI OTP Verification Code",
              text: `Your BakBak AI Verification OTP is: ${generatedOtp}. Valid for 5 minutes.`,
              html: `<div style="font-family: sans-serif; padding: 24px; background-color: #0c0a09; color: #f4f4f5; border-radius: 16px; max-width: 460px; margin: 0 auto; border: 1px solid #27272a; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                       <div style="text-align: center; margin-bottom: 20px;">
                         <span style="font-size: 24px; font-weight: bold; color: #f59e0b;">BakBak AI</span>
                         <p style="font-size: 10px; color: #71717a; text-transform: uppercase; letter-spacing: 2px; margin: 4px 0 0 0;">Secure E2EE Chat Authentication</p>
                       </div>
                       <hr style="border: 0; border-top: 1px solid #27272a; margin: 16px 0;" />
                       <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5; text-align: center;">You requested a secure verification code to access your BakBak AI messenger client. Use the 6-digit OTP code below:</p>
                       <div style="font-size: 34px; font-weight: 800; color: #f59e0b; background-color: #1c1917; padding: 18px; border-radius: 12px; text-align: center; letter-spacing: 6px; margin: 24px 0; border: 1px solid #3f3f46; font-family: monospace;">
                         ${generatedOtp}
                       </div>
                       <p style="font-size: 11px; color: #71717a; text-align: center; margin-bottom: 0;">This code is valid for exactly 5 minutes. If you did not request this code, you can safely ignore this email.</p>
                     </div>`,
            });
            deliveryStatus = "sent";
            statusDetails = `Real-time OTP email sent successfully to ${target}.`;
          } catch (err: any) {
            console.error("SMTP sending exception:", err);
            statusDetails = `Email SMTP server error. Falling back to sandbox mode.`;
          }
        } else {
          statusDetails = "SMTP credentials missing in environment variables. Simulated sandbox delivery used.";
        }
      }
      // 3. WHATSAPP DISPATCH (Free Sandbox delivery with simulated push notifications)
      else if (channel === "whatsapp") {
        statusDetails = "WhatsApp OTP simulated in sandbox mode. For real free automated mobile delivery, we recommend using the Telegram channel.";
      }

      // Format a beautiful on-screen notification text
      const simulatedNotification = channel === "whatsapp" 
        ? `💬 WhatsApp Push Alert: "Your BakBak AI verification code is ${generatedOtp}. Valid for 5m."`
        : channel === "telegram"
        ? `✈️ Telegram Bot Alert: "Your BakBak AI verification code is ${generatedOtp}. Valid for 5m."`
        : `📧 Email Inbox Alert: "Your BakBak AI verification code is ${generatedOtp}. Valid for 5m."`;

      res.json({
        success: true,
        channel,
        type,
        target,
        deliveryStatus,
        statusDetails,
        otp: generatedOtp, // Return code so sandbox mode is 100% functional and testable without keys
        simulatedNotification,
      });
    } catch (err: any) {
      console.error("OTP send error:", err);
      res.status(500).json({ error: err.message || "Failed to generate or dispatch OTP." });
    }
  });

  // API endpoint for checking & verifying OTP
  app.post("/api/otp/verify", (req: express.Request, res: express.Response) => {
    try {
      const { target, otp } = req.body;
      if (!target || !otp) {
        return res.status(400).json({ error: "Target (email/phone) and OTP are both required." });
      }

      const key = target.toLowerCase().trim();
      const stored = otpStore.get(key);

      if (!stored) {
        return res.status(400).json({ error: "No OTP was requested for this Email or Phone." });
      }

      if (Date.now() > stored.expiresAt) {
        otpStore.delete(key);
        return res.status(400).json({ error: "This OTP has expired. Please request a new one." });
      }

      if (stored.otp !== otp.trim()) {
        return res.status(400).json({ error: "Invalid verification code. Please check and try again." });
      }

      // OTP is valid!
      otpStore.delete(key);
      res.json({ success: true, message: "Verification successful!" });
    } catch (err: any) {
      console.error("OTP verification error:", err);
      res.status(500).json({ error: err.message || "Verification process failed." });
    }
  });

  // API endpoint for secure chat assistant
  app.post("/api/chat", async (req: express.Request, res: express.Response) => {
    try {
      const { message, history } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required." });
      }

      if (!ai) {
        // Fallback response when GEMINI_API_KEY is not defined, to guarantee a running app
        return res.json({
          text: `[offline-mode] Hello! I am BakBak AI, running in local-offline mock mode. To connect me to the real Gemini model, please configure the GEMINI_API_KEY in the Secrets panel. Here is a simulated answer to your message: "${message}". Let me know if you want to explore the client-side AES-256 encryption, custom theme presets, or place a simulated video call!`,
        });
      }

      const systemPrompt = `You are 'BakBak AI', a helpful, extremely responsive AI assistant embedded in a high-performance chat client styled exactly like a premium mobile app. Be concise, friendly, helpful, and emulate a natural chat companion. 
      If asked about your features, highlight that you have:
      1. Sunset Glow, Gemini Cyberpunk, Desi Forest, and Neon Blue custom dark theme presets.
      2. Secure End-to-End Encryption (E2EE) with secret keys.
      3. Native-feel 120Hz smooth transitions, scroll states, and chat lists.
      4. Dynamic Contacts Synchronizer (import and manage local address book friends).
      5. Full Profile management with a real-time camera snapshot profile-pic capturer.
      6. WebRTC-emulated Voice & Video calling system with active camera/mic feed preview.
      7. Room DB-inspired client-side persistence so chats never lose their state.
      Always respond in markdown but keep it compact and highly suitable for standard mobile chat bubbles (avoid extremely long lists unless requested). Use modern friendly emojis occasionally!`;

      // Structure history correctly for @google/genai
      const contents = [];
      if (history && Array.isArray(history)) {
        for (const msg of history) {
          contents.push({
            role: msg.role === "assistant" || msg.role === "model" ? "model" : "user",
            parts: [{ text: msg.content }],
          });
        }
      }

      contents.push({
        role: "user",
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        },
      });

      res.json({ text: response.text });
    } catch (err: any) {
      console.error("Gemini API error:", err);
      res.status(500).json({ error: err.message || "An error occurred with Gemini API." });
    }
  });

  // Serve static/vite files based on environment
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware loaded.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled production assets from dist/ folder.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
