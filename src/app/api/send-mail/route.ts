import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  const transporter = nodemailer.createTransport({
    service: "postfix",
    host: "localhost",
    secure: false,
    port: 25,
    auth: {
      user: "no-replay@mannosutisnadev.com",
      pass: "hoefjeniet",
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: "no-reply@mannosutisnadev.com",
    to: "mannosutisnahiras@gmail.com",
    subject: "Sending Email using Node.js from server",
    text: "That was easy! I'm very glad it was!",
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log({ result });
  } catch (e) {
    console.error(e);
  }

  return NextResponse.json({ data: "success" }, { status: 201 });
}
